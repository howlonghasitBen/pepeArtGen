#!/usr/bin/env node
/**
 * Generate card screenshots using wavestcg.xyz card renderer
 * Uses the same HTML generation as screenshotService.mjs
 */

import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.env.HOME, 'pepeArtGen-fork/mini-app/public/card-screenshots');
const BASE_METADATA_URL = 'https://howlonghasitben.github.io/surf-works/metadata';

/**
 * Transform surf-works metadata to wavestcg card format
 */
function transformMetadata(metadata, cardId) {
  // Extract attributes from metadata
  const attrs = {};
  (metadata.attributes || []).forEach(attr => {
    attrs[attr.trait_type] = attr.value;
  });

  // Determine mana cost based on Mana Cost attribute
  const manaCost = parseInt(attrs['Mana Cost']) || 2;
  const manaOrbs = [];
  for (let i = 0; i < Math.min(manaCost, 5); i++) {
    manaOrbs.push({
      color: i === 0 ? '#4A90D9' : '#666',  // First orb colored, rest grey
      value: i === 0 ? manaCost : '',
      textColor: '#fff'
    });
  }

  return {
    name: metadata.name?.replace(' ⟨Generated⟩', '') || cardId,
    subtitle: '',
    level: parseInt(attrs['Level']) || 1,
    imageData: metadata.image,
    type: attrs['Type'] || 'Creature',
    stats: {
      attack: parseInt(attrs['Attack']) || 3,
      defense: parseInt(attrs['Defense']) || 3
    },
    flavorText: metadata.description || '',
    artist: attrs['Artist'] || 'SURF FINANCE STUDIOS',
    rarity: attrs['Rarity'] || '1/1',
    manaCost: manaOrbs,
    theme: {
      background: 'linear-gradient(145deg, #1a3a4a, #0d1f28)',
      header: { background: 'rgba(0,80,120,0.4)', color: '#e0f0f8' },
      imageArea: { background: 'rgba(0,60,90,0.3)' },
      typeSection: { background: 'rgba(0,80,120,0.4)', color: '#b0d8e8' },
      stat: { background: 'rgba(74,144,217,0.4)' },
      flavorText: { background: 'rgba(0,50,70,0.4)', color: '#8cc4dc' },
      bottomSection: { background: 'rgba(0,80,120,0.5)' },
      rarity: { background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#000' }
    }
  };
}

/**
 * Generate HTML matching wavestcg screenshotService
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

async function getCardList() {
  const resp = await fetch('https://api.github.com/repos/howlonghasitben/surf-works/git/trees/main?recursive=1');
  const data = await resp.json();
  return data.tree
    .filter(f => f.path.includes('1of1.json'))
    .map(f => f.path.replace('public/metadata/', '').replace('-1of1.json', ''));
}

async function fetchMetadata(cardId) {
  const url = `${BASE_METADATA_URL}/${cardId}-1of1.json`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch ${url}`);
  return resp.json();
}

async function screenshotCard(browser, cardId) {
  const metadata = await fetchMetadata(cardId);
  const card = transformMetadata(metadata, cardId);
  const html = generateCardHTML(card);
  
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 560 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  // Wait for image to load
  await new Promise(r => setTimeout(r, 500));
  
  const screenshot = await page.screenshot({
    type: 'png',
    omitBackground: true,
    path: path.join(OUTPUT_DIR, `${cardId}-1of1.png`)
  });
  
  await page.close();
  return screenshot;
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const cards = await getCardList();
  console.log(`📸 Generating ${cards.length} screenshots with wavestcg renderer...\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let success = 0, fail = 0;

  for (let i = 0; i < cards.length; i++) {
    const cardId = cards[i];
    process.stdout.write(`[${i + 1}/${cards.length}] ${cardId.padEnd(30)} `);
    
    try {
      await screenshotCard(browser, cardId);
      console.log('✅');
      success++;
    } catch (e) {
      console.log(`❌ ${e.message.slice(0, 40)}`);
      fail++;
    }
  }

  await browser.close();
  console.log(`\n🎉 Done! Success: ${success}, Failed: ${fail}`);
}

main().catch(console.error);
