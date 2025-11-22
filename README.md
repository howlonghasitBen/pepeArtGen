# 🎴 SURF Card Generator Suite

**Professional trading card generation with AI-powered artwork, flavor text, and NFT metadata.**

## 🎯 Two Powerful Generators

### 1. Complete Card Pipeline
**File:** `completeCardPipeline.mjs`

Generates **everything** from scratch:
- ✅ AI-generated images (Google Imagen)
- ✅ Signature moves based on visual analysis
- ✅ Contextual flavor text
- ✅ Color-matched themes
- ✅ Card data objects
- ✅ NFT metadata (1/1 + common)

**Best for:** Creating new cards from prompts or D&D monsters

**Daily limit:** 100 cards (Imagen free tier)

**Time:** ~15 seconds per card

---

### 2. Unified Card Generator
**File:** `unifiedCardGenerator.mjs`

Processes **your existing images**:
- ✅ AI-powered signature moves
- ✅ Image-based flavor text
- ✅ Color-matched themes
- ✅ Card data objects
- ✅ NFT metadata (1/1 + common)

**Best for:** Cards with custom artwork or commissioned art

**Daily limit:** 1,500 cards (Gemini free tier)

**Time:** ~10 seconds per card

---

## 🚀 Quick Start

### Installation

```bash
# Clone or download this repository
npm install
```

**Dependencies installed:**
- `@google/genai` - Google Imagen API
- `@ai-sdk/google` - Gemini API
- `ai` - Vercel AI SDK
- `node-vibrant` - Color extraction
- `dotenv` - Environment management

### Setup

1. **Get API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)

2. **Create `.env` file:**
   ```bash
   # For Complete Pipeline (generates images)
   API_KEY=your_google_ai_studio_key
   
   # For Unified Generator (existing images)
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_studio_key
   ```

3. **Choose your workflow:**

**Option A: Generate from scratch**
```bash
node completeCardPipeline.mjs
```

**Option B: Process existing images**
```bash
mkdir input_dir
# Add your images to input_dir/
node unifiedCardGenerator.mjs
```

---

## 📖 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get running in 5 minutes
- **[COMPLETE_PIPELINE_GUIDE.md](COMPLETE_PIPELINE_GUIDE.md)** - Full image generation guide
- **[UNIFIED_GENERATOR_GUIDE.md](UNIFIED_GENERATOR_GUIDE.md)** - Process existing images
- **[HOW_IT_WORKS.md](HOW_IT_WORKS.md)** - Technical deep dive
- **[CONFIGURATION.md](CONFIGURATION.md)** - Customization options
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues

---

## 🎨 How It Works

### The Unified System

Both generators use the same intelligent approach:

1. **Image Analysis** - AI examines the visual characteristics
2. **Move Generation** - Creates a signature ability based on what it sees
3. **Flavor Text** - Writes atmospheric text that references the move
4. **Theme Creation** - Extracts colors and builds cohesive themes
5. **Data Export** - Generates React-ready card data and NFT metadata

### Example Output

**Move:** "Shadow Consumption"

**Flavor Text:** "Where its presence lingers, light itself forgets how to exist. Those who witness the collapse speak only in whispers, if they speak at all."

**Result:** Cohesive, professional-quality cards with personality!

---

## 📁 Output Structure

```
generated-cards/
├── generated-images/           # AI-generated images (Complete Pipeline only)
│   ├── dragon.png
│   ├── wizard.png
│   └── ...
├── generatedThemes.js          # Import into React app
├── generatedCardData.js        # Import into React app
├── flavorTexts.json           # Reference
├── signatureMoves.json        # Reference
└── metadata/                   # NFT metadata
    ├── dragon-1of1.json
    ├── dragon-common.json
    └── ...
```

---

## 💡 Use Cases

### Scenario 1: Rapid Prototyping
```bash
# Test card concepts in minutes
node completeCardPipeline.mjs
# Edit CONFIG.numberOfCards = 5
```

### Scenario 2: Professional Collection
```bash
# Commission 50 hero cards from artists ($$$)
# Generate 250 common cards (FREE)
node completeCardPipeline.mjs

# Process all together for consistent theming
cp commissioned/*.png input_dir/
node unifiedCardGenerator.mjs
```

### Scenario 3: D&D Campaign
```bash
# Generate monster cards from D&D API
# Automatic lore-appropriate flavor text
node completeCardPipeline.mjs
```

### Scenario 4: Custom Artwork
```bash
# You create the art
# AI creates moves, flavor, and themes
mkdir input_dir
# Add your artwork
node unifiedCardGenerator.mjs
```

---

## 🎯 Key Features

### Intelligent Move Generation
- Analyzes actual image content
- Creates thematic signature abilities
- 2-5 word evocative names
- Examples: "Void Collapse", "Tidal Devastation", "Fracture Reality"

### Contextual Flavor Text
- References the signature move
- Atmospheric and emotional
- Professional TCG quality
- Never generic or templated

### Color-Matched Themes
- Extracts palette from images
- Generates React CSS themes
- Automatic gradient creation
- Consistent visual identity

### NFT-Ready Metadata
- OpenSea compatible
- Animation URLs for interactive cards
- Comprehensive trait attributes
- Both 1/1 and common variants

---

## 📊 Comparison

| Feature | Complete Pipeline | Unified Generator |
|---------|------------------|-------------------|
| **Input** | Prompts/D&D API | Your images |
| **Generates Images** | ✅ Yes | ❌ No |
| **Analyzes Images** | ✅ Yes | ✅ Yes |
| **Move Generation** | ✅ Yes | ✅ Yes |
| **Flavor Text** | ✅ Yes | ✅ Yes |
| **Color Themes** | ✅ Yes | ✅ Yes |
| **NFT Metadata** | ✅ Yes | ✅ Yes |
| **Daily Limit** | 100 cards | 1,500 cards |
| **Time/Card** | ~15 sec | ~10 sec |
| **Best For** | New collections | Custom art |

---

## 💰 Cost

**Both generators are FREE!**

- **Complete Pipeline:** 100 images/day (Imagen limit)
- **Unified Generator:** 1,500 requests/day (Gemini limit)
- **Upgrades available** for higher limits

---

## 🔧 Configuration

Both generators share similar configuration:

```javascript
const CONFIG = {
  // Image generation (Complete Pipeline only)
  numberOfCards: 10,
  imageAspectRatio: "16:9",  // or "1:1", "9:16", etc.
  promptMode: "dnd-monsters", // or "custom"
  
  // Card defaults (both generators)
  defaultStats: {
    level: "1",
    attack: "3",
    defense: "3",
    hp: "5",
    manaCost: "2",
    terrain: "?",
  },
  
  // Output settings (both generators)
  baseUrl: "https://your-site.com",
  imageBasePath: "/images/card-images",
  artist: "YOUR NAME",
  collection: "YOUR COLLECTION",
};
```

See [CONFIGURATION.md](CONFIGURATION.md) for full details.

---

## 🎓 Examples

### Generate 10 Test Cards
```bash
# Edit completeCardPipeline.mjs
numberOfCards: 10

# Run
node completeCardPipeline.mjs

# Review output in 3-4 minutes
```

### Process Your Artwork
```bash
# Add 20 images to input_dir/
node unifiedCardGenerator.mjs

# Review output in 3-4 minutes
```

### Mixed Collection
```bash
# Day 1: Generate 80 AI cards
node completeCardPipeline.mjs

# Day 2: Process 20 custom images
node unifiedCardGenerator.mjs

# Result: 100 card collection with variety
```

---

## 📦 Integration

### Import into React

```javascript
// src/data/cardData.js
import { GENERATED_THEMES } from '../../generated-cards/generatedThemes.js';
import { GENERATED_CARDS } from '../../generated-cards/generatedCardData.js';

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
};
```

### Deploy NFTs

1. Upload images to IPFS or hosting
2. Update `baseUrl` in CONFIG
3. Use metadata files from `generated-cards/metadata/`
4. Deploy to your NFT platform

---

## 🐛 Troubleshooting

**Issue:** "API_KEY not found"
- **Fix:** Create `.env` with your Google AI Studio key

**Issue:** "No images found" (Unified Generator)
- **Fix:** Add images to `input_dir/` folder

**Issue:** "Rate limit exceeded"
- **Fix:** Wait 24 hours or upgrade to paid tier

**Issue:** Image generation fails
- **Fix:** May be content policy violation, try different prompts

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for complete guide.

---

## 🌟 Why This System?

### Before
- Commission art: $50-500 per card
- Write flavor text: 30 min per card
- Design themes: Hours of trial and error
- Create metadata: Manual process
- **Total:** Days of work, thousands of dollars

### After
```bash
node completeCardPipeline.mjs
```
- **Total:** 25 minutes, $0
- Professional quality
- Consistent theming
- NFT-ready metadata

---

## 📄 License

GNU General Public License v3.0

See [LICENSE](LICENSE) for details.

---

## 🚀 Get Started

1. **Read:** [QUICKSTART.md](QUICKSTART.md) (5 minutes)
2. **Choose:** Complete Pipeline or Unified Generator
3. **Run:** Generate your first cards
4. **Deploy:** Import to React and publish!

---

**Built for the SURF Waves Collection** 🌊

Generate professional trading cards in minutes! 🎴✨
