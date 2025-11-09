# 🎴 SURF Card Generators - Complete Package

## Two Powerful Generators, One Goal: Perfect Trading Cards

### 🎯 Quick Decision Tree

**Do you already have card images?**
- ✅ YES → Use `unifiedCardGenerator.mjs` (faster, higher limits)
- ❌ NO → Use `completeCardPipeline.mjs` (generates images too)

**Want both?** Use both! They work great together.

---

## 📦 What's Included

### Generator #1: Unified Card Generator
**File:** `unifiedCardGenerator.mjs`

**Best for:** Processing existing images

**Input:** Your card images (PNG, JPG, etc.)

**Output:**
- Color-matched themes
- AI-generated flavor text
- Card data objects
- NFT metadata

**Speed:** ~10 seconds per card  
**Daily Limit:** 1,500 cards  
**Documentation:** `README.md`, `QUICKSTART.md`

---

### Generator #2: Complete Card Pipeline ⭐ NEW!
**File:** `completeCardPipeline.mjs`

**Best for:** Generating everything from scratch

**Input:** Nothing! (or custom prompts)

**Output:**
- **AI-generated images** (Imagen)
- Color-matched themes
- AI-generated flavor text
- Card data objects
- NFT metadata

**Speed:** ~15 seconds per card  
**Daily Limit:** 100 cards  
**Documentation:** `COMPLETE_PIPELINE_DOCS.md`

---

## 🚀 Quick Start

### Option A: Process Existing Images

```bash
# 1. Install
npm install

# 2. Setup
cp env.example .env
# Add your Gemini API key to .env

# 3. Add images
mkdir input_dir
# Copy your images here

# 4. Generate!
npm run generate
```

### Option B: Generate Everything

```bash
# 1. Install (includes Imagen)
npm install @google/genai @ai-sdk/google ai node-vibrant dotenv

# 2. Setup
cp env.example .env
# Add your Google AI Studio key to .env

# 3. Configure (edit completeCardPipeline.mjs)
numberOfCards: 10,  # How many to generate
promptMode: "dnd-monsters",  # or "custom"

# 4. Generate!
npm run generate-complete
```

---

## 📊 Feature Comparison

| Feature | Unified Generator | Complete Pipeline |
|---------|------------------|-------------------|
| Process existing images | ✅ | ❌ |
| Generate new images | ❌ | ✅ |
| Extract colors | ✅ | ✅ |
| AI flavor text | ✅ | ✅ |
| Create themes | ✅ | ✅ |
| Create card data | ✅ | ✅ |
| Export metadata | ✅ | ✅ |
| **Time per card** | ~10 sec | ~15 sec |
| **Daily limit** | 1,500 | 100 |
| **Best for** | Existing art | From scratch |

---

## 💡 Common Workflows

### Workflow 1: Pure AI Collection
```bash
# Generate 100 AI cards
npm run generate-complete
# Done! Everything created from scratch
```

### Workflow 2: Process Your Art
```bash
# Add your 300 images to input_dir/
npm run generate
# Done! Themes and data created
```

### Workflow 3: Hybrid Collection
```bash
# Day 1: Generate 80 AI cards
numberOfCards: 80
npm run generate-complete

# Day 2: Process 20 custom images
# Add custom images to input_dir/
npm run generate

# Result: 100 cards with consistent themes
```

### Workflow 4: Rapid Prototyping
```bash
# Test with 5 cards
numberOfCards: 5
npm run generate-complete
# Review in 1-2 minutes

# Scale up if you like results
numberOfCards: 100
npm run generate-complete
```

---

## 📖 Documentation Guide

**Start here:**
1. **[WHICH_GENERATOR.md](WHICH_GENERATOR.md)** ← Detailed comparison

**Then read:**

**For Unified Generator:**
- **[QUICKSTART.md](QUICKSTART.md)** - 5-minute setup
- **[README.md](README.md)** - Full documentation
- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Big picture

**For Complete Pipeline:**
- **[COMPLETE_PIPELINE_DOCS.md](COMPLETE_PIPELINE_DOCS.md)** - Everything you need

**For both:**
- **[START_HERE.md](START_HERE.md)** - Quick start guide
- **[EXAMPLE_OUTPUT.js](EXAMPLE_OUTPUT.js)** - Sample output

---

## 🎨 Output Format

Both generators produce **identical structure**:

```javascript
// Card Data
{
  id: "dragonwarrior",
  name: "Dragon Warrior",
  subtitle: "⟨Generated⟩",
  level: "1",
  theme: "dragonWarrior",
  manaCost: [
    { type: "hp", value: "5", color: "radial-gradient(...)" },
    { type: "mana", value: "2", color: "radial-gradient(...)" },
    { type: "terrain", value: "?", color: "radial-gradient(...)" },
  ],
  image: "/images/card-images/dragon-warrior.png",
  type: "Creature — Generated",
  stats: { attack: "3", defense: "3" },
  flavorText: "Epic AI-generated text...",
  artist: "SURF FINANCE STUDIOS",
  rarity: "1/1",
}

// Theme
dragonWarrior: {
  background: "radial-gradient(...)",
  header: { ... },
  imageArea: { ... },
  // ... complete theme
}
```

**Import into your React app:**
```javascript
import { GENERATED_THEMES } from './generated-cards/generatedThemes.js';
import { GENERATED_CARDS } from './generated-cards/generatedCardData.js';
```

---

## 💰 Cost & Limits

### Both Generators Are FREE!

**Unified Generator:**
- Uses: Gemini only
- Limit: 1,500 cards/day
- Cost: $0

**Complete Pipeline:**
- Uses: Imagen + Gemini
- Limit: 100 cards/day (Imagen limit)
- Cost: $0

**Want more?** Wait 24 hours for reset or upgrade to paid tier.

---

## 🔧 Configuration

### Unified Generator
```javascript
const CONFIG = {
  inputDir: "./input_dir",
  outputDir: "./generated-cards",
  delayMs: 4000,  // Rate limiting
  maxImages: 300,
};
```

### Complete Pipeline
```javascript
const CONFIG = {
  numberOfCards: 10,
  imageAspectRatio: "1:1",
  promptMode: "dnd-monsters",  // or "custom"
  customPrompts: [
    "A mystical dragon warrior...",
    "A cyberpunk hacker...",
  ],
};
```

---

## 🎯 Which One Should I Use?

### Use Unified Generator If:
- ✅ You have existing images
- ✅ You want to process 300+ cards
- ✅ You want faster processing
- ✅ You have art from artists/other AI tools

### Use Complete Pipeline If:
- ✅ You need images generated
- ✅ You want 100% AI-generated collection
- ✅ You want D&D monsters as card art
- ✅ You want custom prompt-based generation

### Use Both If:
- ✅ You want mixed collection
- ✅ Generate base set, add custom art later
- ✅ Maximum flexibility

---

## 📦 Installation

### For Unified Generator:
```bash
npm install @ai-sdk/google ai node-vibrant dotenv
```

### For Complete Pipeline:
```bash
npm install @google/genai @ai-sdk/google ai node-vibrant dotenv
```

### For Both:
```bash
npm install @google/genai @ai-sdk/google ai node-vibrant dotenv
```

---

## 🔑 API Key Setup

**Both use the same API key!**

1. Get key: https://aistudio.google.com/app/apikey
2. Create `.env`:
   ```
   API_KEY=your_key_here
   ```
3. Done!

---

## 📈 Performance

**Processing 100 cards:**

| Generator | Time | Image Gen |
|-----------|------|-----------|
| Unified | ~16 min | No |
| Complete | ~25 min | Yes |

**The difference?** Image generation adds ~5-9 seconds per card.

---

## 🎓 Examples

### Example 1: Test Both
```bash
# Test unified (if you have 5 test images)
npm run test-colors  # Verify setup
npm run generate

# Test complete
npm run generate-complete
```

### Example 2: 300-Card Collection
```bash
# Week 1: Generate 100 AI cards
npm run generate-complete

# Week 2: Generate 100 more
npm run generate-complete

# Week 3: Generate final 100
npm run generate-complete

# Result: 300 complete cards
```

### Example 3: Pro Collection
```bash
# Commission 50 hero cards ($2,500)
# Generate 250 common cards (free)
npm run generate-complete

# Process all 300 together
cp commissioned-art/*.png input_dir/
cp complete-cards/generated-images/*.png input_dir/
npm run generate

# Result: Consistent theming across all cards
```

---

## 🐛 Troubleshooting

### Both Generators

**"API_KEY not found"**
- Create `.env` with your API key

**"Could not load node-vibrant"**
```bash
npm install node-vibrant
```

### Complete Pipeline Only

**"Image generation failed"**
- May be content policy violation
- Try different prompts
- Script continues with other cards

**"Rate limit exceeded"**
- Free tier: 100 images/day
- Wait 24 hours for reset

---

## 🌟 Why This is Amazing

**Generate a 100-card collection:**

**Old way:**
- Commission art: $5,000-$50,000
- Write flavor text: 50 hours
- Create themes: 20 hours
- Build card data: 10 hours
- Total: Weeks of work, thousands of dollars

**New way:**
```bash
npm run generate-complete
```
- Time: 25 minutes
- Cost: $0
- Quality: Professional

---

## 📄 Files Included

- `completeCardPipeline.mjs` - Full pipeline with image gen
- `unifiedCardGenerator.mjs` - Process existing images
- `testColorExtraction.mjs` - Test without API
- `package.json` - Dependencies (unified)
- `package-complete.json` - Dependencies (complete)
- `setup.sh` / `setup.bat` - Setup scripts
- Complete documentation set

---

## 🚀 Get Started Now

1. **Download all files**
2. **Read [WHICH_GENERATOR.md](WHICH_GENERATOR.md)**
3. **Pick your generator**
4. **Follow the quickstart for your choice**
5. **Generate cards!**

---

## 💪 You're Ready

Everything you need is here:
- ✅ Two powerful generators
- ✅ Complete documentation
- ✅ Example outputs
- ✅ Setup scripts

**Pick one. Follow the guide. Generate 100 cards tonight!** 🎴✨

---

**Built for the SURF Waves Collection** 🌊

Questions? Check the docs!  
Ready? Run the generators!  
Having fun? Generate 300 cards! 🔥
