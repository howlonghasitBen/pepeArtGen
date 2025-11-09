# 🎴 Complete Card Pipeline - Full Documentation

## 🚀 The Ultimate Card Generator

**One script. Zero manual work. Complete cards.**

This script generates EVERYTHING from scratch:

1. ✅ **Images** (Imagen API)
2. ✅ **Color palettes** (node-vibrant)
3. ✅ **AI flavor text** (Gemini)
4. ✅ **Custom themes** (color-matched)
5. ✅ **Card data** (React-ready)
6. ✅ **NFT metadata** (1/1 + common)

## 📦 Installation

```bash
npm install @google/genai @ai-sdk/google ai node-vibrant dotenv
```

## ⚙️ Setup

### 1. Get Your API Key

You need **ONE API key** that works for both Imagen and Gemini:

1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy your key

### 2. Configure Environment

Create `.env` file:

```env
API_KEY=your_google_ai_studio_key_here
```

### 3. Run It!

```bash
node completeCardPipeline.mjs
```

## 🎯 What It Does

### The Complete Flow

```
START
  ↓
[Generate Image] ← Imagen API (~5 seconds)
  ↓ (saves to disk)
[Extract Colors] ← node-vibrant (~0.1 seconds)
  ↓
[Generate Flavor Text] ← Gemini (~4 seconds)
  ↓
[Create Theme] ← Computed from colors (~instant)
  ↓
[Build Card Data] ← Templated structure (~instant)
  ↓
[Export Metadata] ← Both 1/1 and common (~instant)
  ↓
DONE!
```

**Per card: ~10-15 seconds total**

### Output Structure

```
complete-cards/
├── generated-images/          # Your AI-generated art
│   ├── aboleth.png
│   ├── dragon.png
│   └── wizard.png
├── generatedThemes.js         # Import to CARD_THEMES
├── generatedCardData.js       # Import to CARDS
├── flavorTexts.json           # Reference
└── metadata/
    ├── aboleth-1of1.json
    ├── aboleth-common.json
    ├── dragon-1of1.json
    └── dragon-common.json
```

## 🔧 Configuration

Edit the `CONFIG` object in `completeCardPipeline.mjs`:

```javascript
const CONFIG = {
  // How many cards to generate
  numberOfCards: 10,

  // Image settings
  imageAspectRatio: "16:9", // "1:1", "16:9", "9:16", "4:3", "3:4"

  // Rate limiting (stay within free tier)
  delayBetweenImages: 5000, // 5 seconds
  delayBetweenFlavorText: 4000, // 4 seconds

  // Prompt mode
  promptMode: "dnd-monsters", // or "custom"

  // Custom prompts (if promptMode is "custom")
  customPrompts: [
    "A mystical dragon warrior in epic fantasy art style",
    "A cyberpunk hacker with neon aesthetics",
    "An ancient forest guardian made of living wood",
  ],

  // Card defaults
  defaultStats: {
    level: "1",
    attack: "3",
    defense: "3",
    hp: "5",
    manaCost: "2",
    terrain: "?",
  },
};
```

## 🎨 Two Generation Modes

### Mode 1: D&D Monsters (Default)

Automatically fetches random monsters from D&D API:

```javascript
promptMode: "dnd-monsters";
```

**Generates prompts like:**

- "A high-resolution, detailed, digital art illustration of an **Aboleth** monster in an epic fantasy trading card art style..."
- "A high-resolution, detailed, digital art illustration of a **Tarrasque** monster in an epic fantasy trading card art style..."

### Mode 2: Custom Prompts

Use your own prompts:

```javascript
promptMode: "custom",
customPrompts: [
  "A mystical dragon warrior in epic fantasy art style",
  "A cyberpunk hacker with neon aesthetics",
  "An ancient forest guardian made of living wood",
  "A celestial angel with wings of pure light",
  "A demonic overlord wreathed in flames",
]
```

## 📊 Cost & Performance

### API Usage

**Free Tier Includes:**

- Imagen: 100 images/day (resets daily)
- Gemini: 1,500 requests/day (resets daily)

**This script uses:**

- 1 Imagen call per card (image)
- 1 Gemini call per card (flavor text)

**So you can generate:**

- **100 complete cards per day** (limited by Imagen)
- Totally free!

### Time Estimates

- **10 cards**: ~2-3 minutes
- **50 cards**: ~10-12 minutes
- **100 cards**: ~20-25 minutes

### Rate Limits

The script automatically respects rate limits:

- 5 seconds between image generations
- 4 seconds between flavor text generations
- Total: ~10-15 seconds per card

## 🎯 Example Session

```bash
$ node completeCardPipeline.mjs

╔═══════════════════════════════════════════════════════════╗
║         🎴 COMPLETE CARD PIPELINE 🎴                      ║
║   Image → Colors → Flavor → Theme → Data → Metadata     ║
╚═══════════════════════════════════════════════════════════╝

🔧 Initializing APIs...
✅ GoogleGenAI initialized (Imagen + Gemini)
🎨 Initializing node-vibrant...
✅ node-vibrant loaded
✅ Created output directories

🎲 Fetching 10 D&D monsters...
  🎲 Fetching D&D monster...
  ✅ Selected: Aboleth
  ...

📊 Generating 10 complete cards
⏱️  Estimated time: ~3 minutes

============================================================
📸 Card 1/10: Aboleth
============================================================
  🎨 Generating image...
  📝 Prompt: "A high-resolution, detailed, digital art illustration..."
  ✅ Image saved: aboleth.png
  🎨 Extracting color palette...
  ✅ Colors extracted
  ✍️  Generating flavor text with Gemini...
  ✅ Flavor text: "From the depths where light fears to tread..."
  🎭 Creating theme...
  🃏 Creating card data...
  📝 Creating metadata...
  ✅ Card complete!

⏳ Waiting 5000ms before next card...

[... continues for all 10 cards ...]

📝 Saving output files...

✅ Saved: generatedThemes.js
✅ Saved: generatedCardData.js
✅ Saved: 20 metadata files
✅ Saved: flavorTexts.json

🎉 SUCCESS! Generated 10 complete cards!
```

## 🎨 Generated Card Example

**Input:** Nothing! Just run the script

**Output:**

**Image:** `complete-cards/generated-images/aboleth.png`  
_AI-generated epic fantasy art of an Aboleth_

**Card Data:**

```javascript
{
  id: "aboleth",
  name: "Aboleth",
  subtitle: "⟨Generated⟩",
  level: "1",
  theme: "aboleth",
  manaCost: [
    { type: "hp", value: "5", color: "radial-gradient(...)" },
    { type: "mana", value: "2", color: "radial-gradient(...)" },
    { type: "terrain", value: "?", color: "radial-gradient(...)" },
  ],
  image: "/images/card-images/aboleth.png",
  type: "Creature — Generated",
  stats: { attack: "3", defense: "3" },
  flavorText: "From the depths where light fears to tread, ancient knowledge whispers through tentacled darkness.",
  artist: "SURF FINANCE STUDIOS",
  rarity: "1/1",
}
```

**Theme:**

```javascript
aboleth: {
  background: "radial-gradient(...)", // Color-matched to image
  header: { ... },
  imageArea: { ... },
  // ... complete theme
}
```

**Metadata:** `aboleth-1of1.json` + `aboleth-common.json`

## 💡 Tips & Tricks

### Get Better Images

**Customize the prompt template:**

```javascript
imagePromptTemplate: (monsterName) =>
  `A photorealistic, highly detailed illustration of a ${monsterName} in dramatic lighting with a mystical background, 8K quality, trending on ArtStation`,
```

**Or use specific art styles:**

```javascript
imagePromptTemplate: (monsterName) =>
  `A ${monsterName} in the style of Magic: The Gathering card art, painted by John Avon, fantasy illustration, detailed and dramatic`,
```

### Batch Different Styles

Run multiple times with different settings:

```bash
# Fantasy monsters
numberOfCards: 20,
promptMode: "dnd-monsters"

# Cyberpunk characters
numberOfCards: 20,
promptMode: "custom",
customPrompts: ["cyberpunk hacker...", "neon street samurai..."]

# Nature spirits
numberOfCards: 20,
customPrompts: ["forest guardian...", "water elemental..."]
```

### Customize After Generation

All files are editable:

1. **Edit images**: Use Photoshop/GIMP on generated PNGs
2. **Edit card data**: Modify `generatedCardData.js`
3. **Edit themes**: Tweak colors in `generatedThemes.js`
4. **Edit metadata**: Update JSON files

## 🐛 Troubleshooting

### "API_KEY not found"

Create `.env` with your Google AI Studio key

### Image generation fails

- May be content policy violation
- Script continues with remaining cards
- Try different prompts

### "Rate limit exceeded"

- Increase delays in CONFIG
- Free tier: 100 images/day max
- Wait 24 hours for reset

### "Could not load node-vibrant"

```bash
npm install node-vibrant
```

### Images look weird

- Try different aspect ratios (1:1, 16:9, etc.)
- Modify the prompt template
- Add style keywords (realistic, anime, painted, etc.)

## 🔥 Advanced Usage

### Generate Specific Cards

Create custom list:

```javascript
const cardNames = [
  "Fire Dragon",
  "Ice Wizard",
  "Shadow Assassin",
  "Holy Paladin",
  "Nature Druid",
];

// Then loop through these instead of random monsters
```

### Different Stats Per Card Type

```javascript
// After generating cardData, customize:
if (cardData.name.includes("Dragon")) {
  cardData.stats.attack = "7";
  cardData.level = "5";
} else if (cardData.name.includes("Wizard")) {
  cardData.stats.defense = "2";
  cardData.manaCost[1].value = "4"; // Higher mana cost
}
```

### Mix Generated and Existing Cards

```javascript
// In your main cardData.js
import { GENERATED_CARDS } from './complete-cards/generatedCardData.js';

export const CARDS = [
  // Your hand-crafted special cards
  { id: "lillie007", ... },

  // Add ALL generated cards
  ...GENERATED_CARDS,
];
```

## 📈 Scaling Up

### Generate 100 Cards

```javascript
numberOfCards: 100,
```

Run overnight (~20-25 minutes).

### Generate Collections

Create themed batches:

**Day 1: Dragons**

```javascript
customPrompts: [
  "A fierce red dragon breathing fire",
  "An ancient ice dragon",
  "A shadow dragon wreathed in darkness",
  // ... 20 dragon prompts
];
```

**Day 2: Wizards**

```javascript
customPrompts: [
  "A powerful archmage with glowing runes",
  "A dark necromancer summoning spirits",
  // ... 20 wizard prompts
];
```

## 🎓 Understanding the Pipeline

### Why This Order?

1. **Image First** - Need visual to extract colors
2. **Colors Second** - Need colors for theme generation
3. **Flavor Text** - AI describes what it sees in image
4. **Theme** - Built from extracted colors
5. **Card Data** - Combines all previous steps
6. **Metadata** - Exports everything for NFTs

### What Can I Customize?

✅ Image prompts (style, content, quality)  
✅ Aspect ratio (1:1, 16:9, etc.)  
✅ Default stats (HP, attack, defense)  
✅ Flavor text style (prompt engineering)  
✅ Output URLs (baseUrl, imagePath)  
✅ Rate limits (delays between calls)

❌ Can't customize color extraction (automatic)  
❌ Can't customize theme structure (matches React)

## 🌟 Why This is Amazing

**Before:**

1. Commission art ($50-500 per card)
2. Edit in Photoshop (hours)
3. Write flavor text (30 minutes per card)
4. Manually create color themes (trial & error)
5. Hand-code card data
6. Create metadata files

**Total: Days of work, hundreds of dollars**

**After:**

```bash
node completeCardPipeline.mjs
```

**Total: 2 minutes, $0**

## 📄 License

Use freely in your SURF project! 🏄‍♂️

---

**Built for the SURF Waves Collection** 🌊

Generate 100 unique cards tonight! 🎴✨
