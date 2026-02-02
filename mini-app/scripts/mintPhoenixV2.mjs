import { readFileSync } from 'fs';
import path from 'path';
import { createWalletClient, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { PinataSDK } from 'pinata';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.env.HOME, '.env') });
dotenv.config({ path: path.join(process.env.HOME, 'pepeArtGen-fork/mini-app/.env') });

const CONTRACT_ADDRESS = '0xcc2d6ba8564541e6e51fe5522e26d4f4bbdd458b';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PINATA_JWT = process.env.PINATA_JWT;

const NFT_ABI = [{
  inputs: [{ internalType: 'string', name: 'metadataURI', type: 'string' }],
  name: 'mint',
  outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
  stateMutability: 'payable',
  type: 'function'
}];

// Generate card HTML with NO margins for screenshot
function generateCardHTMLNoMargins(card, imageUrl) {
  const theme = card.theme || {};
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 400px; height: 560px; overflow: hidden; background: transparent; }
    .card {
      width: 400px; height: 560px; border-radius: 16px; overflow: hidden;
      background: ${theme.background || 'linear-gradient(145deg, #2a2a2a, #1a1a1a)'};
      display: flex; flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .card-header {
      padding: 12px 16px; display: flex; justify-content: space-between; align-items: flex-start;
      background: ${theme.header?.background || 'rgba(0,0,0,0.3)'};
      color: ${theme.header?.color || '#fff'};
    }
    .mana-cost { display: flex; gap: 6px; margin-bottom: 4px; }
    .mana-orb {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: bold; font-size: 12px;
    }
    .card-title { font-size: 18px; font-weight: bold; }
    .card-level {
      padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;
      background: ${theme.stat?.background || 'rgba(255,255,255,0.2)'};
      color: ${theme.stat?.color || '#fff'};
    }
    .image-area {
      flex: 1; margin: 8px 12px; border-radius: 8px; overflow: hidden;
      background: ${theme.imageArea?.background || 'rgba(0,0,0,0.2)'};
      display: flex; align-items: center; justify-content: center;
    }
    .card-image { width: 100%; height: 100%; object-fit: cover; }
    .type-power-section {
      padding: 8px 16px; display: flex; justify-content: space-between; align-items: center;
      background: ${theme.typeSection?.background || 'rgba(0,0,0,0.3)'};
      color: ${theme.typeSection?.color || '#fff'}; font-size: 14px;
    }
    .power-stats { display: flex; gap: 8px; }
    .stat {
      padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: bold;
      background: ${theme.stat?.background || 'rgba(255,255,255,0.2)'};
      color: ${theme.stat?.color || '#fff'};
    }
    .flavor-text {
      padding: 12px 16px; font-size: 13px; font-style: italic; line-height: 1.4;
      background: ${theme.flavorText?.background || 'rgba(0,0,0,0.2)'};
      color: ${theme.flavorText?.color || '#ccc'}; min-height: 80px;
    }
    .bottom-section {
      padding: 8px 16px; display: flex; justify-content: space-between; align-items: center;
      background: ${theme.bottomSection?.background || 'rgba(0,0,0,0.3)'};
    }
    .artist-info { font-size: 11px; color: ${theme.flavorText?.color || '#888'}; }
    .rarity-indicator {
      padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold;
      background: ${theme.rarity?.background || 'linear-gradient(135deg, gold, orange)'};
      color: ${theme.rarity?.color || '#000'};
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <div>
        <div class="mana-cost">
          ${(card.manaCost || []).map(m => `<div class="mana-orb" style="background:${m.color};color:${m.textColor||'#fff'}">${m.value}</div>`).join('')}
        </div>
        <div class="card-title">${card.name} ${card.subtitle || ''}</div>
      </div>
      <div class="card-level">LVL ${card.level || 1}</div>
    </div>
    <div class="image-area">
      <img class="card-image" src="${imageUrl}" alt="${card.name}" />
    </div>
    <div class="type-power-section">
      <div>${card.type || 'Creature'}</div>
      <div class="power-stats">
        <div class="stat">ATK: ${card.stats?.attack || 0}</div>
        <div class="stat">DEF: ${card.stats?.defense || 0}</div>
      </div>
    </div>
    <div class="flavor-text">${card.flavorText || ''}</div>
    <div class="bottom-section">
      <div class="artist-info">◆ ${card.artist || 'Waves TCG'} ◆</div>
      <div class="rarity-indicator">★ 1/1 ★</div>
    </div>
  </div>
</body>
</html>`;
}

async function renderCardToPNG(html) {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 560, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000)); // Wait for image
  const buffer = await page.screenshot({ type: 'png', omitBackground: true, clip: { x: 0, y: 0, width: 400, height: 560 } });
  await browser.close();
  return buffer;
}

async function main() {
  console.log('🚀 Phoenix mint V2 - Fixed margins & image\n');
  
  const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: 'gateway.pinata.cloud' });
  
  // Load phoenix card
  const data = JSON.parse(readFileSync(
    path.join(process.env.HOME, 'pepeArtGen-fork/mini-app/public/surfworks-cards.json'), 'utf8'
  ));
  const phoenix = data.cards.find(c => c.id === 'phoenix');
  console.log('📋 Card:', phoenix.name);
  
  // Use the existing surf-works image URL directly (no re-upload needed)
  const imageUrl = phoenix.image;
  console.log('🖼️  Image URL:', imageUrl);
  
  // Step 1: Render card with theme to PNG (no margins)
  console.log('\n📤 Rendering card PNG (no margins)...');
  const cardHTML = generateCardHTMLNoMargins(phoenix, imageUrl);
  const cardPngBuffer = await renderCardToPNG(cardHTML);
  const cardPngBlob = new Blob([cardPngBuffer], { type: 'image/png' });
  const cardPngUpload = await pinata.upload.public.file(new File([cardPngBlob], 'phoenix_card_v2.png'));
  console.log('✅ Card PNG:', cardPngUpload.cid);
  
  // Step 2: Upload HTML card (with proper image URL)
  console.log('\n📤 Uploading HTML card...');
  const htmlBlob = new Blob([cardHTML], { type: 'text/html' });
  const htmlUpload = await pinata.upload.public.file(new File([htmlBlob], 'phoenix_card_v2.html'));
  console.log('✅ HTML:', htmlUpload.cid);
  
  // Step 3: Create metadata with correct format
  console.log('\n📤 Creating metadata...');
  const metadata = {
    name: 'Feelsix ⟨Mythical⟩',
    description: '1/1 Legendary Card from the Waves Collection. Scorched Earth ⟨4M : Deal 1TD to all enemy cards⟩\\nPassive: Attacking places this card in the graveyard for one turn, after which it\'s returned to the players hand.',
    image: `https://gateway.pinata.cloud/ipfs/${cardPngUpload.cid}`,
    animation_url: `https://gateway.pinata.cloud/ipfs/${htmlUpload.cid}`,
    external_url: 'https://howlonghasitben.github.io/surf-works',
    attributes: [
      { trait_type: 'Rarity', value: '1/1' },
      { trait_type: 'Level', value: '3' },
      { trait_type: 'Attack', value: '3' },
      { trait_type: 'Defense', value: '4' },
      { trait_type: 'Theme', value: 'Phoenix Fire' },
      { trait_type: 'Type', value: 'Creature — Phoenix' },
      { trait_type: 'Artist', value: 'SURF FINANCE STUDIOS' },
      { trait_type: 'Collection', value: 'Waves Collection' },
      { trait_type: 'Health Points', value: '10' },
      { trait_type: 'Mana Cost', value: '5' },
      { trait_type: 'Terrain', value: '?' }
    ]
  };
  
  const metadataUpload = await pinata.upload.public.json(metadata);
  console.log('✅ Metadata:', metadataUpload.cid);
  
  // Step 4: Mint!
  console.log('\n🎴 Minting...');
  const account = privateKeyToAccount(PRIVATE_KEY);
  const publicClient = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') });
  const walletClient = createWalletClient({ account, chain: base, transport: http('https://mainnet.base.org') });
  
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: NFT_ABI,
    functionName: 'mint',
    args: [`ipfs://${metadataUpload.cid}`],
    value: 0n
  });
  
  console.log('📝 TX:', hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('\n🎉 MINTED! Block:', receipt.blockNumber);
  console.log('🔗 https://basescan.org/tx/' + hash);
}

main().catch(console.error);
