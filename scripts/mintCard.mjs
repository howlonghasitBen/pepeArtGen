import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

async function main() {
  // Load phoenix card
  const data = JSON.parse(readFileSync(
    path.join(process.env.HOME, 'pepeArtGen-fork/mini-app/public/surfworks-cards.json'), 
    'utf8'
  ));
  const phoenix = data.cards.find(c => c.id === 'phoenix');
  const cardPath = '/tmp/phoenix-card.json';
  writeFileSync(cardPath, JSON.stringify(phoenix, null, 2));
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 500, height: 900 });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  
  // Open edit menu and go to editor
  await page.mouse.click(357, 878);
  await new Promise(r => setTimeout(r, 1500));
  await page.mouse.click(325, 810);  // Import Card
  await new Promise(r => setTimeout(r, 2000));
  
  // Upload the card
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.uploadFile(cardPath);
    console.log('✅ Card imported');
    await new Promise(r => setTimeout(r, 3000));
  }
  
  // Screenshot current state
  await page.screenshot({ path: '/tmp/before-mint.png', fullPage: true });
  
  // Scroll down to find mint button
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 1000));
  
  await page.screenshot({ path: '/tmp/mint-area.png', fullPage: true });
  console.log('📸 Screenshots saved');
  
  // Look for mint button
  const mintButton = await page.$('button:has-text("Mint")');
  const buttons = await page.$$('button');
  console.log(`Found ${buttons.length} buttons`);
  
  // Check button text
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].evaluate(el => el.textContent);
    if (text.toLowerCase().includes('mint') || text.toLowerCase().includes('connect')) {
      console.log(`Button ${i}: "${text}"`);
    }
  }
  
  await browser.close();
}

main().catch(console.error);
