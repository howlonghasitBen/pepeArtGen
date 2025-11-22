# 🎴 START HERE - SURF Card Generator

**Complete documentation overhaul - November 2024**

---

## ✨ What's New

Your card generator has been completely re-documented to reflect the **current unified analysis system**:

- ✅ **Intelligent Move Generation** - AI analyzes images and creates thematic signature moves
- ✅ **Contextual Flavor Text** - Text that references and describes the move
- ✅ **Unified Format** - `[MOVE]\n[FLAVOR]` in flavor text area
- ✅ **No More Random Styles** - Every card gets custom content based on its image

---

## 🚀 Quick Start (2 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Get API Key
Visit https://aistudio.google.com/app/apikey and create a key

### 3. Create `.env` File
```bash
# For Complete Pipeline (generates images)
API_KEY=your_key_here

# For Unified Generator (existing images)  
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

### 4. Choose Your Path

**Generate from scratch:**
```bash
node completeCardPipeline.mjs
```

**Process existing images:**
```bash
mkdir input_dir
# Add your images
node unifiedCardGenerator.mjs
```

---

## 📚 Documentation Suite

### Essential Reading

1. **[README.md](README.md)** - Overview and features _(5 min)_
2. **[QUICKSTART.md](QUICKSTART.md)** - Hands-on tutorial _(5 min)_

### Detailed Guides

3. **[COMPLETE_PIPELINE_GUIDE.md](COMPLETE_PIPELINE_GUIDE.md)** - Generate from scratch _(15 min)_
4. **[UNIFIED_GENERATOR_GUIDE.md](UNIFIED_GENERATOR_GUIDE.md)** - Process images _(15 min)_
5. **[HOW_IT_WORKS.md](HOW_IT_WORKS.md)** - Technical deep dive _(30 min)_

### Reference Materials

6. **[CONFIGURATION.md](CONFIGURATION.md)** - All settings explained _(reference)_
7. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Fix problems _(reference)_
8. **[DOCUMENTATION_GUIDE.md](DOCUMENTATION_GUIDE.md)** - Navigate docs _(5 min)_

---

## 🎯 Reading Path

**Complete Beginner:**
1. README.md → 2. QUICKSTART.md → **Generate!**

**Using Complete Pipeline:**
1. README.md → 2. QUICKSTART.md → 3. COMPLETE_PIPELINE_GUIDE.md

**Using Unified Generator:**
1. README.md → 2. QUICKSTART.md → 4. UNIFIED_GENERATOR_GUIDE.md

**Want to Understand Everything:**
Read all docs in order (about 90 minutes total)

---

## 💡 What Changed

### Old System (Removed)
- ❌ 51 random flavor text styles
- ❌ Generic template-based text
- ❌ No connection to image content
- ❌ Move in subtitle field

### New System (Current)
- ✅ Image analysis-based generation
- ✅ Contextual, specific content
- ✅ Move + Flavor work together
- ✅ Move in flavor text: `[MOVE]\n[FLAVOR]`

---

## 📊 Features at a Glance

### Complete Card Pipeline
- Generates images from prompts (D&D monsters or custom)
- 100 cards/day free (Imagen limit)
- ~15 seconds per card
- Perfect for rapid prototyping

### Unified Card Generator
- Processes your existing artwork
- 1,500 cards/day free (Gemini limit)
- ~10 seconds per card
- Perfect for custom collections

### Both Include
- ✅ AI-powered signature moves
- ✅ Contextual flavor text
- ✅ Color-matched React themes
- ✅ NFT metadata (1/1 + common)
- ✅ React-ready data exports

---

## 🎓 Example Output

### Input
**Image:** Dark shadowy creature with glowing eyes

### Output
**Move:** "Shadow Consumption"

**Flavor Text:**
```
Shadow Consumption
Where its presence lingers, light itself forgets how to exist. 
Those who witness the collapse speak only in whispers, if they speak at all.
```

**Theme:** Dark purple gradients with luminous highlights

**Card Data:** React-ready object with all stats and styling

**Metadata:** NFT-compatible JSON files

---

## 🔧 Common Tasks

### Generate 10 Test Cards
```bash
# Edit completeCardPipeline.mjs
# Change: numberOfCards: 10
node completeCardPipeline.mjs
```

### Process Your Artwork
```bash
mkdir input_dir
cp your-images/*.png input_dir/
node unifiedCardGenerator.mjs
```

### Change Default Stats
```javascript
// In CONFIG
defaultStats: {
  level: "3",
  attack: "5",
  defense: "4",
  hp: "8",
  manaCost: "3",
  terrain: "⛰️",
}
```

### Fix Rate Limits
```javascript
// In CONFIG  
delayBetweenImages: 8000,     // Increase
delayBetweenFlavorText: 6000, // Increase
```

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| API_KEY not found | Create `.env` with your key |
| No images found | Add images to `input_dir/` |
| Rate limit | Wait 24 hours or increase delays |
| Permission denied | Check file permissions |
| Out of memory | Process smaller batches |

**Full solutions:** See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 📦 What You Get

After running the generator:

```
generated-cards/  (or complete-cards/)
├── generatedThemes.js      # Import into React
├── generatedCardData.js    # Import into React  
├── flavorTexts.json        # Reference
├── signatureMoves.json     # Reference
└── metadata/               # NFT files
    ├── card-1of1.json
    ├── card-common.json
    └── ...
```

---

## 🚢 React Integration

```javascript
// src/data/cardData.js
import { GENERATED_THEMES } from '../../generated-cards/generatedThemes.js';
import { GENERATED_CARDS } from '../../generated-cards/generatedCardData.js';

export const CARD_THEMES = {
  ...yourExistingThemes,
  ...GENERATED_THEMES,
};

export const CARDS = [
  ...yourExistingCards,
  ...GENERATED_CARDS,
];
```

---

## 🎯 Next Steps

1. **Read [README.md](README.md)** - Understand the system _(5 min)_
2. **Follow [QUICKSTART.md](QUICKSTART.md)** - Generate first cards _(5 min)_
3. **Read relevant guide** - Master your chosen generator _(15 min)_
4. **Generate cards!** - Start creating your collection
5. **Customize** - Tweak settings and outputs as needed

---

## 💬 Documentation Notes

This documentation is:
- ✅ **Complete** - Covers every feature and option
- ✅ **Current** - Reflects actual code behavior  
- ✅ **Practical** - Examples and real-world usage
- ✅ **Organized** - Easy to navigate and reference

**Total reading time:** ~90 minutes for everything

**Time to first cards:** ~10 minutes

---

## 🌟 Remember

- Both generators use the **same intelligent system** for moves and flavor text
- The only difference is **image source** (generated vs existing)
- Everything is **free** within daily limits (100-1500 cards/day)
- Results are **professional quality** and **NFT-ready**

---

**Built for SURF Waves Collection** 🌊

Start reading, start generating! 🎴✨

---

## 📝 Files Overview

| File | Purpose | Size | Read Time |
|------|---------|------|-----------|
| README.md | Overview | 9KB | 5 min |
| QUICKSTART.md | Tutorial | 7KB | 5 min |
| COMPLETE_PIPELINE_GUIDE.md | Generate images | 13KB | 15 min |
| UNIFIED_GENERATOR_GUIDE.md | Process images | 14KB | 15 min |
| HOW_IT_WORKS.md | Architecture | 17KB | 30 min |
| CONFIGURATION.md | All settings | 14KB | 10 min |
| TROUBLESHOOTING.md | Fix problems | 14KB | 5 min |
| DOCUMENTATION_GUIDE.md | Navigate | 8KB | 5 min |

**Total:** 96KB of comprehensive documentation

---

**Questions?** Read the relevant doc above.

**Problems?** Check TROUBLESHOOTING.md.

**Ready?** Start with README.md!
