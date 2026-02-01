#!/usr/bin/env node
import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const BASE_URL = "https://howlonghasitben.github.io/surf-works/card.html";
const OUTPUT_DIR = path.join(process.env.HOME, 'pepeArtGen-fork/mini-app/public/card-screenshots');
const METADATA_DIR = path.join(process.env.HOME, 'pepeArtGen-fork/mini-app/public/metadata');

async function getCardList() {
  const resp = await fetch("https://api.github.com/repos/howlonghasitben/surf-works/git/trees/main?recursive=1");
  const data = await resp.json();
  return data.tree
    .filter(f => f.path.includes("1of1.json"))
    .map(f => {
      const filename = f.path.replace("public/metadata/", "");
      const cardId = filename.replace("-1of1.json", "");
      return { filename, cardId };
    });
}

async function screenshotCard(browser, cardId) {
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 560 });
  
  const url = `${BASE_URL}?id=${cardId}&showRarity=true`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  
  // Wait for card to render
  await new Promise(r => setTimeout(r, 2000));
  
  const screenshotPath = path.join(OUTPUT_DIR, `${cardId}-1of1.png`);
  await page.screenshot({ path: screenshotPath, type: 'png' });
  
  await page.close();
  return screenshotPath;
}

async function updateMetadata(cardId, filename) {
  const metadataPath = path.join(METADATA_DIR, filename);
  if (!existsSync(metadataPath)) {
    console.log(`  Metadata not found: ${filename}`);
    return false;
  }
  
  const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
  // Update image to use screenshot
  metadata.image = `https://howlonghasitben.github.io/surf-works/card-screenshots/${cardId}-1of1.png`;
  
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  return true;
}

async function main() {
  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const cards = await getCardList();
  console.log(`📸 Generating screenshots for ${cards.length} cards...\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let success = 0, fail = 0;

  for (let i = 0; i < cards.length; i++) {
    const { cardId, filename } = cards[i];
    process.stdout.write(`[${i + 1}/${cards.length}] ${cardId.padEnd(30)} `);
    
    try {
      await screenshotCard(browser, cardId);
      await updateMetadata(cardId, filename);
      console.log('✅');
      success++;
    } catch (e) {
      console.log(`❌ ${e.message.slice(0, 40)}`);
      fail++;
    }
  }

  await browser.close();
  
  console.log(`\n🎉 Done! Screenshots: ${success}, Failed: ${fail}`);
  console.log(`Output: ${OUTPUT_DIR}`);
}

main().catch(console.error);
