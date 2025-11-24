# Card Preview Rendering - Styled Cards Everywhere!

## What Changed

**Before:**
- Thumbnail/Preview: Raw AI image (no styling)
- Detail page: Styled card (via animation_url)

**After:** ✨
- **Thumbnail/Preview: Styled card!** (screenshot of the full card)
- **Detail page: Interactive HTML card** (via animation_url)

## How It Works

### Upload Flow

```
1. Upload raw AI image → rawImageCID
   └─ Used as source for HTML card rendering

2. Generate HTML card using raw image
   └─ Full styled card with stats, flavor text, etc.

3. Render HTML to PNG using Puppeteer
   └─ Screenshot at 600x800 (3:4 ratio), 2x DPI
   └─ This becomes the preview image!

4. Upload rendered card PNG → cardImageCID
   └─ This goes in metadata.image field

5. Upload HTML card → htmlCID
   └─ This goes in metadata.animation_url field

6. Create metadata pointing to both
```

### Metadata Structure

```json
{
  "image": "ipfs://QmCardImageCID",        // 📸 Rendered styled card (preview)
  "animation_url": "ipfs://QmHTMLCID",     // 🎴 Interactive HTML (detail page)
  "attributes": [...]
}
```

## What Users See

### On OpenSea Grid View
- **Shows**: Styled trading card with all elements visible
- **No more**: Raw AI images that look incomplete

### On OpenSea Detail Page
- **Shows**: Interactive HTML card (can hover over elements)
- **Seamless**: Same design as preview, just interactive

### On All Marketplaces
- **Thumbnail**: Professional styled card
- **Detail**: Interactive version with hover effects
- **Consistency**: Same design everywhere

## Technical Details

### Puppeteer Rendering

**File**: `server/cardRenderer.mjs`

```javascript
renderCardToPNG(cardHTML)
  ├─ Launches headless Chrome
  ├─ Loads HTML with wait for fonts/images
  ├─ Sets viewport 600x800 @ 2x DPI (1200x1600 actual)
  ├─ Waits 500ms for animations to settle
  ├─ Captures PNG screenshot
  └─ Returns buffer
```

**Settings:**
- Dimensions: 600x800 (3:4 aspect ratio)
- DPI: 2x (high quality for retina displays)
- Format: PNG with background
- Wait: networkidle0 (all resources loaded)

### IPFS Upload Sequence

**File**: `server/api.mjs`

```javascript
POST /api/upload-to-ipfs
  1. Upload raw AI image (512x512) → rawImageCID
  2. Generate HTML using raw image URL
  3. Render HTML to PNG (600x800 @ 2x) → buffer
  4. Upload card PNG → cardImageCID
  5. Upload HTML → htmlCID
  6. Create metadata:
     - image: cardImageCID
     - animation_url: htmlCID
  7. Upload metadata → metadataCID
```

## File Sizes & Costs

### Per NFT:
- Raw AI image: ~100-300 KB
- **Rendered card PNG: ~200-400 KB** (new)
- HTML card: ~15 KB
- Metadata: ~1 KB
- **Total: ~316-716 KB**

### IPFS Costs (Pinata):
- Raw image: $0.001
- **Card PNG: $0.001** (new)
- HTML: $0.001
- Metadata: $0.001
- **Total: $0.004 per NFT** (was $0.003)

### Additional Processing:
- Puppeteer render time: ~2-5 seconds
- Additional upload: ~1-2 seconds
- **Total mint time: +3-7 seconds**

## Benefits

### User Experience ✅
- Professional appearance in grids
- Consistent branding everywhere
- All card info visible at a glance
- No confusion about "incomplete" images

### Marketplace Presentation ✅
- Stands out in collections
- Professional first impression
- Clear value proposition
- Better click-through rates

### Technical ✅
- High-quality rendering (2x DPI)
- Works on all marketplaces
- Backwards compatible
- Self-contained

## Requirements

### Server Dependencies

```json
{
  "puppeteer": "^21.6.0"
}
```

Install:
```bash
npm install puppeteer
```

### System Requirements

Puppeteer downloads Chromium (~300MB) on first install:
- Headless browser for rendering
- Works on Linux, Mac, Windows
- Requires ~500MB RAM per render

### Docker Considerations

If deploying in Docker, add:
```dockerfile
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver
```

## Configuration Options

### Quality Settings

**High Quality (default):**
```javascript
await page.setViewport({
  width: 600,
  height: 800,
  deviceScaleFactor: 2  // 2x DPI
});
```

**Balanced (faster, smaller files):**
```javascript
await page.setViewport({
  width: 600,
  height: 800,
  deviceScaleFactor: 1  // Standard DPI
});
```

**Ultra High (exhibitions, print):**
```javascript
await page.setViewport({
  width: 1200,
  height: 1600,
  deviceScaleFactor: 2  // 4K equivalent
});
```

### Rendering Timeout

Adjust for slow networks:
```javascript
await page.setContent(cardHTML, {
  waitUntil: 'networkidle0',
  timeout: 30000  // 30 seconds max
});
```

### Memory Management

For batch processing:
```javascript
// Close browser between renders
await browser.close();

// Or reuse browser instance:
const browser = await puppeteer.launch({ headless: 'new' });
for (const card of cards) {
  const page = await browser.newPage();
  // render...
  await page.close();
}
await browser.close();
```

## Troubleshooting

### "Error: Failed to launch browser"

**Cause**: Missing Chromium dependencies

**Solution (Linux)**:
```bash
sudo apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

### "Timeout waiting for page"

**Cause**: Google Fonts or IPFS image taking too long

**Solution**: Increase timeout or use local fonts

```javascript
await page.setContent(cardHTML, {
  waitUntil: 'domcontentloaded',  // Don't wait for external resources
  timeout: 60000
});
```

### Rendered image looks wrong

**Cause**: Fonts not loaded or CSS not applied

**Solution**: Add explicit wait after content load

```javascript
await page.setContent(cardHTML, { waitUntil: 'networkidle0' });
await page.waitForTimeout(1000);  // Wait for fonts
await page.waitForSelector('.card-container');  // Ensure element exists
```

### High memory usage

**Cause**: Browser instances not closing

**Solution**: Always close browser in finally block

```javascript
let browser;
try {
  browser = await puppeteer.launch();
  // ... rendering
} finally {
  if (browser) await browser.close();
}
```

## Performance Optimization

### 1. Reuse Browser Instance

```javascript
// Bad: Launch browser per render (~3-5s overhead)
for (const card of cards) {
  const browser = await puppeteer.launch();
  // render...
  await browser.close();
}

// Good: Launch once, reuse pages (~0.5s per card)
const browser = await puppeteer.launch();
for (const card of cards) {
  const page = await browser.newPage();
  // render...
  await page.close();
}
await browser.close();
```

### 2. Parallel Rendering

```javascript
const browsers = await Promise.all([
  puppeteer.launch(),
  puppeteer.launch(),
  puppeteer.launch()
]);

const results = await Promise.all(
  cards.map((card, i) =>
    renderCard(card, browsers[i % browsers.length])
  )
);
```

### 3. Cache Rendered Cards

```javascript
const renderedCache = new Map();

function getCacheKey(card) {
  return `${card.name}-${card.imageData.slice(0, 100)}`;
}

const cacheKey = getCacheKey(card);
if (renderedCache.has(cacheKey)) {
  return renderedCache.get(cacheKey);
}

const rendered = await renderCardToPNG(cardHTML);
renderedCache.set(cacheKey, rendered);
```

## Comparison

| Aspect | Raw Image | Rendered Card |
|--------|-----------|---------------|
| **Preview Quality** | ❌ Incomplete | ✅ Professional |
| **Stats Visible** | ❌ No | ✅ Yes |
| **Branding** | ❌ Generic | ✅ Custom |
| **File Size** | 100-300 KB | 200-400 KB |
| **IPFS Cost** | $0.003 | $0.004 |
| **Render Time** | Instant | +3-7 seconds |
| **Works Everywhere** | ✅ Yes | ✅ Yes |
| **User Experience** | ⭐⭐ | ⭐⭐⭐⭐⭐ |

## Production Checklist

Before deploying:

- [ ] Install puppeteer: `npm install puppeteer`
- [ ] Test rendering locally with sample card
- [ ] Verify fonts load correctly
- [ ] Check image quality at 2x DPI
- [ ] Test IPFS upload with rendered card
- [ ] Confirm OpenSea displays correctly
- [ ] Monitor memory usage under load
- [ ] Set up error handling for failed renders
- [ ] Configure retry logic for timeouts
- [ ] Document expected render times for users

## Conclusion

Rendering the full styled card as the preview image provides:

✅ **Professional appearance** across all platforms
✅ **Consistent branding** in thumbnails and details
✅ **Better user experience** with visible stats
✅ **Higher perceived value** vs raw images
✅ **Minimal cost increase** ($0.001/NFT)
✅ **Acceptable performance** (+3-7s per mint)

This creates a **premium NFT experience** that matches the quality of traditional trading card games while maintaining the benefits of blockchain ownership and IPFS permanence.
