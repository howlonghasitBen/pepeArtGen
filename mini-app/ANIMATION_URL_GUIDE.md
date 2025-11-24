# NFT Animation URL - Interactive Trading Cards

## Overview

This system uploads **interactive HTML trading cards** to IPFS as the `animation_url` field in NFT metadata. This allows marketplaces like OpenSea to display the full styled card, not just the raw AI-generated image.

## What Gets Uploaded

### 1. Raw AI Image (`image` field)
- The original AI-generated image from Google Imagen
- Used as the thumbnail in marketplaces
- IPFS URI: `ipfs://QmImageHash...`

### 2. HTML Trading Card (`animation_url` field) ✨
- **Fully styled interactive card** with:
  - Header with mana orbs and card title
  - Framed AI-generated image
  - Type and power stats (ATK/DEF)
  - Flavor text with decorative quotes
  - Artist info and rarity indicator
  - All color themes extracted from the image
- IPFS URI: `ipfs://QmHTMLHash...`

### 3. Metadata JSON
- Standard OpenSea metadata
- Points to both image and HTML card
- Includes attributes for filtering/rarity

## Example Metadata Structure

```json
{
  "name": "Shadow Dragon",
  "description": "Eternal Darkness\nFrom the void it emerges, consuming light itself...",
  "image": "ipfs://QmXxYy123.../shadowdragon-1234567890.png",
  "animation_url": "ipfs://QmZzAa456.../shadowdragon-1234567890.html",
  "attributes": [
    { "trait_type": "Type", "value": "Creature — Generated" },
    { "trait_type": "Level", "value": "1" },
    { "trait_type": "Attack", "value": 7 },
    { "trait_type": "Defense", "value": 5 },
    { "trait_type": "HP", "value": 8 },
    { "trait_type": "Mana", "value": 3 },
    { "trait_type": "Rarity", "value": "1/1" },
    { "trait_type": "Artist", "value": "Waves TCG" }
  ]
}
```

## How It Works

### Backend Upload Flow

```javascript
// server/api.mjs - /api/upload-to-ipfs endpoint

1. Upload raw AI image → Get imageCID
   ├─ Input: base64 PNG from Google Imagen
   └─ Output: ipfs://QmImageHash

2. Generate HTML card → Upload → Get htmlCID
   ├─ Generate standalone HTML with:
   │  ├─ Card data embedded
   │  ├─ All CSS inlined
   │  ├─ Google Fonts CDN
   │  └─ Image loaded from IPFS gateway
   └─ Output: ipfs://QmHTMLHash

3. Create metadata JSON → Upload → Get metadataCID
   ├─ image: ipfs://QmImageHash
   ├─ animation_url: ipfs://QmHTMLHash
   └─ Output: ipfs://QmMetadataHash
```

### HTML Card Generator

```javascript
// server/cardHTMLGenerator.mjs

generateCardHTML(card, imageIPFSUrl)
  ├─ Renders complete card layout
  ├─ Inlines all CSS from SwipeableCard.css
  ├─ Embeds card data (stats, flavor text, etc.)
  ├─ Uses theme colors extracted from image
  ├─ Loads image from IPFS gateway URL
  └─ Returns standalone HTML string
```

## OpenSea Display Behavior

### On OpenSea:
1. **Thumbnail**: Shows the `image` field (raw AI image)
2. **Detail Page**: Shows the `animation_url` (full styled card)
3. **Marketplace**: Users see the complete interactive card

### Advantages:
- ✅ Full card styling preserved
- ✅ All stats and flavor text visible
- ✅ Responsive design (mobile & desktop)
- ✅ No external dependencies (except Google Fonts)
- ✅ Works on all IPFS-compatible marketplaces

## File Structure on IPFS

```
After minting "Shadow Dragon":

ipfs://QmImageHash.../shadowdragon-123.png
└─ Raw AI-generated image (512x512 PNG)

ipfs://QmHTMLHash.../shadowdragon-123.html
└─ Standalone HTML card with:
   ├─ Inlined CSS (10KB)
   ├─ Card data embedded
   └─ Image loaded from ipfs://QmImageHash

ipfs://QmMetadataHash.../metadata.json
└─ {
     "image": "ipfs://QmImageHash...",
     "animation_url": "ipfs://QmHTMLHash...",
     ...
   }
```

## Testing the HTML Card

### 1. Via IPFS Gateway (Direct)

```bash
# After upload, you'll receive:
htmlCID="QmHTMLHash..."
htmlGateway="https://gateway.pinata.cloud/ipfs/QmHTMLHash..."

# Open in browser:
open "https://gateway.pinata.cloud/ipfs/${htmlCID}"
```

### 2. Via OpenSea Testnet

```bash
# After minting, wait 1-5 minutes
# Then visit:
https://testnets.opensea.io/assets/base-sepolia/CONTRACT_ADDRESS/TOKEN_ID

# Click on the NFT to see the animation_url displayed
```

### 3. Via Local Preview

You can test the HTML generation locally before uploading:

```javascript
import { generateCardHTML } from './server/cardHTMLGenerator.mjs';

const testCard = {
  name: "Test Dragon",
  stats: { attack: 5, defense: 3 },
  flavorText: "A test card",
  // ... other card data
};

const html = generateCardHTML(testCard, "https://placehold.co/600x400");
console.log(html); // View the generated HTML
```

## Cost Implications

### Per NFT Upload:
- **Image**: ~100-300 KB @ $0.001 = ~$0.001
- **HTML Card**: ~15-20 KB @ $0.001 = ~$0.001
- **Metadata**: ~1 KB @ $0.001 = ~$0.001
- **Total**: ~$0.003 per NFT on Pinata

### Storage Efficiency:
- HTML is **text-based** (~15KB vs potential 500KB+ image)
- CSS is **inlined** (no external requests)
- Fonts loaded from **Google CDN** (not stored)

## Customization

### Modify Card Styling

Edit `server/cardHTMLGenerator.mjs` to change:

```javascript
// Background gradients
background: ${theme.background || 'linear-gradient(145deg, #2a2a2a, #1a1a1a)'}

// Border styles
border: ${theme.imageArea?.border || '2px solid #ffffff'}

// Font sizes
font-size: 0.7rem;

// Colors
color: ${theme.header?.color || '#ffffff'}
```

### Add New Card Elements

```javascript
// In generateCardHTML() function, add:

<div class="custom-element">
  ${escapeHtml(card.customField || '')}
</div>
```

### Change Image Resolution

```javascript
// In api.mjs, modify image scaling:

.card-image {
  width: 100%;      // Full width instead of auto
  height: auto;     // Maintain aspect ratio
  transform: scale(1);  // No zoom
}
```

## Troubleshooting

### HTML Card Not Displaying on OpenSea

**Cause**: OpenSea may cache old metadata

**Solution**:
```bash
# Force refresh via OpenSea API
curl -X POST "https://api.opensea.io/api/v1/asset/BASE_SEPOLIA/CONTRACT/TOKEN_ID/?force_update=true"

# Or wait 24 hours for automatic cache refresh
```

### Image Not Loading in HTML Card

**Cause**: IPFS gateway timeout or CORS

**Solution**:
```javascript
// In cardHTMLGenerator.mjs, add multiple gateway fallbacks:

<img
  src="${imageIPFSUrl}"
  onerror="this.onerror=null; this.src='https://cloudflare-ipfs.com/ipfs/${imageCID}'"
  alt="${escapeHtml(card.name)}"
/>
```

### HTML File Too Large

**Cause**: Inlined base64 images or excessive CSS

**Solution**:
- ✅ Use IPFS URL for image (not base64)
- ✅ Minify CSS in production
- ✅ Remove unused styles

## Production Optimizations

### 1. Minify HTML

```javascript
import { minify } from 'html-minifier';

const minifiedHTML = minify(cardHTML, {
  collapseWhitespace: true,
  removeComments: true,
  minifyCSS: true,
});
```

### 2. CDN Acceleration

Use Pinata dedicated gateways for faster loading:

```javascript
const imageGatewayUrl = `https://YOUR-GATEWAY.mypinata.cloud/ipfs/${imageCID}`;
```

### 3. Cache Metadata

Store uploaded CIDs in database to avoid re-uploading identical cards:

```javascript
const existingUpload = await db.findByCID(imageHash);
if (existingUpload) {
  return existingUpload.metadataURI;
}
```

## Comparison: With vs Without animation_url

| Feature | Without animation_url | With animation_url |
|---------|----------------------|-------------------|
| **Thumbnail** | Raw AI image | Raw AI image |
| **Detail View** | Raw AI image only | ✨ Full styled card |
| **Stats Visible** | ❌ Only in attributes | ✅ In visual card |
| **Flavor Text** | ❌ Only in description | ✅ Styled on card |
| **Branding** | ❌ Generic | ✅ Custom TCG style |
| **User Experience** | Basic | Professional |
| **File Size** | ~100-300 KB | ~115-320 KB |
| **Cost** | $0.001/NFT | $0.003/NFT |

## Conclusion

The `animation_url` feature transforms your NFTs from **simple images** into **professional trading cards**, providing:

- ✅ Enhanced visual presentation
- ✅ Better user experience on marketplaces
- ✅ Preserved styling and branding
- ✅ Interactive elements (hover effects)
- ✅ Professional appearance
- ✅ Minimal additional cost (~$0.002/NFT)

This matches the **production standards** outlined in the technical specification for high-quality NFT collections.
