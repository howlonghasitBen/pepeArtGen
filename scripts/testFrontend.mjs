import puppeteer from 'puppeteer';

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  console.log('✅ Frontend loaded');
  
  await page.screenshot({ path: '/tmp/frontend-home.png' });
  console.log('📸 Screenshot saved');
  
  await browser.close();
}

main().catch(console.error);
