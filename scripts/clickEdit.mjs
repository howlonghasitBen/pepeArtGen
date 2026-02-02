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
  
  // Click the edit button (pencil icon - 2nd in nav after home, ~x=357)
  await page.mouse.click(357, 878);
  await new Promise(r => setTimeout(r, 3000));
  
  // Screenshot the edit menu
  await page.screenshot({ path: '/tmp/edit-menu.png', fullPage: true });
  console.log('📸 Edit menu screenshot saved');
  
  await browser.close();
}

main().catch(console.error);
