# 🚀 Quick Start Guide

Get your card generation pipeline running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `node-vibrant` - Color palette extraction
- `@ai-sdk/google` + `ai` - Gemini API integration
- `dotenv` - Environment variable management

## Step 2: Get Your Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## Step 3: Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your API key
# GOOGLE_GENERATIVE_AI_API_KEY=your_actual_key_here
```

## Step 4: Prepare Your Images

```bash
# Create input directory
mkdir input_dir

# Add your card images (copy/move your images here)
cp /path/to/your/card-images/*.png input_dir/
```

**Supported formats**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

## Step 5: Run the Generator!

```bash
npm run generate
```

## What Happens Next?

The script will:

1. ✅ Scan `input_dir/` for images
2. 🎨 Extract colors from each image (instant)
3. ✍️ Generate flavor text with Gemini AI (~4 seconds per image)
4. 🎭 Create unique themes based on colors
5. 🃏 Build card data objects
6. 📝 Generate NFT metadata (1/1 and common versions)
7. 💾 Save everything to `generated-cards/`

## Expected Output

```
generated-cards/
├── generatedThemes.js       # ← Import these into your React app
├── generatedCardData.js     # ← Import these too
├── flavorTexts.json         # ← Reference for flavor text
└── metadata/
    ├── card1-1of1.json
    ├── card1-common.json
    ├── card2-1of1.json
    └── card2-common.json
```

## Using the Generated Files

### In your React app (e.g., `src/data/cardData.js`):

```javascript
// Import generated data
import { GENERATED_THEMES } from '../../generated-cards/generatedThemes.js';
import { GENERATED_CARDS } from '../../generated-cards/generatedCardData.js';

// Merge with existing data
export const CARD_THEMES = {
  // Your existing themes
  cosmicPurple: { ... },
  silverAgent: { ... },
  
  // Add generated themes
  ...GENERATED_THEMES,
};

export const CARDS = [
  // Your existing cards
  { id: "lillie007", ... },
  { id: "40till5", ... },
  
  // Add generated cards
  ...GENERATED_CARDS,
];
```

## Customizing Generated Cards

After generation, you can edit:

### 1. Card Names & Subtitles
```javascript
// In generatedCardData.js
{
  name: "Dragon Warrior",  // ← Edit this
  subtitle: "⟨Champion⟩", // ← Change from ⟨Generated⟩
}
```

### 2. Stats & Levels
```javascript
{
  level: "5",              // ← Increase level
  stats: {
    attack: "7",           // ← Boost stats
    defense: "6",
  },
  manaCost: [
    { type: "hp", value: "8" },  // ← More HP
    { type: "mana", value: "4" }, // ← Higher cost
  ],
}
```

### 3. Flavor Text
```javascript
{
  flavorText: "Your custom epic text here!", // ← Rewrite as needed
}
```

### 4. Card Type
```javascript
{
  type: "Creature — Dragon Warrior", // ← Change type
}
```

## Tips for Best Results

### Image Quality
- **Recommended**: 1080x1080px or higher
- **Format**: PNG with transparency works great
- **Style**: Clear, distinct colors → better themes

### Batch Processing
- Start with 5-10 images to test
- Then scale up to 50-100 at a time
- Max 300 images per run (script limit)

### Rate Limiting
- Free tier: ~15 API calls per minute
- Script waits 4 seconds between calls
- Processing 50 images ≈ 3-4 minutes

### Flavor Text
- If generation fails, default text is used
- You can always edit afterward
- Some images may violate content policies

## Common Issues & Fixes

### Issue: "API_KEY not found"
**Fix**: Create `.env` file with your Gemini API key

### Issue: "No images found"
**Fix**: Add images to `input_dir/` folder

### Issue: "Rate limit exceeded"
**Fix**: Increase delay in config:
```javascript
delayMs: 5000,  // 5 seconds instead of 4
```

### Issue: "node-vibrant not found"
**Fix**: Run `npm install node-vibrant`

## Next Steps

1. ✅ Run the generator
2. 📝 Review generated files
3. ✏️ Edit card data as needed
4. 🎨 Import into your React app
5. 🚀 Deploy your cards!

## Example Command Flow

```bash
# Setup (one time)
npm install
cp .env.example .env
# Edit .env with your API key
mkdir input_dir
# Add your images

# Generate cards
npm run generate

# Review outputs
cat generated-cards/generatedCardData.js
cat generated-cards/generatedThemes.js

# Use in your app
# Import into your React component
```

## Production Checklist

Before using in production:

- [ ] Review all generated flavor text
- [ ] Verify card stats are balanced
- [ ] Check theme colors match your brand
- [ ] Test metadata files with NFT platform
- [ ] Upload images to your hosting
- [ ] Update baseUrl in config
- [ ] Test card rendering in React app
- [ ] Backup all generated files

---

**Questions?** Check the main README.md for detailed docs!

**Having fun?** The script processes images fast and generates unique content for each card! 🎴✨
