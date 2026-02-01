#!/usr/bin/env node
/**
 * Embeds full theme objects from cardData.json into surfworks-cards.json
 */

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const CARD_DATA_URL = 'https://howlonghasitben.github.io/surf-works/cardData.json';
const SURFWORKS_PATH = path.join(process.env.HOME, 'pepeArtGen-fork/mini-app/public/surfworks-cards.json');

async function main() {
  // Fetch themes from surf-works
  console.log('📥 Fetching themes from cardData.json...');
  const resp = await fetch(CARD_DATA_URL);
  const { themes } = await resp.json();
  
  console.log(`📦 Loaded ${Object.keys(themes).length} themes`);
  
  // Load surfworks-cards.json
  const surfworksData = JSON.parse(readFileSync(SURFWORKS_PATH, 'utf8'));
  
  // Update each card with full theme object
  let updated = 0;
  for (const card of surfworksData.cards) {
    const themeName = card.theme;
    if (themeName && themes[themeName]) {
      card.theme = themes[themeName];  // Replace name with full object
      updated++;
    } else if (themeName && themes[card.id]) {
      // Fallback: try card.id as theme name
      card.theme = themes[card.id];
      updated++;
    } else {
      // Default theme
      card.theme = themes.cosmicPurple || {};
    }
  }
  
  // Save updated file
  writeFileSync(SURFWORKS_PATH, JSON.stringify(surfworksData, null, 2));
  console.log(`✅ Updated ${updated}/${surfworksData.cards.length} cards with full theme objects`);
}

main().catch(console.error);
