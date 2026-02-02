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
  const phoenixJson = JSON.stringify(phoenix);
  
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
  
  // Click "Import Card"
  await page.mouse.click(325, 810);
  await new Promise(r => setTimeout(r, 2000));
  
  // Now click the [v] button at top right (~x=478, y=32)
  await page.mouse.click(478, 32);
  await new Promise(r => setTimeout(r, 2000));
  
  // Screenshot 
  await page.screenshot({ path: '/tmp/import-button.png', fullPage: true });
  console.log('📸 After [v] click saved');
  
  await browser.close();
}

main().catch(console.error);
