#!/usr/bin/env node
/**
 * Updates surf-works metadata files to use card screenshots as preview images
 * Run this AFTER generating screenshots and pushing to the repo
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import path from 'path';

const METADATA_DIR = process.argv[2] || './public/metadata';
const SCREENSHOT_BASE_URL = 'https://howlonghasitben.github.io/surf-works/card-screenshots';

async function main() {
  if (!existsSync(METADATA_DIR)) {
    console.error(`Metadata directory not found: ${METADATA_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(METADATA_DIR).filter(f => f.endsWith('-1of1.json'));
  console.log(`📝 Updating ${files.length} metadata files...\n`);

  let updated = 0, skipped = 0;

  for (const file of files) {
    const filepath = path.join(METADATA_DIR, file);
    const cardId = file.replace('-1of1.json', '');
    
    try {
      const metadata = JSON.parse(readFileSync(filepath, 'utf-8'));
      const newImageUrl = `${SCREENSHOT_BASE_URL}/${cardId}-1of1.png`;
      
      if (metadata.image === newImageUrl) {
        skipped++;
        continue;
      }
      
      // Store original image as backup
      if (!metadata.original_image) {
        metadata.original_image = metadata.image;
      }
      
      metadata.image = newImageUrl;
      
      writeFileSync(filepath, JSON.stringify(metadata, null, 2));
      console.log(`✅ ${file}`);
      updated++;
    } catch (e) {
      console.log(`❌ ${file}: ${e.message}`);
    }
  }

  console.log(`\n🎉 Done! Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(console.error);
