import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import path from 'path';

async function main() {
  // Load phoenix card
  const data = JSON.parse(readFileSync(
    path.join(process.env.HOME, 'pepeArtGen-fork/mini-app/public/surfworks-cards.json'), 
    'utf8'
  ));
  const phoenix = data.cards.find(c => c.id === 'phoenix');
  
  console.log('Testing phoenix card...');
  console.log('Theme background:', phoenix.theme.background.slice(0, 60) + '...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 500, height: 800 });
  
  // Go to frontend
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  console.log('✅ Frontend loaded');
  
  // Click the card editor button (pencil icon in nav)
  await page.waitForSelector('.bottom-nav button', { timeout: 5000 });
  const navButtons = await page.$$('.bottom-nav button');
  console.log(`Found ${navButtons.length} nav buttons`);
  
  // Click the edit button (second from left after home)
  if (navButtons.length >= 2) {
    await navButtons[1].click();
    await page.waitForTimeout(2000);
    console.log('✅ Clicked editor button');
  }
  
  await page.screenshot({ path: '/tmp/card-editor.png' });
  console.log('📸 Screenshot saved to /tmp/card-editor.png');
  
  await browser.close();
}

main().catch(console.error);
