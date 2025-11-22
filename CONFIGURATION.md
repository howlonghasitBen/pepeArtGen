# ⚙️ Configuration Guide

**Complete reference for all configuration options.**

---

## CONFIG Object

Both scripts use a `CONFIG` object at the top of the file:

```javascript
const CONFIG = {
  // ... configuration options
};
```

---

## Complete Pipeline Configuration

### Full CONFIG Object

```javascript
const CONFIG = {
  // === OUTPUT DIRECTORIES ===
  outputDir: "./complete-cards",
  imageOutputDir: "./complete-cards/generated-images",
  
  // === AI MODELS ===
  imagenModel: "imagen-4.0-generate-001",
  geminiModel: "gemini-2.5-flash-lite",
  
  // === GENERATION SETTINGS ===
  numberOfCards: 70,
  imageAspectRatio: "16:9",
  
  // === RATE LIMITING ===
  delayBetweenImages: 5000,         // milliseconds
  delayBetweenFlavorText: 4000,     // milliseconds
  
  // === DEPLOYMENT URLS ===
  baseUrl: "https://howlonghasitben.github.io/surf-works",
  externalUrl: "https://howlonghasitben.github.io/surf-works",
  imageBasePath: "/images/card-images",
  
  // === METADATA ===
  artist: "SURF FINANCE STUDIOS",
  collection: "Waves Collection",
  
  // === CARD DEFAULTS ===
  defaultStats: {
    level: "1",
    attack: "3",
    defense: "3",
    hp: "5",
    manaCost: "2",
    terrain: "?",
  },
  
  // === PROMPT CONFIGURATION ===
  promptMode: "dnd-monsters",
  customPrompts: [],
  
  // === IMAGE PROMPT TEMPLATE ===
  imagePromptTemplate: (monsterName) =>
    `A high-resolution, detailed, digital art illustration of a ${monsterName} monster in the distinct visual style of "Pepe the Frog". Complete Background.`,
};
```

---

## Unified Generator Configuration

### Full CONFIG Object

```javascript
const CONFIG = {
  // === INPUT/OUTPUT DIRECTORIES ===
  inputDir: "./input_dir",
  outputDir: "./generated-cards",
  
  // === AI MODEL ===
  geminiModel: "gemini-2.0-flash-exp",
  
  // === RATE LIMITING ===
  delayMs: 4000,                    // milliseconds
  maxImages: 300,
  
  // === DEPLOYMENT URLS ===
  baseUrl: "https://howlonghasitben.github.io/surf-works",
  externalUrl: "https://howlonghasitben.github.io/surf-works",
  imageBasePath: "/images/card-images",
  
  // === METADATA ===
  artist: "SURF FINANCE STUDIOS",
  collection: "Waves Collection",
  
  // === CARD DEFAULTS ===
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

## Option Reference

### Output Directories

**Complete Pipeline:**

```javascript
outputDir: "./complete-cards"
```
- Where all generated files are saved
- Created if doesn't exist
- Relative to script location

```javascript
imageOutputDir: "./complete-cards/generated-images"
```
- Where AI-generated images are saved
- Subdirectory of outputDir
- Must be absolute or relative path

**Unified Generator:**

```javascript
inputDir: "./input_dir"
```
- Where your input images are located
- Must exist before running
- Scanned for valid image files

```javascript
outputDir: "./generated-cards"
```
- Where all generated files are saved
- Created if doesn't exist

---

### AI Models

**Complete Pipeline:**

```javascript
imagenModel: "imagen-4.0-generate-001"
```
- Google Imagen model version
- Currently only one option available
- May have newer versions in future

```javascript
geminiModel: "gemini-2.5-flash-lite"
```
- Google Gemini model for text generation
- Options:
  - `"gemini-2.5-flash-lite"` - Fastest, cheapest
  - `"gemini-2.0-flash-exp"` - Experimental features
  - `"gemini-1.5-pro"` - Higher quality (more expensive)

**Unified Generator:**

```javascript
geminiModel: "gemini-2.0-flash-exp"
```
- Same options as Complete Pipeline
- Only used for flavor text, not images

**Recommendation:** Stick with flash models for cost efficiency.

---

### Generation Settings

**Complete Pipeline Only:**

```javascript
numberOfCards: 70
```
- How many cards to generate
- Limits:
  - Free tier: 100 per day (Imagen limit)
  - Practical: 10-300 per run
- Examples:
  - Testing: `5`
  - Small batch: `20`
  - Full run: `100`

```javascript
imageAspectRatio: "16:9"
```
- Image dimensions ratio
- Options:
  - `"1:1"` - Square (1024x1024)
  - `"16:9"` - Landscape (1536x864)
  - `"9:16"` - Portrait (864x1536)
  - `"4:3"` - Classic landscape (1152x864)
  - `"3:4"` - Classic portrait (864x1152)
- Use cases:
  - Square: Traditional card design
  - Landscape: Wide banner cards
  - Portrait: Tall character cards

---

### Rate Limiting

**Complete Pipeline:**

```javascript
delayBetweenImages: 5000
```
- Milliseconds to wait between image API calls
- Recommended: 5000-10000 (5-10 seconds)
- Lower: Faster but may hit rate limits
- Higher: Safer but slower

```javascript
delayBetweenFlavorText: 4000
```
- Milliseconds to wait between Gemini API calls
- Recommended: 4000-6000 (4-6 seconds)
- Separate from image delay
- Can be adjusted independently

**Unified Generator:**

```javascript
delayMs: 4000
```
- Milliseconds to wait between API calls
- Recommended: 4000-5000 (4-5 seconds)
- Only applies to Gemini calls
- No image generation delay needed

```javascript
maxImages: 300
```
- Maximum number of images to process
- Safety limit to prevent accidents
- Can process fewer if directory has less
- Increase for larger batches

**When to Adjust:**

| Issue | Solution |
|-------|----------|
| Rate limit errors | Increase delay |
| Too slow | Decrease delay slightly |
| Want to test fast | Lower both (risk limits) |
| Production run | Keep recommended values |

---

### Deployment URLs

```javascript
baseUrl: "https://your-site.com"
```
- Your website/hosting URL
- Used in NFT metadata for image URLs
- Must be publicly accessible
- Examples:
  - GitHub Pages: `"https://username.github.io/repo"`
  - Custom domain: `"https://mycards.com"`
  - IPFS: `"ipfs://QmHash"`

```javascript
externalUrl: "https://your-site.com"
```
- Link shown on NFT marketplaces
- Usually same as baseUrl
- Can be different (e.g., main site vs CDN)

```javascript
imageBasePath: "/images/card-images"
```
- Path appended to baseUrl for images
- Final URL: `baseUrl + imageBasePath + filename`
- Examples:
  - Standard: `"/images/card-images"`
  - Nested: `"/assets/cards/images"`
  - Flat: `"/cards"`

**Example URLs Created:**

```javascript
baseUrl: "https://mysite.com"
imageBasePath: "/images/cards"
// Results in: https://mysite.com/images/cards/dragon.png
```

---

### Metadata

```javascript
artist: "SURF FINANCE STUDIOS"
```
- Your name or studio name
- Shown in card data and NFT metadata
- Appears as trait in marketplaces
- Can be anything:
  - Personal name: `"John Smith"`
  - Studio: `"Fantasy Art Studios"`
  - Brand: `"SURF FINANCE STUDIOS"`

```javascript
collection: "Waves Collection"
```
- Your collection name
- Shown in NFT metadata
- Groups cards together
- Examples:
  - `"Genesis Collection"`
  - `"Dragons Series"`
  - `"Season 1"`

---

### Card Defaults

**All stats are strings (not numbers)** to support special characters.

```javascript
defaultStats: {
  level: "1",
  attack: "3",
  defense: "3",
  hp: "5",
  manaCost: "2",
  terrain: "?",
}
```

**Customization Examples:**

**Balanced:**
```javascript
defaultStats: {
  level: "1",
  attack: "3",
  defense: "3",
  hp: "5",
  manaCost: "2",
  terrain: "?",
}
```

**High-powered:**
```javascript
defaultStats: {
  level: "5",
  attack: "7",
  defense: "6",
  hp: "10",
  manaCost: "4",
  terrain: "⛰️",
}
```

**Weak commons:**
```javascript
defaultStats: {
  level: "1",
  attack: "1",
  defense: "1",
  hp: "2",
  manaCost: "1",
  terrain: "?",
}
```

**Special characters:**
```javascript
defaultStats: {
  level: "∞",     // Infinity
  attack: "X",    // Variable
  defense: "?",   // Unknown
  hp: "★",        // Star
  manaCost: "0",  // Free
  terrain: "🌊",  // Emoji
}
```

---

### Prompt Configuration

**Complete Pipeline Only:**

```javascript
promptMode: "dnd-monsters"
```
- Determines how images are prompted
- Options:
  - `"dnd-monsters"` - Fetch from D&D API
  - `"custom"` - Use customPrompts array

**D&D Monsters Mode:**
```javascript
promptMode: "dnd-monsters"
// Automatically fetches:
// - Aboleth
// - Ancient Red Dragon
// - Beholder
// etc.
```

**Custom Mode:**
```javascript
promptMode: "custom",
customPrompts: [
  "A mystical dragon warrior in epic fantasy art style",
  "A cyberpunk hacker with neon aesthetics",
  "An ancient forest guardian made of living wood",
]
```

**Custom Prompts Tips:**

✅ **Good prompts:**
- "A fire elemental with swirling flames, digital art style"
- "A cyberpunk samurai with neon katana, cinematic lighting"
- "An ancient tree spirit with glowing eyes, fantasy illustration"

❌ **Bad prompts:**
- "dragon" (too vague)
- "A red and blue character with sword standing on mountain during sunset with clouds..." (too detailed)
- "Make me a cool card" (not descriptive)

---

### Image Prompt Template

**Complete Pipeline Only:**

```javascript
imagePromptTemplate: (monsterName) =>
  `A high-resolution, detailed, digital art illustration of a ${monsterName}...`
```

This function transforms the input into the actual Imagen prompt.

**Default Template:**
```javascript
imagePromptTemplate: (monsterName) =>
  `A high-resolution, detailed, digital art illustration of a ${monsterName} monster in the distinct visual style of "Pepe the Frog". Complete Background.`
```

**Custom Templates:**

**Realistic:**
```javascript
imagePromptTemplate: (name) =>
  `A photorealistic illustration of a ${name}, 8K quality, dramatic lighting, trending on ArtStation`
```

**Anime:**
```javascript
imagePromptTemplate: (name) =>
  `An anime-style illustration of a ${name}, vibrant colors, dynamic pose, studio quality`
```

**Oil Painting:**
```javascript
imagePromptTemplate: (name) =>
  `A classical oil painting of a ${name}, dramatic chiaroscuro lighting, Renaissance style`
```

**Dark Fantasy:**
```javascript
imagePromptTemplate: (name) =>
  `A dark fantasy illustration of a ${name}, gothic atmosphere, ominous mood, detailed textures`
```

**Components to Include:**
- Art style (realistic, anime, painted, etc.)
- Quality descriptors (high-resolution, detailed, 8K)
- Lighting (dramatic, soft, cinematic)
- Mood (ominous, vibrant, mystical)
- Background (complete, simple, atmospheric)

---

## Environment Variables

### .env File

Required variables for each script:

**Complete Pipeline:**
```bash
API_KEY=your_google_ai_studio_key_here
```

**Unified Generator:**
```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_studio_key_here
```

**Both (same key works):**
```bash
# Use both to work with either script
API_KEY=your_google_ai_studio_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_studio_key_here
```

### Getting Your API Key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy and paste into `.env`

---

## Common Configurations

### Quick Testing

```javascript
// Fast testing (Complete Pipeline)
numberOfCards: 5,
delayBetweenImages: 3000,
delayBetweenFlavorText: 2000,
```

### Production Run

```javascript
// Stable production (Complete Pipeline)
numberOfCards: 100,
delayBetweenImages: 6000,
delayBetweenFlavorText: 5000,
```

### Large Batch Processing

```javascript
// Big batch (Unified Generator)
maxImages: 300,
delayMs: 5000,
```

### Different Card Types

```javascript
// Legendary cards
defaultStats: {
  level: "5",
  attack: "7",
  defense: "6",
  hp: "10",
  manaCost: "5",
  terrain: "⭐",
}

// Common cards
defaultStats: {
  level: "1",
  attack: "2",
  defense: "2",
  hp: "3",
  manaCost: "1",
  terrain: "?",
}
```

---

## Dynamic Configuration

### Changing Config at Runtime

**Not recommended**, but possible:

```javascript
// Before running main()
CONFIG.numberOfCards = process.env.CARD_COUNT || 10;
CONFIG.artist = process.env.ARTIST_NAME || "SURF FINANCE STUDIOS";
```

### Multiple Configurations

Create separate config files:

```javascript
// config-heroes.mjs
export const HERO_CONFIG = {
  defaultStats: {
    level: "3",
    attack: "5",
    defense: "5",
    hp: "8",
    manaCost: "3",
    terrain: "⚔️",
  },
  // ... other settings
};

// config-monsters.mjs
export const MONSTER_CONFIG = {
  defaultStats: {
    level: "2",
    attack: "6",
    defense: "2",
    hp: "6",
    manaCost: "2",
    terrain: "💀",
  },
  // ... other settings
};
```

Then import in main script:
```javascript
import { HERO_CONFIG } from './config-heroes.mjs';
const CONFIG = HERO_CONFIG; // or MONSTER_CONFIG
```

---

## Best Practices

### Testing Configuration

```javascript
// Always test with low numbers first
numberOfCards: 3,
maxImages: 5,
```

### Production Configuration

```javascript
// Use conservative delays
delayBetweenImages: 6000,
delayBetweenFlavorText: 5000,
delayMs: 5000,
```

### Deployment Configuration

```javascript
// Use actual production URLs
baseUrl: "https://yourcards.com",
externalUrl: "https://yourcards.com",
```

### Default Stats Philosophy

- Start with balanced defaults
- Adjust after seeing generated cards
- Can batch-edit afterward in generated files
- Keep special characters in mind (?, X, ∞)

---

## Configuration Checklist

Before running:

- [ ] API key in `.env`
- [ ] Output directories configured
- [ ] URLs set for deployment
- [ ] Artist/collection names set
- [ ] Default stats appropriate
- [ ] Rate limits reasonable
- [ ] Prompt mode selected (Complete Pipeline)
- [ ] Input directory has images (Unified Generator)

---

**Built for SURF Waves Collection** 🌊

Configure once, generate thousands! ⚙️✨
