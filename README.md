# 🎴 Unified Card Generator

Complete pipeline for generating trading card data from images: color extraction → AI flavor text → theme creation → card data → NFT metadata

## 🌟 Features

- **🎨 Automatic Theme Generation**: Extracts color palettes from images using node-vibrant
- **✍️ AI-Powered Flavor Text**: Uses Google Gemini API to generate unique, dramatic flavor text
- **🃏 Complete Card Data**: Creates full card objects matching your React component structure
- **📝 NFT Metadata**: Generates both 1/1 and common versions of metadata
- **⚡ Batch Processing**: Handles up to 300 images with rate limiting
- **🎯 Production Ready**: Outputs are immediately usable in your React app

## 📦 Installation

```bash
# Install dependencies
npm install node-vibrant @ai-sdk/google ai dotenv
```

## ⚙️ Setup

1. Create a `.env` file in your project root:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

2. Create an input directory for your images:

```bash
mkdir input_dir
```

3. Add your card images to `input_dir/`:
   - Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
   - Any size, but 1080x1080 recommended
   - Up to 300 images

## 🚀 Usage

```bash
node unifiedCardGenerator.mjs
```

The script will:
1. ✅ Scan `input_dir/` for images
2. 🎨 Extract color palette from each image
3. ✍️ Generate AI flavor text using Gemini
4. 🎭 Create custom theme based on colors
5. 🃏 Generate card data object
6. 📝 Create both 1/1 and common NFT metadata
7. 💾 Save all outputs to `generated-cards/`

## 📁 Output Structure

```
generated-cards/
├── generatedThemes.js      # Theme objects for import
├── generatedCardData.js    # Card data for import
├── flavorTexts.json        # Just the flavor text (for reference)
└── metadata/
    ├── cardname-1of1.json     # 1/1 NFT metadata
    └── cardname-common.json   # Common NFT metadata
```

## 🔧 Configuration

Edit the `CONFIG` object in `unifiedCardGenerator.mjs`:

```javascript
const CONFIG = {
  inputDir: "./input_dir",          // Where your images are
  outputDir: "./generated-cards",    // Where to save outputs
  baseUrl: "https://your-site.com",  // Your hosted URL
  geminiModel: "gemini-2.0-flash-exp", // Gemini model
  delayMs: 4000,                     // Rate limit (ms between API calls)
  maxImages: 300,                    // Maximum images to process
  defaultStats: {                    // Default card stats
    level: "1",
    attack: "3",
    defense: "3",
    hp: "5",
    manaCost: "2",
    terrain: "?",
  },
};
```

## 📝 Using Generated Files

### Import into your React app:

```javascript
// Import generated data
import { GENERATED_THEMES } from './generated-cards/generatedThemes.js';
import { GENERATED_CARDS } from './generated-cards/generatedCardData.js';

// Add to your existing cardData.js
export const CARD_THEMES = {
  ...existingThemes,
  ...GENERATED_THEMES,
};

export const CARDS = [
  ...existingCards,
  ...GENERATED_CARDS,
];
```

## 📊 Generated Data Structure

### Card Data Example:
```javascript
{
  id: "dragonwarrior",
  name: "Dragon Warrior",
  subtitle: "⟨Generated⟩",
  level: "1",
  theme: "dragonWarrior",
  manaCost: [
    {
      type: "hp",
      value: "5",
      color: "radial-gradient(circle, #dc143c, #8b0000)",
      textColor: "#ffffff",
    },
    {
      type: "mana",
      value: "2",
      color: "radial-gradient(circle, #4169e1, #0000cd)",
      textColor: "#ffffff",
    },
    {
      type: "terrain",
      value: "?",
      color: "radial-gradient(circle, #32cd32, #228b22)",
      textColor: "#ffffff",
    },
  ],
  image: "/images/card-images/dragon-warrior.png",
  type: "Creature — Generated",
  stats: {
    attack: "3",
    defense: "3",
  },
  flavorText: "In the shadows of ancient mountains, where fire meets steel, legends are forged.",
  artist: "SURF FINANCE STUDIOS",
  rarity: "1/1",
}
```

### Theme Example:
```javascript
dragonWarrior: {
  background: "radial-gradient(...)",
  header: {
    background: "linear-gradient(...)",
    color: "#ffffff",
    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)...",
    boxShadow: "0 min(0.5vw, 4px)...",
  },
  imageArea: { ... },
  typeSection: { ... },
  flavorText: { ... },
  bottomSection: { ... },
  stat: { ... },
  rarity: { ... },
}
```

## 🎨 Customizing Generated Cards

After generation, you can edit the output files:

1. **Edit Card Data** (`generatedCardData.js`):
   - Change names, subtitles, types
   - Adjust stats (level, attack, defense, HP, mana cost)
   - Modify flavor text
   - Update rarity

2. **Edit Themes** (`generatedThemes.js`):
   - Fine-tune colors
   - Adjust gradients
   - Modify shadows and effects

3. **Edit Metadata** (`metadata/*.json`):
   - Update descriptions
   - Modify attributes
   - Change trait values

## 🔥 Rate Limiting

The script respects Gemini API rate limits:
- **Free tier**: ~15 requests per minute
- **Default delay**: 4000ms (4 seconds) between calls
- **Recommendation**: Leave at 4000ms for safety

To process faster (if you have higher tier):
```javascript
delayMs: 2000,  // Faster but may hit rate limits
```

## 📋 Example Workflow

```bash
# 1. Setup
mkdir input_dir
cp your-card-images/*.png input_dir/

# 2. Create .env with your Gemini API key
echo "GOOGLE_GENERATIVE_AI_API_KEY=your_key" > .env

# 3. Run generator
node unifiedCardGenerator.mjs

# 4. Review outputs
cat generated-cards/generatedCardData.js
cat generated-cards/generatedThemes.js

# 5. Import into your app
# Add to your cardData.js or create new imports
```

## 🐛 Troubleshooting

### "API_KEY not found"
- Create `.env` file with `GOOGLE_GENERATIVE_AI_API_KEY=your_key`
- Get API key from https://aistudio.google.com/app/apikey

### "Could not load node-vibrant"
```bash
npm install node-vibrant
```

### "No image files found"
- Check that images are in `input_dir/`
- Verify file extensions: .jpg, .jpeg, .png, .gif, .webp

### "Rate limit exceeded"
- Increase `delayMs` in CONFIG to 5000 or 6000
- Reduce `maxImages` to process fewer at once

### Flavor text generation fails
- Some images may violate content policy
- Script continues with default flavor text
- You can manually edit afterward

## 💡 Tips

- **Image Quality**: Higher quality images → better color extraction → prettier themes
- **Batch Processing**: Process 20-50 images at a time to stay within rate limits
- **Customization**: Generated data is a starting point - tweak it to perfection!
- **Backup**: Keep original outputs before editing
- **Testing**: Test one image first before batch processing

## 🚀 Advanced Usage

### Process specific images only:
```javascript
// In main(), after reading files:
const imageFiles = files
  .filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
  .filter((f) => f.startsWith('special-'))  // Add custom filter
  .slice(0, CONFIG.maxImages);
```

### Custom flavor text prompts:
```javascript
// In generateFlavorText():
text: "Generate a humorous one-liner for this character, making it witty and unexpected.",
// or
text: "Create dark, ominous flavor text that hints at ancient power and cosmic horror.",
```

### Override default stats per card:
```javascript
// After generating cardData, before saving:
if (cardData.name.includes('Dragon')) {
  cardData.stats.attack = "7";
  cardData.stats.defense = "5";
  cardData.level = "5";
}
```

## 📄 License

Use freely in your SURF project! 🏄‍♂️

---

**Built for the SURF Waves Collection** 🌊

Questions? Issues? Check the console output for detailed logs!
