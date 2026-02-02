import { readFileSync, writeFileSync, existsSync } from 'fs';
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
const COOLDOWN_MS = 65000; // 65 seconds to be safe
const PROGRESS_FILE = path.join(process.env.HOME, 'pepeArtGen-fork/mini-app/scripts/mint-progress.json');

const NFT_ABI = [{
  inputs: [{ internalType: 'string', name: 'metadataURI', type: 'string' }],
  name: 'mint',
  outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
  stateMutability: 'payable',
  type: 'function'
}];

// Filler flavor text patterns to detect
const FILLER_PATTERNS = [
  /^placeholder/i,
  /^todo/i,
  /^flavor text/i,
  /^description/i,
  /^add flavor/i,
  /lorem ipsum/i,
  /^test/i,
  /^\[.*\]$/,  // [brackets only]
  /^\.{3,}$/,  // just dots
  /^-+$/,      // just dashes
];

function isFillerText(text) {
  if (!text || text.trim().length < 10) return true;
  return FILLER_PATTERNS.some(p => p.test(text.trim()));
}

async function generateFlavorText(card) {
  const prompt = `Generate a short, evocative flavor text (1-2 sentences, max 150 chars) for a trading card game. The card is:
Name: ${card.name}
Type: ${card.type}
Stats: ATK ${card.stats?.attack || 0}, DEF ${card.stats?.defense || 0}

Write ONLY the flavor text, no quotes, no explanation. Be mysterious, poetic, or ominous.`;

  try {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'surfgod', prompt, stream: false })
    });
    const data = await res.json();
    return data.response?.trim().slice(0, 200) || card.flavorText;
  } catch (e) {
    console.log('  ⚠️ Ollama failed, using original text');
    return card.flavorText || 'A mysterious force stirs within...';
  }
}

function generateCardHTML(card, imageUrl) {
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

async function renderCardToPNG(browser, html) {
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 533, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const buffer = await page.screenshot({ type: 'png', omitBackground: true, clip: { x: 0, y: 0, width: 400, height: 533 } });
  await page.close();
  return buffer;
}

function loadProgress() {
  if (existsSync(PROGRESS_FILE)) {
    return JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
  }
  return { minted: [], failed: [], lastIndex: -1 };
}

function saveProgress(progress) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('🚀 Batch Mint - All Surf-Works Cards\n');
  console.log('⏱️  60 second cooldown between mints\n');
  
  // Load progress
  const progress = loadProgress();
  console.log(`📊 Progress: ${progress.minted.length} minted, ${progress.failed.length} failed\n`);
  
  // Fetch card data
  console.log('📥 Fetching card data from surf-works...');
  const res = await fetch('https://howlonghasitben.github.io/surf-works/cardData.json');
  const data = await res.json();
  const { cards, themes } = data;
  console.log(`📋 Found ${cards.length} cards\n`);
  
  // Filter out already minted
  const toMint = cards.filter(c => !progress.minted.includes(c.id));
  console.log(`🎯 ${toMint.length} cards remaining to mint\n`);
  
  if (toMint.length === 0) {
    console.log('✅ All cards already minted!');
    return;
  }
  
  // Estimate time
  const estMinutes = Math.ceil(toMint.length * 65 / 60);
  console.log(`⏳ Estimated time: ~${estMinutes} minutes (${(estMinutes/60).toFixed(1)} hours)\n`);
  
  // Setup
  const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: 'gateway.pinata.cloud' });
  const account = privateKeyToAccount(PRIVATE_KEY);
  const publicClient = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') });
  const walletClient = createWalletClient({ account, chain: base, transport: http('https://mainnet.base.org') });
  
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  
  let mintCount = 0;
  
  for (const card of toMint) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🎴 [${mintCount + 1}/${toMint.length}] ${card.name} (${card.id})`);
      
      // Resolve theme
      const themeObj = typeof card.theme === 'string' ? themes[card.theme] : card.theme;
      const cardWithTheme = { ...card, theme: themeObj || {} };
      
      // Check flavor text
      if (isFillerText(card.flavorText)) {
        console.log('  🤖 Generating flavor text via Ollama...');
        cardWithTheme.flavorText = await generateFlavorText(card);
        console.log(`  📝 "${cardWithTheme.flavorText.slice(0, 50)}..."`);
      }
      
      // Build image URL
      const imageUrl = card.image.startsWith('http') 
        ? card.image 
        : `https://howlonghasitben.github.io/surf-works${card.image}`;
      
      // Render card
      console.log('  🎨 Rendering card PNG...');
      const cardHTML = generateCardHTML(cardWithTheme, imageUrl);
      const cardPngBuffer = await renderCardToPNG(browser, cardHTML);
      
      // Upload PNG
      console.log('  📤 Uploading to IPFS...');
      const cardPngBlob = new Blob([cardPngBuffer], { type: 'image/png' });
      const cardPngUpload = await pinata.upload.public.file(new File([cardPngBlob], `${card.id}.png`));
      
      // Upload HTML
      const htmlBlob = new Blob([cardHTML], { type: 'text/html' });
      const htmlUpload = await pinata.upload.public.file(new File([htmlBlob], `${card.id}.html`));
      
      // Create metadata
      const hp = card.manaCost?.find(m => m.type === 'hp')?.value || '?';
      const mana = card.manaCost?.find(m => m.type === 'mana')?.value || '?';
      const terrain = card.manaCost?.find(m => m.type === 'terrain')?.value || '?';
      
      const metadata = {
        name: `${card.name} ${card.subtitle || ''}`.trim(),
        description: `1/1 Legendary Card from the Waves Collection. ${cardWithTheme.flavorText || ''}`,
        image: `https://gateway.pinata.cloud/ipfs/${cardPngUpload.cid}`,
        animation_url: `https://gateway.pinata.cloud/ipfs/${htmlUpload.cid}`,
        external_url: 'https://howlonghasitben.github.io/surf-works',
        attributes: [
          { trait_type: 'Rarity', value: '1/1' },
          { trait_type: 'Level', value: String(card.level || '1') },
          { trait_type: 'Attack', value: String(card.stats?.attack || 0) },
          { trait_type: 'Defense', value: String(card.stats?.defense || 0) },
          { trait_type: 'Type', value: card.type || 'Creature' },
          { trait_type: 'Artist', value: card.artist || 'SURF FINANCE STUDIOS' },
          { trait_type: 'Collection', value: 'Waves Collection' },
          { trait_type: 'Health Points', value: String(hp) },
          { trait_type: 'Mana Cost', value: String(mana) },
          { trait_type: 'Terrain', value: String(terrain) }
        ]
      };
      
      const metadataUpload = await pinata.upload.public.json(metadata);
      
      // Mint
      console.log('  🎴 Minting...');
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'mint',
        args: [`ipfs://${metadataUpload.cid}`],
        value: 0n
      });
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(`  ✅ MINTED! TX: ${hash.slice(0, 20)}... Block: ${receipt.blockNumber}`);
      
      // Update progress
      progress.minted.push(card.id);
      saveProgress(progress);
      
      mintCount++;
      
      // Cooldown (skip for last card)
      if (mintCount < toMint.length) {
        console.log(`  ⏱️  Waiting 65s cooldown...`);
        await sleep(COOLDOWN_MS);
      }
      
    } catch (err) {
      console.log(`  ❌ FAILED: ${err.message}`);
      progress.failed.push({ id: card.id, error: err.message });
      saveProgress(progress);
      
      // Still wait cooldown in case it was a partial success
      if (err.message.includes('cooldown') || err.message.includes('rate')) {
        console.log('  ⏱️  Cooldown error, waiting 90s...');
        await sleep(90000);
      }
    }
  }
  
  await browser.close();
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 BATCH COMPLETE!`);
  console.log(`✅ Minted: ${progress.minted.length}`);
  console.log(`❌ Failed: ${progress.failed.length}`);
  if (progress.failed.length > 0) {
    console.log('\nFailed cards:');
    progress.failed.forEach(f => console.log(`  - ${f.id}: ${f.error}`));
  }
}

main().catch(console.error);
