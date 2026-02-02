#!/usr/bin/env node
/**
 * Generate card screenshots with LOCAL MODEL flavor texts
 * Uses Ollama (surfgod model) for unique flavor text generation
 */

import puppeteer from 'puppeteer';
import { mkdirSync, existsSync } from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.env.HOME, 'pepeArtGen-fork/mini-app/public/card-screenshots');
const BASE_METADATA_URL = 'https://howlonghasitben.github.io/surf-works/metadata';
const OLLAMA_URL = 'http://localhost:11434/api/generate';

/**
 * Generate flavor text using local Ollama model
 */
async function generateFlavorText(cardName, cardType, attack, defense) {
  const prompt = `Write a short, evocative flavor text (1-2 sentences, max 100 chars) for a trading card called "${cardName}". It's a ${cardType} with ${attack} attack and ${defense} defense. Be creative, mysterious, or funny. No quotes around the text.`;
  
  try {
    const resp = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'surfgod',
        prompt: prompt,
        stream: false,
        options: { temperature: 0.8, num_predict: 60 }
      })
    });
    
    if (!resp.ok) throw new Error('Ollama request failed');
    
    const data = await resp.json();
    const text = data.response?.trim().replace(/^["']|["']$/g, '').slice(0, 150);
    return text || null;
  } catch (e) {
    console.warn(`  [LLM failed: ${e.message}]`);
    return null;
  }
}

/**
 * Randomize stats while keeping balance
 */
function randomizeStats(baseAttack, baseDefense) {
  // Add some variance (-2 to +2) but keep total similar
  const variance = Math.floor(Math.random() * 5) - 2;
  const attackVariance = Math.floor(Math.random() * 3) - 1;
  
  let attack = Math.max(1, baseAttack + attackVariance);
  let defense = Math.max(1, baseDefense - attackVariance + Math.floor(variance / 2));
  
  // Cap at reasonable values
  attack = Math.min(10, attack);
  defense = Math.min(10, defense);
  
  return { attack, defense };
}

/**
 * Transform surf-works metadata to wavestcg card format
 */
function transformMetadata(metadata, cardId, flavorText, stats) {
  const attrs = {};
  (metadata.attributes || []).forEach(attr => {
    attrs[attr.trait_type] = attr.value;
  });

  const manaCost = parseInt(attrs['Mana Cost']) || Math.floor(Math.random() * 4) + 1;
  const manaOrbs = [];
  for (let i = 0; i < Math.min(manaCost, 5); i++) {
    manaOrbs.push({
      color: i === 0 ? '#4A90D9' : '#666',
      value: i === 0 ? manaCost : '',
      textColor: '#fff'
    });
  }

  return {
    name: metadata.name?.replace(' ⟨Generated⟩', '') || cardId,
    subtitle: '',
    level: parseInt(attrs['Level']) || Math.floor(Math.random() * 5) + 1,
    imageData: metadata.image,
    type: attrs['Type'] || 'Creature',
    stats: stats,
    flavorText: flavorText || metadata.description || '',
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

function generateCardHTML(card) {
  const theme = card.theme || {};
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>* { margin: 0; padding: 0; box-sizing: border-box; }body { width: 400px; height: 560px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: transparent; }.card { width: 400px; height: 560px; border-radius: 16px; overflow: hidden; background: ${theme.background}; display: flex; flex-direction: column; }.card-header { padding: 12px 16px; display: flex; justify-content: space-between; align-items: flex-start; background: ${theme.header?.background}; color: ${theme.header?.color}; }.mana-cost { display: flex; gap: 6px; margin-bottom: 4px; }.mana-orb { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; }.card-title { font-size: 18px; font-weight: bold; }.card-level { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; background: ${theme.stat?.background}; }.image-area { flex: 1; margin: 8px 12px; border-radius: 8px; overflow: hidden; background: ${theme.imageArea?.background}; display: flex; align-items: center; justify-content: center; }.card-image { width: 100%; height: 100%; object-fit: cover; }.type-power-section { padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; background: ${theme.typeSection?.background}; color: ${theme.typeSection?.color}; font-size: 14px; }.power-stats { display: flex; gap: 8px; }.stat { padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: bold; background: ${theme.stat?.background}; }.flavor-text { padding: 12px 16px; font-size: 13px; font-style: italic; line-height: 1.4; background: ${theme.flavorText?.background}; color: ${theme.flavorText?.color}; min-height: 80px; }.bottom-section { padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; background: ${theme.bottomSection?.background}; }.artist-info { font-size: 11px; color: ${theme.flavorText?.color}; }.rarity-indicator { padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; background: ${theme.rarity?.background}; color: ${theme.rarity?.color}; }</style></head><body><div class="card"><div class="card-header"><div><div class="mana-cost">${(card.manaCost || []).map(mana => `<div class="mana-orb" style="background: ${mana.color}; color: ${mana.textColor}">${mana.value}</div>`).join('')}</div><div class="card-title">${card.name}</div></div><div class="card-level">LVL ${card.level}</div></div><div class="image-area"><img class="card-image" src="${card.imageData}" alt="${card.name}" /></div><div class="type-power-section"><div>${card.type}</div><div class="power-stats"><div class="stat">ATK: ${card.stats?.attack}</div><div class="stat">DEF: ${card.stats?.defense}</div></div></div><div class="flavor-text">${card.flavorText}</div><div class="bottom-section"><div class="artist-info">◆ ${card.artist} ◆</div><div class="rarity-indicator">★ ${card.rarity} ★</div></div></div></body></html>`;
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
  const attrs = {};
  (metadata.attributes || []).forEach(attr => {
    attrs[attr.trait_type] = attr.value;
  });
  
  const baseAttack = parseInt(attrs['Attack']) || 3;
  const baseDefense = parseInt(attrs['Defense']) || 3;
  const cardType = attrs['Type'] || 'Creature';
  const cardName = metadata.name?.replace(' ⟨Generated⟩', '') || cardId;
  
  // Randomize stats
  const stats = randomizeStats(baseAttack, baseDefense);
  
  // Generate flavor text via local model
  const flavorText = await generateFlavorText(cardName, cardType, stats.attack, stats.defense);
  
  const card = transformMetadata(metadata, cardId, flavorText, stats);
  const html = generateCardHTML(card);
  
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
  return { flavorText, stats };
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Check Ollama is running
  try {
    const resp = await fetch('http://localhost:11434/api/tags');
    if (!resp.ok) throw new Error('Ollama not responding');
    console.log('✅ Ollama connected\n');
  } catch (e) {
    console.error('❌ Ollama not running! Start with: ~/.local/bin/ollama serve');
    process.exit(1);
  }

  const cards = await getCardList();
  console.log(`📸 Generating ${cards.length} screenshots with LOCAL MODEL flavor texts...\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let success = 0, fail = 0;

  for (let i = 0; i < cards.length; i++) {
    const cardId = cards[i];
    process.stdout.write(`[${i + 1}/${cards.length}] ${cardId.padEnd(25)} `);
    
    try {
      const result = await screenshotCard(browser, cardId);
      console.log(`✅ ATK:${result.stats.attack} DEF:${result.stats.defense}`);
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
