import puppeteer from 'puppeteer';

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 500, height: 900 });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Wait a bit for React to render
  await new Promise(r => setTimeout(r, 3000));
  
  // Get page content to see what's there
  const content = await page.content();
  console.log('Page has bottom-nav:', content.includes('bottom-nav'));
  console.log('Page has nav-item:', content.includes('nav-item'));
  
  await page.screenshot({ path: '/tmp/test-page.png', fullPage: true });
  console.log('📸 Screenshot saved');
  
  await browser.close();
}

main().catch(console.error);
