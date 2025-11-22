# 🖼️ Unified Card Generator Guide

**Process your existing images into complete trading cards with AI-powered content.**

---

## Overview

`unifiedCardGenerator.mjs` transforms your artwork into complete trading cards:

1. **Processes images** you already have
2. **Analyzes visuals** to create thematic signature moves
3. **Writes flavor text** that references the moves
4. **Extracts colors** and builds React themes
5. **Exports everything** as React-ready code and NFT metadata

**Perfect for:**
- Custom artwork
- Commissioned illustrations
- AI-generated images from other tools
- Photos and renders
- Mixed media

---

## 🔧 Configuration

```javascript
const CONFIG = {
  // Input/Output
  inputDir: "./input_dir",
  outputDir: "./generated-cards",
  
  // AI Model
  geminiModel: "gemini-2.0-flash-exp",
  
  // Rate limiting
  delayMs: 4000,     // 4 seconds between API calls
  maxImages: 300,    // Maximum images to process
  
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
};
```

---

## 📥 Preparing Your Images

### Supported Formats

- ✅ `.png` - Best for transparency
- ✅ `.jpg` / `.jpeg` - Good for photos
- ✅ `.gif` - Animated images
- ✅ `.webp` - Modern format

### Recommended Specs

**Resolution:**
- Minimum: 512x512px
- Recommended: 1024x1024px or higher
- Maximum: 4096x4096px

**File Size:**
- Keep under 10MB per image
- Larger files work but slow processing

**Quality Tips:**
- Clear, distinct colors → Better themes
- Good contrast → Better text generation
- Centered subject → Better analysis

### Setup Input Directory

```bash
# Create input directory
mkdir input_dir

# Copy your images
cp /path/to/your/artwork/*.png input_dir/

# Verify images
ls input_dir/
# Output: dragon.png wizard.png knight.png ...
```

---

## ✨ Signature Move Generation

The system analyzes your images to create unique signature moves.

### How It Works

1. **Visual Analysis** - AI examines your image
   - Colors and lighting
   - Subject and composition
   - Mood and atmosphere
   - Visual themes

2. **Move Creation** - Generates 2-5 word ability name
   - Related to visual elements
   - Evocative and memorable
   - Thematically appropriate

3. **Flavor Writing** - Creates 1-2 sentence description
   - References the move
   - Describes impact/effect
   - Uses atmospheric language
   - Creates emotion

### Example Outputs

**Image:** Dark shadowy creature
**Move:** "Shadow Consumption"
**Flavor:** "Where its presence lingers, light itself forgets how to exist. Those who witness the collapse speak only in whispers, if they speak at all."

**Image:** Fiery dragon
**Move:** "Inferno Collapse"
**Flavor:** "When the skies burn and mountains turn to glass, kingdoms learn what true heat means. The only warning is the sudden absence of air."

**Image:** Ethereal spirit
**Move:** "Spectral Drift"
**Flavor:** "In the space between heartbeats, it moves through walls like water through a sieve. Those it touches forget they ever felt warmth."

---

## 🎨 Color Extraction & Themes

### Palette Extraction

Uses `node-vibrant` to extract 6 colors from each image:
- **Vibrant** - Bright, saturated color
- **Dark Vibrant** - Deep, rich color
- **Light Vibrant** - Bright, light color
- **Muted** - Soft, desaturated color
- **Dark Muted** - Deep muted color
- **Light Muted** - Light muted color

### Theme Generation

Creates React-ready CSS themes:

```javascript
dragonWarrior: {
  background: "radial-gradient(...)",  // Complex gradient
  header: {
    background: "linear-gradient(...)",
    color: "#ffffff",
    textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
    boxShadow: "..."
  },
  imageArea: {
    background: "radial-gradient(...)",
    border: "2px solid #ff6b35",
    boxShadow: "..."
  },
  // ... more theme properties
}
```

**Automatic features:**
- Smart text color (black or white based on brightness)
- Coordinated gradients
- Complementary borders
- Atmospheric shadows
- Consistent styling

---

## 🚀 Running the Generator

### Basic Run

```bash
node unifiedCardGenerator.mjs
```

### What You'll See

```
╔═══════════════════════════════════════════════════════════╗
║       🎴 UNIFIED CARD GENERATOR - UPDATED 🎴             ║
║   Moveset in Flavor Text: [MOVE]\n[FLAVOR]              ║
╚═══════════════════════════════════════════════════════════╝

✅ Found input directory: ./input_dir
🎨 Initializing node-vibrant...
✅ node-vibrant loaded
✅ Created output directory: ./generated-cards

📊 Found 20 images to process
⏱️  Rate limit: 4000ms between Gemini API calls

📸 Processing: dragon-warrior.png
  🎨 Extracting color palette...
  ✅ Colors extracted
  ✍️  Analyzing image and generating move + flavor text...
  🎯 Move: "Inferno Collapse"
  ✅ Flavor: "When the skies burn and mountains..."
  🎭 Creating theme object...
  🃏 Creating card data...
  📝 Creating metadata files...
  ✅ Complete!

[1/20] Progress: 5%

⏳ Waiting 4000ms before next API call...

[... continues for all images ...]

📝 Generating output files...

✅ Saved: generated-cards/generatedThemes.js
✅ Saved: generated-cards/generatedCardData.js
✅ Saved: 40 metadata files
✅ Saved: generated-cards/flavorTexts.json
✅ Saved: generated-cards/signatureMoves.json

🎉 SUCCESS! Generated 20 complete cards!
```

---

## 📦 Output Structure

```
generated-cards/
├── generatedThemes.js
│   // Color-matched themes for each image
│   export const GENERATED_THEMES = {
│     dragonWarrior: { ... },
│     mysticWizard: { ... },
│     ...
│   };
│
├── generatedCardData.js
│   // Complete card data
│   export const GENERATED_CARDS = [
│     {
│       id: "dragonwarrior",
│       name: "Dragon Warrior",
│       flavorText: "Inferno Collapse\nWhen the skies...",
│       theme: "dragonWarrior",
│       ...
│     },
│     ...
│   ];
│
├── flavorTexts.json
│   // Reference: all flavor texts
│   {
│     "dragon-warrior.png": "Inferno Collapse\nWhen...",
│     ...
│   }
│
├── signatureMoves.json
│   // Reference: all signature moves
│   {
│     "dragon-warrior.png": "Inferno Collapse",
│     ...
│   }
│
└── metadata/
    ├── dragonwarrior-1of1.json
    ├── dragonwarrior-common.json
    └── ...
```

---

## 💡 Advanced Usage

### Process Specific Images

```bash
# Only process certain images
mkdir input_dir/batch1
cp dragon*.png input_dir/batch1/

# Update CONFIG
inputDir: "./input_dir/batch1",

# Run
node unifiedCardGenerator.mjs
```

### Batch Different Types

```bash
# Batch 1: Heroes
mkdir input_dir/heroes
cp hero-*.png input_dir/heroes/

# Batch 2: Monsters
mkdir input_dir/monsters
cp monster-*.png input_dir/monsters/

# Process separately for different stats
```

### Custom Stats by Image Name

After generation, edit `generatedCardData.js`:

```javascript
const cards = GENERATED_CARDS.map(card => {
  // Heroes get high HP
  if (card.image.includes('hero')) {
    return {
      ...card,
      stats: { attack: "4", defense: "5" },
      manaCost: [
        { type: "hp", value: "8", ... },
        ...card.manaCost.slice(1)
      ]
    };
  }
  
  // Monsters get high attack
  if (card.image.includes('monster')) {
    return {
      ...card,
      stats: { attack: "7", defense: "3" },
      level: "5"
    };
  }
  
  return card;
});
```

---

## 🎯 Workflow Examples

### Example 1: Commission + AI Mix

```bash
# Commissioned art for 10 hero cards
mkdir input_dir/heroes
cp commissioned/*.png input_dir/heroes/

# AI-generated art for 40 common cards
# (from another tool like Midjourney)
mkdir input_dir/commons
cp midjourney-output/*.png input_dir/commons/

# Process all together
cp input_dir/heroes/*.png input_dir/
cp input_dir/commons/*.png input_dir/

node unifiedCardGenerator.mjs

# Result: 50 cards with consistent theming
```

### Example 2: Iterative Design

```bash
# Round 1: Test with 5 images
cp test-images/*.png input_dir/
node unifiedCardGenerator.mjs
# Review output...

# Round 2: Refine based on results
# Update images, run again

# Round 3: Full collection
cp all-final-images/*.png input_dir/
node unifiedCardGenerator.mjs
```

### Example 3: Multiple Art Styles

```bash
# Fantasy style
mkdir input_dir/fantasy
cp fantasy-art/*.png input_dir/fantasy/
# Process...

# Cyberpunk style
mkdir input_dir/cyberpunk
cp cyberpunk-art/*.png input_dir/cyberpunk/
# Process...

# Combine in React app with style-specific themes
```

---

## 📊 API Usage & Limits

### Free Tier Limits

**Gemini API:**
- 1,500 requests per day
- Resets at midnight UTC
- Perfect for large batches!

**Imagen API:**
- Not used in this script
- Only Unified Generator doesn't generate images

### Optimization

```javascript
// Maximum recommended batch
maxImages: 300,

// If processing many images:
delayMs: 4000,  // Keep at 4 seconds

// For faster testing:
maxImages: 10,  // Process only first 10
```

### Cost Estimates

**Free tier:**
- 300 cards/day = **$0**

**Paid tier:**
- Gemini: ~$0.0001 per request
- 1000 cards ≈ **$0.10**

Unified Generator is extremely cost-effective!

---

## 🎨 Customizing Output

### Edit Card Names

Images are automatically named from filenames:

**Filename:** `dragon-warrior.png`
**Card Name:** "Dragon Warrior"

For custom names, rename files before processing:

```bash
mv img001.png "Ancient Fire Dragon.png"
mv img002.png "Mystic Ice Wizard.png"
```

### Adjust All Stats at Once

Edit CONFIG before running:

```javascript
defaultStats: {
  level: "3",      // All cards level 3
  attack: "5",     // All cards 5 attack
  defense: "4",    // All cards 4 defense
  hp: "7",         // All cards 7 HP
  manaCost: "3",   // All cards cost 3 mana
  terrain: "⛰️",  // All cards mountain terrain
}
```

### Modify Themes

After generation, edit `generatedThemes.js`:

```javascript
dragonWarrior: {
  background: "linear-gradient(45deg, #ff0000, #000000)",  // Custom
  header: {
    background: "#ff0000",  // Solid color instead of gradient
    ...
  },
  ...
}
```

---

## 🔍 Troubleshooting

### No Images Found

**Symptoms:**
```
❌ ERROR: No image files found in ./input_dir!
```

**Solutions:**
- Check `input_dir/` exists
- Verify images are supported formats (.png, .jpg, .jpeg, .gif, .webp)
- Run `ls input_dir/` to see what's there
- Check file permissions

### Color Extraction Fails

**Symptoms:**
```
❌ Error processing image.png:
Could not extract colors
```

**Solutions:**
- Image may be corrupted - try re-saving
- Convert to PNG for best results
- Check image isn't completely black/white
- Try different image editor to export

### API Errors

**Symptoms:**
```
❌ Error generating move and flavor text
```

**Solutions:**
- Check `.env` file has correct key
- Verify API key is active
- Check rate limits (1,500/day)
- Try again with longer `delayMs`

### Memory Issues

**Symptoms:**
```
JavaScript heap out of memory
```

**Solutions:**
```javascript
// Process in smaller batches
maxImages: 100,  // Instead of 300

// Or run Node with more memory
node --max-old-space-size=4096 unifiedCardGenerator.mjs
```

---

## 📝 Example Session

```bash
$ ls input_dir/
dragon.png  wizard.png  knight.png  demon.png  angel.png

$ node unifiedCardGenerator.mjs

✅ Found input directory: ./input_dir
✅ node-vibrant loaded
📊 Found 5 images to process

📸 Processing: dragon.png
  ✅ Colors extracted
  🎯 Move: "Inferno Collapse"
  ✅ Flavor: "When the skies burn..."
  ✅ Complete!

[... 3 more minutes ...]

🎉 SUCCESS! Generated 5 complete cards!

$ ls generated-cards/
generatedThemes.js
generatedCardData.js
flavorTexts.json
signatureMoves.json
metadata/
```

---

## 🚢 Deployment

### Prepare Images for Production

```bash
# Optimize images
# (use your preferred image optimizer)

# Upload to hosting
# Upload to IPFS, AWS S3, or your server

# Update CONFIG urls
baseUrl: "https://your-cdn.com",
imageBasePath: "/cards",
```

### Update Metadata

After uploading images, regenerate metadata with correct URLs:

```javascript
// Update CONFIG
baseUrl: "https://your-actual-cdn.com",

// Re-run to update metadata only
// (or manually edit JSON files)
```

---

## 🎯 Best Practices

1. **Test First** - Process 5-10 images to verify quality
2. **Name Files** - Use descriptive filenames for better card names
3. **Optimize Images** - Resize to reasonable dimensions
4. **Batch Smart** - Process 50-100 at a time for review
5. **Backup** - Keep original images separate
6. **Review Output** - Check themes match images
7. **Customize** - Edit generated data as needed

---

## 🔄 Compared to Complete Pipeline

| Feature | Unified Generator | Complete Pipeline |
|---------|------------------|-------------------|
| **Input** | Your images | Prompts |
| **Speed** | ~10 sec/card | ~15 sec/card |
| **Daily Limit** | 1,500 cards | 100 cards |
| **Image Quality** | Depends on input | AI-generated |
| **Customization** | Full art control | Prompt-based |
| **Best For** | Custom artwork | Quick generation |
| **Cost** | Nearly free | Free (100/day) |

---

## 📖 Next Steps

- [COMPLETE_PIPELINE_GUIDE.md](COMPLETE_PIPELINE_GUIDE.md) - Generate images from scratch
- [HOW_IT_WORKS.md](HOW_IT_WORKS.md) - Technical deep dive
- [CONFIGURATION.md](CONFIGURATION.md) - All config options
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues

---

**Built for SURF Waves Collection** 🌊

Process 300 images in 50 minutes! 🎴✨
