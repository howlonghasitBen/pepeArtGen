import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import path from 'path';

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 500, height: 900 });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  
  // Click the edit button using coordinates (it's in the bottom nav bar)
  // From screenshot, nav is at bottom ~y=870, edit icon is second from left ~x=360
  await page.click('button:nth-child(2)', { timeout: 5000 }).catch(() => {});
  
  // Try clicking by looking for svg or icon
  const buttons = await page.$$('button');
  console.log(`Found ${buttons.length} buttons`);
  
  // Click the second button in the navigation area
  if (buttons.length > 5) {
    await buttons[5].click();  // Try different buttons
  }
  
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/tmp/after-click.png', fullPage: true });
  console.log('📸 Screenshot saved');
  
  await browser.close();
}

main().catch(console.error);
