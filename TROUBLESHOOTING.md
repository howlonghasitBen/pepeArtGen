# 🔧 Troubleshooting Guide

**Solutions to common issues and error messages.**

---

## Quick Diagnostic

**Not working? Start here:**

1. **Check `.env` file exists** and has API key
2. **Verify Node.js version** (need 18+)
3. **Confirm dependencies installed** (`npm install`)
4. **Check internet connection**
5. **Try with minimal config** (5 cards, default settings)

---

## Installation Issues

### "Cannot find module 'node-vibrant'"

**Cause:** Dependency not installed

**Solution:**
```bash
npm install node-vibrant
# or
npm install  # Install all dependencies
```

### "Cannot find module '@google/genai'"

**Cause:** Missing Google AI dependencies

**Solution:**
```bash
npm install @google/genai @ai-sdk/google ai
```

### "npm ERR! code ENOENT"

**Cause:** No package.json file

**Solution:**
```bash
# Make sure you're in the right directory
ls package.json  # Should exist

# If not, create one:
npm init -y
npm install @google/genai @ai-sdk/google ai node-vibrant dotenv
```

### "engines: node >=18.0.0"

**Cause:** Node.js version too old

**Solution:**
```bash
# Check your version
node --version

# If < 18, update:
# Windows: Download from nodejs.org
# Mac: brew upgrade node
# Linux: nvm install 18
```

---

## API Key Issues

### "API_KEY not found in .env file"

**Symptoms:**
```
❌ ERROR: API_KEY not found in .env file
```

**Solutions:**

1. **Create `.env` file:**
```bash
touch .env  # Mac/Linux
# or
type nul > .env  # Windows
```

2. **Add API key:**
```bash
# For Complete Pipeline
API_KEY=your_key_here

# For Unified Generator
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here

# Or both (same key works)
API_KEY=your_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

3. **Check for typos:**
```bash
# Must be EXACTLY these names
API_KEY                          ✅
GOOGLE_GENERATIVE_AI_API_KEY    ✅

api_key                          ❌
API-KEY                          ❌
GOOGLE_GENERATIVE_AI_API-KEY    ❌
```

4. **Verify no spaces:**
```bash
# Correct
API_KEY=sk-abc123

# Wrong
API_KEY = sk-abc123       ❌ (spaces)
API_KEY=sk-abc123         ❌ (extra space)
```

### "Invalid API key"

**Symptoms:**
```
❌ Error: Invalid authentication credentials
```

**Solutions:**

1. **Get new key:**
   - Go to https://aistudio.google.com/app/apikey
   - Create new API key
   - Copy entire key (starts with random string)

2. **Check key is active:**
   - Go to API key dashboard
   - Verify key isn't disabled

3. **Test key:**
```bash
# Try with minimal script
node -e "console.log(process.env.API_KEY)" 
# Should output your key
```

---

## Input/Output Issues

### "Input directory does not exist" (Unified Generator)

**Symptoms:**
```
❌ ERROR: Input directory "./input_dir" does not exist!
```

**Solutions:**

```bash
# Create directory
mkdir input_dir

# Verify it exists
ls -la | grep input_dir

# Add some test images
cp /path/to/images/*.png input_dir/
```

### "No image files found"

**Symptoms:**
```
❌ ERROR: No image files found in ./input_dir!
```

**Solutions:**

1. **Check directory has images:**
```bash
ls input_dir/
# Should show .png, .jpg, .jpeg, .gif, or .webp files
```

2. **Verify file extensions:**
```bash
# Supported
dragon.png          ✅
wizard.jpg          ✅
knight.jpeg         ✅
demon.gif           ✅
angel.webp          ✅

# Not supported
card.pdf            ❌
image.svg           ❌
photo.tiff          ❌
```

3. **Check file permissions:**
```bash
ls -l input_dir/
# Should not show 'permission denied'
```

### "Cannot create output directory"

**Symptoms:**
```
❌ Error: EACCES: permission denied, mkdir './generated-cards'
```

**Solutions:**

1. **Check permissions:**
```bash
# Make sure you can write here
touch test.txt  # Should work
rm test.txt
```

2. **Run with permissions:**
```bash
# Mac/Linux
sudo node unifiedCardGenerator.mjs

# Or change ownership
sudo chown -R $USER:$USER .
```

3. **Use different directory:**
```javascript
const CONFIG = {
  outputDir: "./output",  // Try different name
};
```

---

## Image Generation Issues (Complete Pipeline)

### "Image generation failed"

**Symptoms:**
```
⚠️  Image generation returned no data (may be policy violation)
```

**Cause:** Content policy violation

**Solutions:**

1. **Try different prompts:**
```javascript
// More general
"A fantasy creature in epic art style"

// Less violent
"A powerful guardian in mystical setting"

// More abstract
"A legendary being of ancient power"
```

2. **Check content policies:**
   - No violence/gore
   - No political content
   - No copyrighted characters
   - No inappropriate content

3. **Test with safe prompt:**
```javascript
customPrompts: [
  "A friendly dragon in a garden",
  "A wise wizard with staff",
  "A cute forest creature",
]
```

### "Aspect ratio not supported"

**Symptoms:**
```
❌ Error: Invalid aspect ratio
```

**Solutions:**

```javascript
// Valid options:
imageAspectRatio: "1:1"   ✅
imageAspectRatio: "16:9"  ✅
imageAspectRatio: "9:16"  ✅
imageAspectRatio: "4:3"   ✅
imageAspectRatio: "3:4"   ✅

// Invalid:
imageAspectRatio: "16:10" ❌
imageAspectRatio: "21:9"  ❌
```

---

## Rate Limit Issues

### "Rate limit exceeded"

**Symptoms:**
```
❌ Error: Resource has been exhausted (e.g. quota, rate limit)
```

**Solutions:**

1. **Wait for reset:**
   - Imagen: 100 images per day
   - Gemini: 1,500 requests per day
   - Resets at midnight UTC

2. **Increase delays:**
```javascript
// Complete Pipeline
delayBetweenImages: 8000,        // Increase to 8 seconds
delayBetweenFlavorText: 6000,    // Increase to 6 seconds

// Unified Generator
delayMs: 6000,                   // Increase to 6 seconds
```

3. **Reduce batch size:**
```javascript
// Instead of 100
numberOfCards: 20,

// Or process in chunks
maxImages: 50,
```

4. **Check quota:**
   - Go to Google Cloud Console
   - Check API quotas
   - Verify not over daily limit

### "Too many requests"

**Symptoms:**
```
❌ 429 Too Many Requests
```

**Solutions:**

1. **Add longer delays:**
```javascript
delayBetweenImages: 10000,  // 10 seconds
delayMs: 8000,              // 8 seconds
```

2. **Use exponential backoff:**
```javascript
// Manually handle retries
let retries = 0;
while (retries < 3) {
  try {
    await generateImage();
    break;
  } catch (error) {
    retries++;
    await sleep(5000 * retries);  // 5s, 10s, 15s
  }
}
```

---

## Color Extraction Issues

### "Could not extract colors"

**Symptoms:**
```
❌ Error processing image.png:
Could not extract colors
```

**Solutions:**

1. **Check image file:**
```bash
# View image info
file input_dir/image.png
# Should say "PNG image" or similar

# Try opening image
# If corrupted, re-export from editor
```

2. **Convert format:**
```bash
# Use ImageMagick or similar
convert image.jpg image.png
```

3. **Try different image:**
```bash
# Test with known good image
cp test-images/working.png input_dir/
node unifiedCardGenerator.mjs
```

### "All colors are gray"

**Cause:** Monochrome or very desaturated image

**Solutions:**

1. **Use more colorful images:**
   - Add saturation in image editor
   - Use images with distinct colors
   - Avoid grayscale images

2. **Manually edit themes:**
   - After generation
   - Edit `generatedThemes.js`
   - Add colors manually

---

## Flavor Text Generation Issues

### "Failed to parse response"

**Symptoms:**
```
⚠️  Failed to parse response, using defaults
```

**Cause:** AI didn't follow expected format

**Solutions:**

1. **Use defaults - they're fine:**
   - Script automatically uses fallback
   - Card generation continues
   - Not a critical error

2. **Check specific cards:**
   - Review which cards got defaults
   - Manually edit afterward if needed

3. **Retry if needed:**
   - Delete `generated-cards/`
   - Run again
   - Random variations may work better

### "Generic flavor text"

**Symptoms:**
All cards have similar text like "A powerful creature..."

**Cause:** This shouldn't happen with current system, but if it does:

**Solutions:**

1. **Verify correct script version:**
```bash
# Check for generateMoveAndFlavorText function
grep "generateMoveAndFlavorText" completeCardPipeline.mjs
# Should exist
```

2. **Check Gemini model:**
```javascript
geminiModel: "gemini-2.5-flash-lite"  // Recommended
// or
geminiModel: "gemini-2.0-flash-exp"   // Alternative
```

3. **Manually edit after generation:**
   - Edit `generatedCardData.js`
   - Update flavorText fields

---

## Memory Issues

### "JavaScript heap out of memory"

**Symptoms:**
```
FATAL ERROR: Reached heap limit Allocation failed
```

**Solutions:**

1. **Process smaller batches:**
```javascript
numberOfCards: 50,   // Instead of 300
maxImages: 100,      // Instead of 300
```

2. **Increase Node memory:**
```bash
node --max-old-space-size=4096 completeCardPipeline.mjs
```

3. **Close other applications:**
   - Free up RAM
   - Close browser tabs
   - Close other development tools

---

## File System Issues

### "ENOENT: no such file or directory"

**Symptoms:**
```
❌ Error: ENOENT: no such file or directory
```

**Solutions:**

1. **Check working directory:**
```bash
pwd  # Should be in project directory
ls   # Should see .mjs files
```

2. **Use absolute paths:**
```javascript
const CONFIG = {
  inputDir: "/full/path/to/input_dir",
  outputDir: "/full/path/to/output",
};
```

3. **Create missing directories:**
```bash
mkdir -p input_dir
mkdir -p generated-cards
```

### "EACCES: permission denied"

**Solutions:**

```bash
# Fix permissions
chmod +x *.mjs
chmod -R 755 input_dir/

# Or run with sudo (last resort)
sudo node completeCardPipeline.mjs
```

---

## Network Issues

### "ETIMEDOUT" or "ENOTFOUND"

**Symptoms:**
```
❌ Error: getaddrinfo ENOTFOUND api.openai.com
```

**Solutions:**

1. **Check internet connection:**
```bash
ping google.com
```

2. **Check firewall:**
   - Allow Node.js through firewall
   - Allow HTTPS connections

3. **Try different network:**
   - Use mobile hotspot
   - Try VPN
   - Disable proxy if using one

### "SSL/TLS errors"

**Solutions:**

```bash
# Update Node.js
node --version  # Should be 18+

# Update npm
npm install -g npm@latest

# Clear npm cache
npm cache clean --force
```

---

## Output Quality Issues

### "Themes don't match images"

**Cause:** Color extraction found unexpected colors

**Solutions:**

1. **Manually edit themes:**
```javascript
// In generatedThemes.js
dragonWarrior: {
  background: "linear-gradient(#ff0000, #000000)",  // Your colors
  // ...
}
```

2. **Regenerate specific cards:**
   - Delete unwanted cards from output
   - Re-run with just those images

### "Card names are weird"

**Cause:** Filename used as card name

**Solutions:**

**Before running:**
```bash
# Rename files
mv IMG_001.png "Fire Dragon.png"
mv IMG_002.png "Ice Wizard.png"
```

**After running:**
```javascript
// Edit generatedCardData.js
{
  id: "img001",
  name: "Fire Dragon",  // Change this
  // ...
}
```

---

## Testing & Debugging

### Test with Minimal Config

```javascript
// Complete Pipeline
const CONFIG = {
  numberOfCards: 2,
  imageAspectRatio: "1:1",
  delayBetweenImages: 3000,
  delayBetweenFlavorText: 2000,
  promptMode: "custom",
  customPrompts: ["A friendly dragon", "A wise wizard"],
};
```

```javascript
// Unified Generator
const CONFIG = {
  maxImages: 2,
  delayMs: 3000,
};
// And put just 2 test images in input_dir/
```

### Enable Verbose Logging

Add at top of script:

```javascript
console.log("Starting script...");
console.log("CONFIG:", JSON.stringify(CONFIG, null, 2));
console.log("Environment check:");
console.log("- API_KEY:", process.env.API_KEY ? "✅ Set" : "❌ Missing");
console.log("- Node version:", process.version);
```

### Test Color Extraction Only

Use the included test script:

```bash
# Add a few test images
node testColorExtraction.mjs
```

This tests without using API calls.

---

## Getting Help

If issues persist:

1. **Check console output** - Error messages are descriptive
2. **Review configuration** - Compare with examples in docs
3. **Test incrementally** - Start with 1-2 cards
4. **Check API status** - Visit Google AI Studio
5. **Try different images** - Some images work better
6. **Read error carefully** - Usually tells you exactly what's wrong

---

## Common Error Summary

| Error | Quick Fix |
|-------|-----------|
| API_KEY not found | Create `.env` file |
| No images found | Add images to `input_dir/` |
| Rate limit | Wait 24 hours or increase delays |
| Permission denied | Check file permissions |
| Out of memory | Process smaller batches |
| Network timeout | Check internet connection |
| Invalid aspect ratio | Use supported ratios |
| Image gen failed | Try different prompts |
| Can't parse JSON | Let script use defaults |

---

## Emergency Fixes

### Complete Reset

```bash
# 1. Delete output
rm -rf generated-cards/
rm -rf complete-cards/

# 2. Clear dependencies
rm -rf node_modules/
rm package-lock.json

# 3. Reinstall
npm install

# 4. Verify .env
cat .env  # Should show API key

# 5. Test with 1 card
# Edit CONFIG: numberOfCards: 1
node completeCardPipeline.mjs
```

### Start Fresh

```bash
# 1. Create new directory
mkdir card-generator-fresh
cd card-generator-fresh

# 2. Copy just the scripts
cp ../completeCardPipeline.mjs .
cp ../unifiedCardGenerator.mjs .
cp ../package.json .

# 3. Create .env
echo "API_KEY=your_key" > .env

# 4. Install
npm install

# 5. Test
node completeCardPipeline.mjs
```

---

**Built for SURF Waves Collection** 🌊

Every problem has a solution! 🔧✨
