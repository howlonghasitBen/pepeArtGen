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

// Use the EXACT cardHTMLGenerator styling but adapted for screenshot (no body padding)
function generateCardHTMLForScreenshot(card, imageUrl) {
  const theme = card.theme || {};
  const escapeHtml = (str) => str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 400px; height: 533px; overflow: hidden; background: transparent; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    
    .card-content {
      letter-spacing: 0.1px;
      width: 400px;
      height: 533px;
      border: 6px solid #1a1a1a;
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      background: ${theme.background || 'linear-gradient(145deg, #2a2a2a, #1a1a1a)'};
    }
    .card-header {
      border-bottom: 3px solid #1a1a2e;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: "Cinzel", serif;
      flex-shrink: 0;
      background: ${theme.header?.background || 'linear-gradient(135deg, #4a4a4a, #2a2a2a)'};
      color: ${theme.header?.color || '#ffffff'};
      text-shadow: ${theme.header?.textShadow || '2px 2px 4px rgba(0, 0, 0, 0.8)'};
    }
    .card-title { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
    .card-level {
      padding: 4px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 700;
      background: ${theme.stat?.background || 'rgba(0, 0, 0, 0.8)'};
      color: ${theme.stat?.color || '#ffffff'};
      border: ${theme.stat?.border || '2px solid #ffffff'};
    }
    .mana-cost { display: flex; gap: 4px; margin-bottom: 4px; }
    .mana-orb {
      width: 1.5rem; height: 1.5rem; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.6rem; font-weight: bold;
      border: 2px solid #1a1a1a;
    }
    .image-area {
      height: 40%;
      margin: 8px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${theme.imageArea?.background || 'linear-gradient(145deg, #2a2a2a, #1a1a1a)'};
      border: ${theme.imageArea?.border || '2px solid #ffffff'};
      box-shadow: ${theme.imageArea?.boxShadow || 'inset 0 4px 8px rgba(0, 0, 0, 0.6)'};
    }
    .card-image { width: auto; height: 100%; transform: scale(1.1); object-fit: cover; }
    .type-power-section {
      padding: 10px 16px;
      font-family: "Cinzel", serif;
      font-size: 0.525rem;
      font-weight: 600;
      border-top: 2px solid #1a1a2e;
      border-bottom: 2px solid #1a1a2e;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: ${theme.typeSection?.background || 'linear-gradient(135deg, #3a3a3a, #2a2a2a)'};
      color: ${theme.typeSection?.color || '#ffffff'};
    }
    .power-stats { font-size: 0.45rem; display: flex; gap: 8px; }
    .stat {
      padding: 4px 8px; border-radius: 4px;
      background: ${theme.stat?.background || 'rgba(0, 0, 0, 0.8)'};
      border: ${theme.stat?.border || '2px solid #ffffff'};
      color: ${theme.stat?.color || '#ffffff'};
    }
    .flavor-text {
      padding: 0 16px;
      font-family: "Crimson Text", serif;
      font-size: 0.6rem;
      line-height: 1.1;
      text-align: center;
      font-style: italic;
      flex-grow: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${theme.flavorText?.background || 'transparent'};
      color: ${theme.flavorText?.color || '#cccccc'};
    }
    .bottom-section {
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: ${theme.bottomSection?.background || 'linear-gradient(135deg, #2a2a2a, #1a1a1a)'};
    }
    .artist-info { font-size: 0.6rem; font-family: "Cinzel", serif; opacity: 0.8; color: ${theme.flavorText?.color || '#cccccc'}; }
    .rarity-indicator {
      padding: 4px 8px; border-radius: 8px; font-size: 0.625rem; font-weight: 700;
      border: 2px solid #1a1a1a; font-family: "Cinzel", serif; letter-spacing: 0.1em;
      background: ${theme.rarity?.background || 'linear-gradient(135deg, #4a4a4a, #2a2a2a)'};
      color: ${theme.rarity?.color || '#ffffff'};
      box-shadow: ${theme.rarity?.boxShadow || '0 0 10px rgba(255, 255, 255, 0.6)'};
    }
  </style>
</head>
<body>
  <div class="card-content">
    <div class="card-header">
      <div>
        <div class="mana-cost">
          ${(card.manaCost || []).map(m => `<div class="mana-orb" style="background:${m.color};color:${m.textColor||'#fff'}">${m.value}</div>`).join('')}
        </div>
        <div class="card-title">${escapeHtml(card.name)} ${escapeHtml(card.subtitle || '')}</div>
      </div>
      <div class="card-level">LVL ${escapeHtml(card.level || '1')}</div>
    </div>
    <div class="image-area">
      <img src="${imageUrl}" alt="${escapeHtml(card.name)}" class="card-image" />
    </div>
    <div class="type-power-section">
      <div>${escapeHtml(card.type || 'Creature')}</div>
      <div class="power-stats">
        <div class="stat">ATK: ${card.stats?.attack || 0}</div>
        <div class="stat">DEF: ${card.stats?.defense || 0}</div>
      </div>
    </div>
    <div class="flavor-text">${escapeHtml(card.flavorText || '')}</div>
    <div class="bottom-section">
      <div class="artist-info">◆ ${escapeHtml(card.artist || 'Waves TCG')} ◆</div>
      <div class="rarity-indicator">★ 1/1 ★</div>
    </div>
  </div>
</body>
</html>`;
}

async function renderCardToPNG(html) {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 533, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const buffer = await page.screenshot({ type: 'png', omitBackground: true, clip: { x: 0, y: 0, width: 400, height: 533 } });
  await browser.close();
  return buffer;
}

async function main() {
  console.log('🚀 Phoenix mint V3 - Standard styling\n');
  
  const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: 'gateway.pinata.cloud' });
  
  const data = JSON.parse(readFileSync(path.join(process.env.HOME, 'pepeArtGen-fork/mini-app/public/surfworks-cards.json'), 'utf8'));
  const phoenix = data.cards.find(c => c.id === 'phoenix');
  console.log('📋 Card:', phoenix.name);
  
  const imageUrl = phoenix.image;
  
  console.log('\n📤 Rendering card PNG (standard styling)...');
  const cardHTML = generateCardHTMLForScreenshot(phoenix, imageUrl);
  const cardPngBuffer = await renderCardToPNG(cardHTML);
  const cardPngBlob = new Blob([cardPngBuffer], { type: 'image/png' });
  const cardPngUpload = await pinata.upload.public.file(new File([cardPngBlob], 'phoenix_v3.png'));
  console.log('✅ Card PNG:', cardPngUpload.cid);
  
  console.log('\n📤 Uploading HTML card...');
  const htmlBlob = new Blob([cardHTML], { type: 'text/html' });
  const htmlUpload = await pinata.upload.public.file(new File([htmlBlob], 'phoenix_v3.html'));
  console.log('✅ HTML:', htmlUpload.cid);
  
  console.log('\n📤 Creating metadata...');
  const metadata = {
    name: 'Feelsix ⟨Mythical⟩',
    description: '1/1 Legendary Card from the Waves Collection. Scorched Earth ⟨4M : Deal 1TD to all enemy cards⟩\nPassive: Attacking places this card in the graveyard for one turn, after which it\'s returned to the players hand.',
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
