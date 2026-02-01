#!/usr/bin/env node
/**
 * Mass Card Importer for SURF WORKS → WavesTCG
 * 
 * Converts cards from howlonghasitBen.github.io/surf-works format
 * to WavesTCG format for use in the mini-app.
 * 
 * Usage:
 *   node scripts/importSurfWorksCards.mjs [--output cards.json] [--preview]
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

const SURF_WORKS_URL = 'https://raw.githubusercontent.com/howlonghasitBen/surf-works/main/public/cardData.json';
const SURF_WORKS_IMAGE_BASE = 'https://howlonghasitben.github.io/surf-works';

// Rarity mapping from surf-works to WavesTCG
function mapRarity(surfRarity) {
  if (!surfRarity) return 'common';
  const r = surfRarity.toLowerCase();
  if (r.includes('1/1') || r.includes('legendary')) return 'legendary';
  if (r.includes('rare')) return 'rare';
  if (r.includes('epic')) return 'epic';
  if (r.includes('uncommon')) return 'uncommon';
  return 'common';
}

// Convert theme to approximate rarity if no explicit rarity
function themeToRarity(theme) {
  const themeMap = {
    'cosmicPurple': 'legendary',
    'alchemicalRed': 'legendary',
    'sunsetFire': 'epic',
    'steelSky': 'rare',
    'skyBlue': 'uncommon',
    'oceanBlue': 'uncommon',
    'forestGreen': 'common',
    'earthBrown': 'common',
  };
  return themeMap[theme] || 'common';
}

// Convert surf-works card to WavesTCG format
function convertCard(surfCard, index) {
  const imageUrl = surfCard.image?.startsWith('/')
    ? `${SURF_WORKS_IMAGE_BASE}${surfCard.image}`
    : surfCard.image;

  // Build description from type, stats, and flavor text
  const statsStr = surfCard.stats 
    ? `ATK: ${surfCard.stats.attack} / DEF: ${surfCard.stats.defense}`
    : '';
  const description = [
    surfCard.type,
    statsStr,
    surfCard.flavorText
  ].filter(Boolean).join('\n');

  return {
    id: surfCard.id || `surf-${index}`,
    tokenId: String(index + 1),
    name: surfCard.name,
    subtitle: surfCard.subtitle || '',
    image: imageUrl,
    imageData: imageUrl,
    rarity: mapRarity(surfCard.rarity) || themeToRarity(surfCard.theme),
    description: description,
    type: surfCard.type || 'Creature',
    level: surfCard.level || '1',
    theme: surfCard.theme || 'oceanBlue',
    stats: surfCard.stats || { attack: '1', defense: '1' },
    manaCost: surfCard.manaCost || [],
    flavorText: surfCard.flavorText || '',
    artist: surfCard.artist || 'SURF FINANCE STUDIOS',
    openSeaUrl: '#',
    source: 'surf-works',
  };
}

// Fetch JSON from URL
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const preview = args.includes('--preview');
  const outputIdx = args.indexOf('--output');
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : 'surfworks-cards.json';

  console.log('🏄 SURF WORKS Card Importer');
  console.log('===========================\n');

  console.log(`📡 Fetching cards from surf-works...`);
  
  try {
    const data = await fetchJSON(SURF_WORKS_URL);
    const surfCards = data.cards || [];
    
    console.log(`✅ Found ${surfCards.length} cards\n`);

    // Convert all cards
    const convertedCards = surfCards.map((card, idx) => convertCard(card, idx));

    // Group by rarity for stats
    const byRarity = {
      legendary: convertedCards.filter(c => c.rarity === 'legendary'),
      epic: convertedCards.filter(c => c.rarity === 'epic'),
      rare: convertedCards.filter(c => c.rarity === 'rare'),
      uncommon: convertedCards.filter(c => c.rarity === 'uncommon'),
      common: convertedCards.filter(c => c.rarity === 'common'),
    };

    console.log('📊 Rarity breakdown:');
    console.log(`   Legendary: ${byRarity.legendary.length}`);
    console.log(`   Epic:      ${byRarity.epic.length}`);
    console.log(`   Rare:      ${byRarity.rare.length}`);
    console.log(`   Uncommon:  ${byRarity.uncommon.length}`);
    console.log(`   Common:    ${byRarity.common.length}`);
    console.log('');

    if (preview) {
      console.log('🔍 Preview mode - first 5 converted cards:\n');
      convertedCards.slice(0, 5).forEach(card => {
        console.log(`  ${card.name} (${card.rarity})`);
        console.log(`    Type: ${card.type}`);
        console.log(`    Stats: ATK ${card.stats.attack} / DEF ${card.stats.defense}`);
        console.log(`    Image: ${card.image}`);
        console.log('');
      });
    } else {
      // Write to file
      const outputPath = path.resolve(outputFile);
      const output = {
        source: 'surf-works',
        importedAt: new Date().toISOString(),
        totalCards: convertedCards.length,
        cards: convertedCards,
      };
      
      fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
      console.log(`💾 Saved ${convertedCards.length} cards to ${outputPath}`);
    }

    console.log('\n🎉 Import complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
