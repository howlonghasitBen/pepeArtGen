import puppeteer from 'puppeteer';

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 500, height: 900 });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  
  // Screenshot before click
  await page.screenshot({ path: '/tmp/before-click.png' });
  console.log('📸 Before click saved');
  
  // Click the download/plus button (4th icon in bottom nav, ~x=437)
  await page.mouse.click(437, 878);
  await new Promise(r => setTimeout(r, 2000));
  
  // Screenshot after click
  await page.screenshot({ path: '/tmp/after-click2.png', fullPage: true });
  console.log('📸 After click saved');
  
  await browser.close();
}

main().catch(console.error);
