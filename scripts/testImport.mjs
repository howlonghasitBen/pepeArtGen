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
  
  // Look for the + button - try different selectors
  const plusButton = await page.$('button:has-text("+")') || 
                     await page.$('[aria-label*="add"]') ||
                     await page.$('.add-button');
  
  // Get all buttons and find the one with + or add icon
  const buttons = await page.$$('button');
  console.log(`Found ${buttons.length} buttons, checking each...`);
  
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].evaluate(el => el.textContent || el.innerHTML);
    if (text.includes('+') || text.includes('add') || text.includes('Add')) {
      console.log(`Button ${i}: "${text.slice(0, 50)}"`);
    }
  }
  
  // Click by position - the download/add button appears to be 4th in the nav (index 3)
  // Nav order appears to be: home, edit, calendar, download, clock
  // Looking for the download icon which has the + functionality
  
  // Try clicking the 4th nav button (download icon area)
  await page.mouse.click(437, 878);  // Approximate position of download button
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: '/tmp/after-plus.png', fullPage: true });
  console.log('📸 Screenshot saved');
  
  await browser.close();
}

main().catch(console.error);
