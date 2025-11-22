# 🎯 NEW UNIFIED SYSTEM - Move + Flavor Text Generator

## What Changed?

### OLD SYSTEM (MEGA_FLAVOR_STYLES):
- ❌ 51 separate writing styles
- ❌ Random style selection
- ❌ Generic prompts not connected to image
- ❌ Flavor text felt detached from card

### NEW SYSTEM (Unified Analysis):
- ✅ Single unified prompt
- ✅ AI analyzes the actual image
- ✅ Generates ONE signature move based on visuals
- ✅ Flavor text directly references the move
- ✅ Everything feels cohesive and connected!

---

## How It Works Now

### Step 1: Image Analysis
Gemini looks at your card image and identifies:
- Visual characteristics
- Color palette
- Creature type and features
- Overall vibe and energy

### Step 2: Move Generation
Based on what it sees, Gemini creates ONE signature move:
- **Examples:**
  - "Void Collapse"
  - "Crimson Requiem"
  - "Fracture Reality"
  - "Eternal Hunger"
  - "Tidal Devastation"

### Step 3: Connected Flavor Text
Flavor text is written to reference the move:

**Move:** "Void Collapse"  
**Flavor:** "Where its presence lingers, light itself forgets how to exist. Those who witness the collapse speak only in whispers, if they speak at all."

**Move:** "Fracture Reality"  
**Flavor:** "In the space between heartbeats, the world splits into a thousand reflections, each more wrong than the last."

---

## Example Output

### Before (Detached):
```javascript
{
  name: "Fire Dragon",
  subtitle: "⟨Generated⟩",
  flavorText: "A powerful dragon that breathes fire and dominates the battlefield."
}
```
👎 Generic, boring, not connected to image

### After (Connected):
```javascript
{
  name: "Fire Dragon",
  subtitle: "⟨Inferno Collapse⟩", // ← MOVE AS SUBTITLE!
  flavorText: "When the skies burn and mountains turn to glass, kingdoms learn what true heat means. The only warning is the sudden absence of air."
}
```
👍 Specific, memorable, connected to visuals and move!

---

## What You Get

### 1. Signature Moves
Each card now has a unique 2-5 word signature move stored as the subtitle:
- Shows on the card
- Exported to `signatureMoves.json`
- Part of the card identity

### 2. Connected Flavor Text
Flavor text that:
- References the move
- Describes its impact
- Uses vivid, atmospheric language
- Makes readers FEEL something

### 3. Better Card Identity
Each card now has:
- **Visual identity** (the image)
- **Mechanical identity** (the signature move)
- **Narrative identity** (the flavor text)

All three work together! 🎯

---

## Files Updated

### ✅ completeCardPipeline.mjs
- For generating images from scratch
- New `generateMoveAndFlavorText()` function
- Removed FLAVOR_TEXT_STYLES array
- Move stored as card subtitle
- Exports `signatureMoves.json`

### ✅ unifiedCardGenerator.mjs  
- For processing existing images
- Same new `generateMoveAndFlavorText()` function
- Removed FLAVOR_TEXT_STYLES array
- Move stored as card subtitle
- Exports `signatureMoves.json`

---

## The Prompt Structure

The new system asks Gemini to:

1. **Study the image carefully**
2. **Generate ONE signature move** (2-5 words)
   - Must relate to visual appearance
   - Should be evocative and memorable
3. **Write flavor text** that:
   - References or hints at the move
   - Describes the impact/effect
   - Uses vivid, atmospheric language
   - Makes reader FEEL something

---

## Why This Is Better

### Problem with Old System:
- Style selection was random
- Prompt was generic
- No connection between visual and text
- Felt like template filling

### Solution with New System:
- AI actually looks at the image
- Generates content specific to what it sees
- Move and flavor text are designed together
- Everything feels cohesive

---

## Example Comparison

### Card: Shadow Creature

**OLD SYSTEM:**
- Style: "Prophecy" (randomly selected)
- Flavor: "When the stars align and darkness falls, ancient evils rise."
- Problem: Generic prophecy, could be any creature

**NEW SYSTEM:**
- Move: "Shadow Consumption"
- Flavor: "It doesn't hunt in darkness—it IS the darkness. Those who enter its domain become part of the eternal feast."
- Success: Specific to shadows, references the move, describes the impact

---

## Running the Updated Scripts

### Same commands as before!

```bash
# For generating from scratch:
node completeCardPipeline.mjs

# For processing existing images:
node unifiedCardGenerator.mjs
```

### New output files:
- `generatedThemes.js` (same as before)
- `generatedCardData.js` (now includes moves as subtitles!)
- `flavorTexts.json` (same as before)
- `signatureMoves.json` ← NEW!
- `metadata/` (same as before)

---

## Configuration

### No more FLAVOR_TEXT_STYLES!

The old 51-style system is completely gone. Everything now comes from:
1. Analyzing the actual image
2. Generating one cohesive move + flavor combo

### Stats stay the same:
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

You can still edit these in CONFIG.

---

## Benefits Summary

✅ **More Cohesive** - Everything works together  
✅ **More Specific** - Based on actual image  
✅ **More Memorable** - Signature moves are catchy  
✅ **More Professional** - Feels like real TCG cards  
✅ **Simpler Code** - No giant style arrays  
✅ **Better Results** - AI sees and responds to visuals

---

## Migration Guide

### If you were using the old scripts:

1. **Replace your files** with these new versions
2. **Run the generator** - same commands
3. **Check the output** - moves now in subtitles!
4. **Enjoy better cards** - that's it!

### Card data structure change:
```javascript
// OLD
subtitle: "⟨Generated⟩"

// NEW  
subtitle: "⟨Shadow Consumption⟩" // ← ACTUAL MOVE!
```

---

## Questions?

**Q: Can I still customize the stats?**  
A: Yes! Edit `defaultStats` in CONFIG.

**Q: Can I change the move style?**  
A: The prompt asks for "evocative 2-5 word moves" - you can edit the prompt in the `generateMoveAndFlavorText()` function if you want different style.

**Q: What if I don't like a generated move?**  
A: Edit it in the generated `signatureMoves.json` or directly in `generatedCardData.js`!

**Q: Does this work with custom images?**  
A: Yes! `unifiedCardGenerator.mjs` works with ANY images you put in `input_dir/`

---

## Final Thoughts

This new system replaces the complexity of 51 separate styles with ONE intelligent system that:
- Actually looks at your images
- Generates content that makes sense
- Creates cohesive card identities

The flavor text now feels **attached** to the card because it IS attached - it's describing the creature's signature move that was generated FROM the image! 🎯

---

**Happy Generating!** 🎴✨

Built for the SURF Waves Collection 🌊
