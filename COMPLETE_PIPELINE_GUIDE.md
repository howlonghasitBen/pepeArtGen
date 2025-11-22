# 🎨 Complete Card Pipeline Guide

**Generate cards from scratch with AI-powered images and content.**

---

## Overview

`completeCardPipeline.mjs` is your end-to-end card creation system:

1. **Generates images** from prompts using Google Imagen
2. **Analyzes visuals** to create thematic signature moves
3. **Writes flavor text** that references the moves
4. **Extracts colors** and builds React themes
5. **Exports everything** as React-ready code and NFT metadata

---

## 🔧 Configuration

### Basic Setup

```javascript
const CONFIG = {
  // Output directories
  outputDir: "./complete-cards",
  imageOutputDir: "./complete-cards/generated-images",
  
  // AI Models
  imagenModel: "imagen-4.0-generate-001",
  geminiModel: "gemini-2.5-flash-lite",
  
  // Generation settings
  numberOfCards: 70,
  imageAspectRatio: "16:9",
  
  // Rate limiting
  delayBetweenImages: 5000,         // 5 seconds
  delayBetweenFlavorText: 4000,     // 4 seconds
  
  // Deployment
  baseUrl: "https://howlonghasitben.github.io/surf-works",
  externalUrl: "https://howlonghasitben.github.io/surf-works",
  imageBasePath: "/images/card-images",
  
  // Metadata
  artist: "SURF FINANCE STUDIOS",
  collection: "Waves Collection",
  
  // Card defaults
  defaultStats: {
    level: "1",
    attack: "3",
    defense: "3",
    hp: "5",
    manaCost: "2",
    terrain: "?",
  },
  
  // Prompt configuration
  promptMode: "dnd-monsters",  // or "custom"
  customPrompts: [],           // Your custom prompts
};
```

---

## 📝 Prompt Modes

### Mode 1: D&D Monsters (Default)

Automatically fetches random monsters from the D&D 5e API:

```javascript
promptMode: "dnd-monsters"
```

**Benefits:**
- No prompt writing needed
- Lore-appropriate monsters
- Varied creature types
- Automatic naming

**Example creatures:**
- Aboleth
- Ancient Red Dragon
- Beholder
- Tarrasque
- Mind Flayer

---

### Mode 2: Custom Prompts

Use your own creative prompts:

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

**Tips for good prompts:**
- Be descriptive but concise
- Specify art style
- Include mood/atmosphere
- Mention colors if important
- Keep under 100 characters

---

## 🎨 Image Generation

### Aspect Ratios

```javascript
imageAspectRatio: "16:9"  // Default - landscape
imageAspectRatio: "1:1"   // Square
imageAspectRatio: "9:16"  // Portrait
imageAspectRatio: "4:3"   // Classic
imageAspectRatio: "3:4"   // Tall
```

### Custom Prompt Template

Modify how prompts are processed:

```javascript
imagePromptTemplate: (monsterName) =>
  `A high-resolution, detailed, digital art illustration of a ${monsterName} monster in the distinct visual style of "Pepe the Frog". Complete Background.`
```

**Customize for different styles:**

```javascript
// Realistic style
imagePromptTemplate: (monsterName) =>
  `A photorealistic illustration of a ${monsterName}, 8K quality, dramatic lighting, trending on ArtStation`

// Anime style
imagePromptTemplate: (monsterName) =>
  `A ${monsterName} in anime art style, vibrant colors, dynamic pose, studio quality`

// Oil painting style
imagePromptTemplate: (monsterName) =>
  `A ${monsterName} as a classical oil painting, dramatic lighting, masterwork quality`
```

---

## ✨ Signature Move Generation

The system analyzes each image and creates a unique signature move.

### How It Works

1. **Image Analysis** - AI examines visual characteristics
2. **Move Naming** - Creates a 2-5 word evocative name
3. **Flavor Writing** - Writes text that references the move
4. **Integration** - Combines into cohesive card text

### Example Outputs

**Move:** "Void Collapse"
**Flavor:** "Where its presence lingers, light itself forgets how to exist. Those who witness the collapse speak only in whispers, if they speak at all."

**Move:** "Crimson Requiem"
**Flavor:** "The final notes echo through battlefields long after the last warrior falls. Some say the song never truly ends."

**Move:** "Inferno Collapse"
**Flavor:** "When the skies burn and mountains turn to glass, kingdoms learn what true heat means. The only warning is the sudden absence of air."

---

## 🎯 Complete Workflow

### Step-by-Step Process

```
START
  ↓
[Fetch Monster Name] ← D&D API or Custom Prompt
  ↓
[Generate Image] ← Imagen API (~5-8 seconds)
  ↓ (saves to disk)
[Extract Colors] ← node-vibrant (~0.1 seconds)
  ↓
[Analyze Image] ← Gemini API (~3-4 seconds)
  ↓
[Generate Move + Flavor] ← Contextual AI generation
  ↓
[Create Theme] ← Color-based gradients
  ↓
[Build Card Data] ← Structured object
  ↓
[Export Metadata] ← NFT JSON files
  ↓
DONE!
```

**Total time per card:** ~10-15 seconds

---

## 📦 Output Structure

```
complete-cards/
├── generated-images/
│   ├── aboleth.png
│   ├── ancient_red_dragon.png
│   ├── beholder.png
│   └── ...
│
├── generatedThemes.js
│   // React-ready theme objects
│   export const GENERATED_THEMES = {
│     aboleth: { background: "...", header: {...}, ... },
│     ...
│   };
│
├── generatedCardData.js
│   // React-ready card data
│   export const GENERATED_CARDS = [
│     { id: "aboleth", name: "Aboleth", ... },
│     ...
│   ];
│
├── flavorTexts.json
│   // Reference file
│   {
│     "aboleth": "Shadow Consumption\nWhere darkness...",
│     ...
│   }
│
├── signatureMoves.json
│   // Reference file
│   {
│     "aboleth": "Shadow Consumption",
│     ...
│   }
│
└── metadata/
    ├── aboleth-1of1.json       // 1/1 NFT metadata
    ├── aboleth-common.json     // Common NFT metadata
    └── ...
```

---

## 🚀 Running the Generator

### Basic Run

```bash
node completeCardPipeline.mjs
```

### What You'll See

```
╔═══════════════════════════════════════════════════════════╗
║         🎴 COMPLETE CARD PIPELINE - UPDATED 🎴           ║
║   Moveset in Flavor Text: [MOVE]\n[FLAVOR]              ║
╚═══════════════════════════════════════════════════════════╝

🔧 Initializing APIs...
✅ GoogleGenAI initialized (Imagen + Gemini)
🎨 Initializing node-vibrant...
✅ node-vibrant loaded
✅ Created output directories

🎲 Fetching 70 D&D monsters...
  🎲 Fetching D&D monster...
  ✅ Selected: Aboleth
  ...

📊 Generating 70 complete cards
⏱️  Estimated time: ~20 minutes

============================================================
📸 Card 1/70: Aboleth
============================================================
  🎨 Generating image...
  📝 Prompt: "A high-resolution, detailed, digital art..."
  ✅ Image saved: aboleth.png
  🎨 Extracting color palette...
  ✅ Colors extracted
  ✍️  Analyzing image and generating move + flavor text...
  🎯 Move: "Shadow Consumption"
  ✅ Flavor: "Where its presence lingers, light itself..."
  🎭 Creating theme...
  🃏 Creating card data...
  📝 Creating metadata...
  ✅ Card complete!

⏳ Waiting 5000ms before next card...

[... continues for all cards ...]
```

---

## 💡 Advanced Usage

### Generate Specific Quantity

```javascript
// Quick test
numberOfCards: 5,

// Production run
numberOfCards: 100,

// Full collection
numberOfCards: 300,
```

### Batch Different Styles

Run multiple times with different configurations:

```bash
# Run 1: Fantasy creatures
promptMode: "dnd-monsters"
numberOfCards: 30

# Run 2: Cyberpunk characters
promptMode: "custom"
customPrompts: ["cyberpunk hacker...", "neon street samurai..."]
numberOfCards: 30

# Run 3: Nature spirits
promptMode: "custom"
customPrompts: ["forest guardian...", "water elemental..."]
numberOfCards: 30
```

### Customize Stats by Type

After generation, you can batch-edit stats:

```javascript
// In generatedCardData.js
const cards = GENERATED_CARDS.map(card => {
  if (card.name.includes("Dragon")) {
    return { ...card, stats: { attack: "7", defense: "6" }, level: "5" };
  }
  if (card.name.includes("Wizard")) {
    return { ...card, stats: { attack: "4", defense: "2" }, level: "3" };
  }
  return card;
});
```

---

## 📊 API Usage & Limits

### Free Tier Limits

**Imagen API:**
- 100 images per day
- Resets at midnight UTC
- This is your bottleneck

**Gemini API:**
- 1,500 requests per day
- Resets at midnight UTC
- Not usually limiting

### Optimization

```javascript
// Maximum daily generation (free tier)
numberOfCards: 100,

// If you hit limits:
// - Wait 24 hours for reset
// - OR upgrade to paid tier
// - OR run Unified Generator on existing images
```

### Cost Estimates

**Free tier:**
- 100 cards/day = **$0**

**Paid tier:**
- Imagen: ~$0.02 per image
- Gemini: ~$0.0001 per request
- 1000 cards ≈ **$20-25**

---

## 🎨 Customizing Output

### Edit Card Names

After generation, edit `generatedCardData.js`:

```javascript
{
  id: "aboleth",
  name: "Aboleth the Ancient",  // Add title
  subtitle: "⟨Champion⟩",        // Change subtitle
  ...
}
```

### Adjust Stats

```javascript
{
  level: "5",           // Increase level
  stats: {
    attack: "7",        // Boost attack
    defense: "6",       // Boost defense
  },
  manaCost: [
    { type: "hp", value: "8", ... },     // More HP
    { type: "mana", value: "4", ... },   // Higher cost
  ],
}
```

### Modify Flavor Text

```javascript
{
  flavorText: "Shadow Consumption\nYour custom flavor text here!",
  // Format: [MOVE]\n[FLAVOR]
}
```

---

## 🔍 Troubleshooting

### Image Generation Fails

**Cause:** Content policy violation

**Solution:**
- Try different prompts
- Avoid violent/graphic content
- Use more general descriptions
- Check Imagen content policies

### Colors Look Wrong

**Cause:** Image may be too dark/light or monochrome

**Solution:**
- Adjust image prompt for more color
- Manually edit themes after generation
- Use different art styles

### Rate Limits

**Cause:** Too many requests too fast

**Solution:**
```javascript
delayBetweenImages: 6000,        // Increase to 6 seconds
delayBetweenFlavorText: 5000,    // Increase to 5 seconds
```

### Out of Memory

**Cause:** Processing too many large images

**Solution:**
```javascript
numberOfCards: 50,  // Generate in smaller batches
```

---

## 📝 Example Session

```bash
$ node completeCardPipeline.mjs

🔧 Initializing APIs...
✅ GoogleGenAI initialized
✅ node-vibrant loaded

🎲 Fetching 10 D&D monsters...
✅ Selected: Aboleth
✅ Selected: Ancient Red Dragon
[...]

📊 Generating 10 complete cards
⏱️  Estimated time: ~3 minutes

[... 3 minutes later ...]

🎉 SUCCESS! Generated 10 complete cards!

📁 Output:
   ├── generated-images/ (10 images)
   ├── generatedThemes.js
   ├── generatedCardData.js
   ├── flavorTexts.json
   ├── signatureMoves.json
   └── metadata/ (20 files)
```

---

## 🚢 Deployment

### Update URLs

Before deploying, update CONFIG:

```javascript
baseUrl: "https://your-actual-site.com",
externalUrl: "https://your-actual-site.com",
imageBasePath: "/images/card-images",
```

### Upload Images

1. Upload `generated-images/` to your hosting
2. Ensure they're accessible at `baseUrl + imageBasePath`
3. Test one metadata animation_url

### Import to React

See [QUICKSTART.md](QUICKSTART.md#step-6-use-in-your-react-app)

---

## 🎯 Best Practices

1. **Start Small** - Generate 5-10 cards to test
2. **Review Output** - Check quality before scaling
3. **Batch Process** - 50-100 cards at a time
4. **Backup Data** - Save generated files
5. **Track Usage** - Monitor API limits
6. **Customize** - Edit generated data as needed

---

## 📖 Next Steps

- [UNIFIED_GENERATOR_GUIDE.md](UNIFIED_GENERATOR_GUIDE.md) - Process existing images
- [HOW_IT_WORKS.md](HOW_IT_WORKS.md) - Technical deep dive
- [CONFIGURATION.md](CONFIGURATION.md) - All config options
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues

---

**Built for SURF Waves Collection** 🌊

Generate 100 professional cards tonight! 🎴✨
