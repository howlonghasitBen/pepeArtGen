import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

async function main() {
  const data = JSON.parse(readFileSync(
    path.join(process.env.HOME, 'pepeArtGen-fork/mini-app/public/surfworks-cards.json'), 
    'utf8'
  ));
  const phoenix = data.cards.find(c => c.id === 'phoenix');
  writeFileSync('/tmp/phoenix-card.json', JSON.stringify(phoenix, null, 2));
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 500, height: 1200 });  // Taller viewport
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  
  // Open editor and import
  await page.mouse.click(357, 878);
  await new Promise(r => setTimeout(r, 1500));
  await page.mouse.click(325, 810);
  await new Promise(r => setTimeout(r, 2000));
  
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.uploadFile('/tmp/phoenix-card.json');
    await new Promise(r => setTimeout(r, 3000));
  }
  
  // Get all page content
  const content = await page.content();
  
  // Check for mint-related elements
  console.log('Has "mint":', content.toLowerCase().includes('mint'));
  console.log('Has "connect wallet":', content.toLowerCase().includes('connect wallet'));
  
  // Find all buttons
  const buttons = await page.$$eval('button', btns => 
    btns.map(b => ({ text: b.textContent?.trim(), class: b.className }))
  );
  console.log('Buttons:', JSON.stringify(buttons.filter(b => b.text), null, 2));
  
  // Take full page screenshot
  await page.screenshot({ path: '/tmp/full-editor.png', fullPage: true });
  console.log('📸 Full page screenshot saved');
  
  await browser.close();
}

main().catch(console.error);
