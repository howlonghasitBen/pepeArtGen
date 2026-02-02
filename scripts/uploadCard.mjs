import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

async function main() {
  // Load phoenix card and save as JSON file
  const data = JSON.parse(readFileSync(
    path.join(process.env.HOME, 'pepeArtGen-fork/mini-app/public/surfworks-cards.json'), 
    'utf8'
  ));
  const phoenix = data.cards.find(c => c.id === 'phoenix');
  
  // Save to temp file
  const cardPath = '/tmp/phoenix-card.json';
  writeFileSync(cardPath, JSON.stringify(phoenix, null, 2));
  console.log('Saved phoenix card to', cardPath);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 500, height: 900 });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  
  // Click edit button to open menu
  await page.mouse.click(357, 878);
  await new Promise(r => setTimeout(r, 1500));
  
  // Click "Import Card" from the menu
  await page.mouse.click(325, 810);
  await new Promise(r => setTimeout(r, 2000));
  
  // Find the file input and upload the card
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.uploadFile(cardPath);
    console.log('✅ Uploaded card file');
    await new Promise(r => setTimeout(r, 3000));
  } else {
    console.log('❌ File input not found');
  }
  
  // Screenshot the result
  await page.screenshot({ path: '/tmp/phoenix-imported.png', fullPage: true });
  console.log('📸 Screenshot saved');
  
  await browser.close();
}

main().catch(console.error);
