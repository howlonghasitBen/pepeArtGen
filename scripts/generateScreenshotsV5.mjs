#!/usr/bin/env node
/**
 * V5 - Uses UNIQUE THEMES from surf-works cardData.json
 * Each card gets its proper color scheme from surf-works
 */

import puppeteer from 'puppeteer';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.env.HOME, 'pepeArtGen-fork/mini-app/public/card-screenshots');
const CARD_DATA_URL = 'https://howlonghasitben.github.io/surf-works/cardData.json';
const OLLAMA_URL = 'http://localhost:11434/api/generate';

/**
 * EXACT generateCardHTML from screenshotService.mjs
 */
function generateCardHTML(card) {
  const theme = card.theme || {};

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 400px;
      height: 560px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: transparent;
    }
    .card {
      width: 400px;
      height: 560px;
      border-radius: 16px;
      overflow: hidden;
      background: ${theme.background || 'linear-gradient(145deg, #2a2a2a, #1a1a1a)'};
      display: flex;
      flex-direction: column;
    }
    .card-header {
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: ${theme.header?.background || 'rgba(0,0,0,0.3)'};
      color: ${theme.header?.color || '#fff'};
    }
    .mana-cost {
      display: flex;
      gap: 6px;
      margin-bottom: 4px;
    }
    .mana-orb {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
    }
    .card-title {
      font-size: 18px;
      font-weight: bold;
    }
    .card-level {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      background: ${theme.stat?.background || 'rgba(255,255,255,0.2)'};
      color: ${theme.stat?.color || '#fff'};
    }
    .image-area {
      flex: 1;
      margin: 8px 12px;
      border-radius: 8px;
      overflow: hidden;
      background: ${theme.imageArea?.background || 'rgba(0,0,0,0.2)'};
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .type-power-section {
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: ${theme.typeSection?.background || 'rgba(0,0,0,0.3)'};
      color: ${theme.typeSection?.color || '#fff'};
      font-size: 14px;
    }
    .power-stats {
      display: flex;
      gap: 8px;
    }
    .stat {
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: bold;
      background: ${theme.stat?.background || 'rgba(255,255,255,0.2)'};
      color: ${theme.stat?.color || '#fff'};
    }
    .flavor-text {
      padding: 12px 16px;
      font-size: 13px;
      font-style: italic;
      line-height: 1.4;
      background: ${theme.flavorText?.background || 'rgba(0,0,0,0.2)'};
      color: ${theme.flavorText?.color || '#ccc'};
      min-height: 80px;
    }
    .bottom-section {
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: ${theme.bottomSection?.background || 'rgba(0,0,0,0.3)'};
    }
    .artist-info {
      font-size: 11px;
      color: ${theme.flavorText?.color || '#888'};
    }
    .rarity-indicator {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
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
          ${(card.manaCost || []).map(mana => `
            <div class="mana-orb" style="background: ${mana.color}; color: ${mana.textColor || '#fff'}">
              ${mana.value}
            </div>
          `).join('')}
        </div>
        <div class="card-title">${card.name || 'Untitled'} ${card.subtitle || ''}</div>
      </div>
      <div class="card-level">LVL ${card.level || 1}</div>
    </div>

    <div class="image-area">
      <img class="card-image" src="${card.imageData || ''}" alt="${card.name}" />
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
      <div class="rarity-indicator">★ ${card.rarity || '1/1'} ★</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate flavor text using local Ollama model
 */
async function generateFlavorText(cardName, cardType) {
  const prompt = `Write a short, evocative flavor text (1-2 sentences, max 80 chars) for a trading card called "${cardName}". Type: ${cardType}. Be creative and mysterious. No quotes.`;
  
  try {
    const resp = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'surfgod',
        prompt: prompt,
        stream: false,
        options: { temperature: 0.8, num_predict: 50 }
      })
    });
    
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.response?.trim().replace(/^["']|["']$/g, '').slice(0, 120) || null;
  } catch (e) {
    return null;
  }
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Check Ollama
  try {
    const resp = await fetch('http://localhost:11434/api/tags');
    if (!resp.ok) throw new Error('Ollama not responding');
    console.log('✅ Ollama connected\n');
  } catch (e) {
    console.error('❌ Ollama not running!');
    process.exit(1);
  }

  // Load card data with themes from surf-works
  console.log('📥 Loading cardData.json from surf-works...');
  const cardDataResp = await fetch(CARD_DATA_URL);
  const cardData = await cardDataResp.json();
  const { cards, themes } = cardData;
  
  console.log(`📸 V5: ${cards.length} cards with UNIQUE THEMES...\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let success = 0, fail = 0;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const cardId = card.id;
    process.stdout.write(`[${i + 1}/${cards.length}] ${cardId.padEnd(25)} `);
    
    try {
      // Get the theme for this card
      const themeName = card.theme || 'cosmicPurple';
      const themeData = themes[themeName] || themes[cardId] || themes.cosmicPurple;
      
      // Generate flavor text
      const flavorText = await generateFlavorText(card.name, card.type);
      
      // Build card object with theme
      // Fix relative image URLs
      let imageUrl = card.image;
      if (imageUrl && imageUrl.startsWith('/')) {
        imageUrl = 'https://howlonghasitben.github.io/surf-works' + imageUrl;
      }
      
      const cardObj = {
        name: card.name,
        subtitle: card.subtitle || '',
        level: card.level || 1,
        imageData: imageUrl,
        type: card.type || 'Creature',
        stats: card.stats || { attack: 3, defense: 3 },
        flavorText: flavorText || card.flavorText || '',
        artist: card.artist || 'SURF FINANCE STUDIOS',
        rarity: card.rarity || '1/1',
        manaCost: card.manaCost || [],
        theme: themeData  // Apply the unique theme!
      };
      
      const html = generateCardHTML(cardObj);
      
      const page = await browser.newPage();
      await page.setViewport({ width: 400, height: 560 });
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 500));
      
      await page.screenshot({
        type: 'png',
        omitBackground: true,
        path: path.join(OUTPUT_DIR, `${cardId}-1of1.png`)
      });
      
      await page.close();
      console.log(`✅ theme:${themeName.slice(0,12)}`);
      success++;
    } catch (e) {
      console.log(`❌ ${e.message.slice(0, 30)}`);
      fail++;
    }
  }

  await browser.close();
  console.log(`\n🎉 Done! Success: ${success}, Failed: ${fail}`);
}

main().catch(console.error);
