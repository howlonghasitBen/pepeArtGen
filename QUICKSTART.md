# 🚀 Quickstart Guide

Get your first cards generated in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `@google/genai` - Imagen API for image generation
- `@ai-sdk/google` - Gemini API for AI text
- `ai` - Vercel AI SDK
- `node-vibrant` - Color palette extraction
- `dotenv` - Environment variable management

---

## Step 2: Get API Key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy your API key

---

## Step 3: Configure Environment

Create a `.env` file in your project root:

```bash
# For Complete Pipeline (generates images from scratch)
API_KEY=your_google_ai_studio_key_here

# For Unified Generator (processes existing images)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_studio_key_here
```

**Note:** You can use the same key for both! Just add both lines.

---

## Step 4: Choose Your Workflow

### Option A: Generate Cards from Scratch

```bash
node completeCardPipeline.mjs
```

**What it does:**
1. Fetches random D&D monsters (or uses your custom prompts)
2. Generates images with Imagen
3. Creates signature moves
4. Writes flavor text
5. Builds color themes
6. Exports everything

**Time:** ~15 seconds per card

**Output:** Complete cards in `complete-cards/` folder

---

### Option B: Process Your Existing Images

```bash
# Create input directory
mkdir input_dir

# Add your images
cp /path/to/your/images/*.png input_dir/

# Run the generator
node unifiedCardGenerator.mjs
```

**What it does:**
1. Reads your images
2. Creates signature moves
3. Writes flavor text
4. Builds color themes
5. Exports everything

**Time:** ~10 seconds per card

**Output:** Complete card data in `generated-cards/` folder

---

## Step 5: Review Your Cards

### Output Files

**For Complete Pipeline:**
```
complete-cards/
├── generated-images/
│   ├── dragon.png
│   ├── wizard.png
│   └── ...
├── generatedThemes.js
├── generatedCardData.js
├── flavorTexts.json
├── signatureMoves.json
└── metadata/
    ├── dragon-1of1.json
    └── dragon-common.json
```

**For Unified Generator:**
```
generated-cards/
├── generatedThemes.js
├── generatedCardData.js
├── flavorTexts.json
├── signatureMoves.json
└── metadata/
    ├── yourimage-1of1.json
    └── yourimage-common.json
```

---

## Step 6: Use in Your React App

```javascript
// src/data/cardData.js
import { GENERATED_THEMES } from '../../generated-cards/generatedThemes.js';
import { GENERATED_CARDS } from '../../generated-cards/generatedCardData.js';

// Merge with existing data
export const CARD_THEMES = {
  // Your existing themes
  cosmicPurple: { ... },
  
  // Add generated themes
  ...GENERATED_THEMES,
};

export const CARDS = [
  // Your existing cards
  { id: "lillie007", ... },
  
  // Add generated cards
  ...GENERATED_CARDS,
];
```

---

## 🎯 Quick Examples

### Example 1: Generate 5 Test Cards

Edit `completeCardPipeline.mjs`:
```javascript
const CONFIG = {
  numberOfCards: 5,  // Change from 70 to 5
  // ... rest of config
};
```

Run:
```bash
node completeCardPipeline.mjs
```

Wait ~2 minutes, review output!

---

### Example 2: Process 10 Images

```bash
# Add 10 images to input_dir/
ls input_dir/
# dragon.png wizard.png knight.png ...

node unifiedCardGenerator.mjs
```

Wait ~2 minutes, review output!

---

### Example 3: Custom Prompts

Edit `completeCardPipeline.mjs`:
```javascript
const CONFIG = {
  promptMode: "custom",  // Change from "dnd-monsters"
  customPrompts: [
    "A mystical dragon warrior in epic fantasy art",
    "A cyberpunk hacker with neon aesthetics",
    "An ancient forest guardian made of living wood",
  ],
  numberOfCards: 3,
};
```

Run:
```bash
node completeCardPipeline.mjs
```

Get cards based on your exact prompts!

---

## 📊 Expected Output

### Card Data Structure

```javascript
{
  id: "dragon",
  name: "Dragon",
  subtitle: "⟨Generated⟩",
  level: "1",
  theme: "dragon",
  manaCost: [
    { type: "hp", value: "5", color: "..." },
    { type: "mana", value: "2", color: "..." },
    { type: "terrain", value: "?", color: "..." }
  ],
  image: "/images/card-images/dragon.png",
  type: "Creature — Generated",
  stats: {
    attack: "3",
    defense: "3"
  },
  flavorText: "Inferno Collapse\nWhen the skies burn and mountains turn to glass, kingdoms learn what true heat means.",
  artist: "SURF FINANCE STUDIOS",
  rarity: "1/1"
}
```

**Note:** Flavor text format is `[MOVE]\n[FLAVOR]`

---

### Theme Structure

```javascript
dragon: {
  background: "radial-gradient(...)",
  header: {
    background: "linear-gradient(...)",
    color: "#ffffff",
    textShadow: "...",
    boxShadow: "..."
  },
  imageArea: {
    background: "radial-gradient(...)",
    border: "2px solid #ff6b35",
    boxShadow: "..."
  },
  // ... complete theme object
}
```

---

## 🎨 Customization

### Change Default Stats

Edit the CONFIG in either script:

```javascript
const CONFIG = {
  defaultStats: {
    level: "3",     // Change from "1"
    attack: "5",    // Change from "3"
    defense: "4",   // Change from "3"
    hp: "8",        // Change from "5"
    manaCost: "3",  // Change from "2"
    terrain: "?",   // Or set specific terrain
  },
};
```

### Change Artist Name

```javascript
const CONFIG = {
  artist: "YOUR NAME HERE",
  collection: "YOUR COLLECTION NAME",
};
```

### Change Image Aspect Ratio (Complete Pipeline only)

```javascript
const CONFIG = {
  imageAspectRatio: "1:1",  // Options: "1:1", "16:9", "9:16", "4:3", "3:4"
};
```

---

## ⏱️ Performance Tips

### Speed Up Testing

```bash
# Generate just 1-2 cards for quick tests
numberOfCards: 2
```

### Batch Processing

```bash
# Process images in batches of 50
# Unified Generator can handle 300 at once
# But 50 is easier to review
```

### Rate Limiting

```bash
# If you hit rate limits, increase delays
delayMs: 5000,  # Increase from 4000 to 5000
```

---

## 🐛 Quick Troubleshooting

### "API_KEY not found"
- Check your `.env` file exists
- Verify no typos in the key name
- Make sure key is on a single line

### "No images found"
- Verify `input_dir/` exists
- Check images are .png, .jpg, .jpeg, .gif, or .webp
- Run: `ls input_dir/` to verify

### "Rate limit exceeded"
- Wait 24 hours for limit reset
- Reduce `numberOfCards`
- Increase `delayMs`

### Image generation fails
- Content may violate policies
- Try different prompts
- Check console for specific errors

---

## ✅ Verification

After running, verify you have:

- [ ] `generatedThemes.js` - React theme objects
- [ ] `generatedCardData.js` - React card objects
- [ ] `flavorTexts.json` - Reference file
- [ ] `signatureMoves.json` - Reference file
- [ ] `metadata/` folder with JSON files
- [ ] (Complete Pipeline only) `generated-images/` with PNG files

---

## 🎉 You're Ready!

You now have:
- ✅ Professional card data
- ✅ Color-matched themes
- ✅ AI-generated flavor text
- ✅ Signature moves
- ✅ NFT metadata

**Next steps:**
1. Import into your React app
2. Customize the generated data
3. Deploy your cards!

---

**Questions?** Check the full guides:
- [COMPLETE_PIPELINE_GUIDE.md](COMPLETE_PIPELINE_GUIDE.md)
- [UNIFIED_GENERATOR_GUIDE.md](UNIFIED_GENERATOR_GUIDE.md)
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
