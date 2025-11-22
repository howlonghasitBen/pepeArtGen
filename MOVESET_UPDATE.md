# 🎴 Moveset Placement Update

## 🔄 What Changed?

The signature move (moveset) has been **moved from the subtitle to the flavor text area**.

### Before:
```javascript
{
  name: "Dragon Warrior",
  subtitle: "⟨Shadow Consumption⟩",  // ← Move was here
  flavorText: "Where its presence lingers, light itself forgets how to exist."
}
```

### After:
```javascript
{
  name: "Dragon Warrior",
  subtitle: "⟨Generated⟩",  // ← Back to default
  flavorText: "Shadow Consumption\nWhere its presence lingers, light itself forgets how to exist."
  // ↑ Move is now here with newline separator
}
```

---

## 📝 New Format

The flavor text area now contains:
```
[MOVESET]
[FLAVOR_TEXT]
```

**Example:**
```
Void Collapse
Where its presence lingers, light itself forgets how to exist. Those who witness the collapse speak only in whispers, if they speak at all.
```

---

## 🔧 Changes Made

### Both Scripts Updated:
1. **completeCardPipeline.mjs** - For generating images from scratch
2. **unifiedCardGenerator.mjs** - For processing existing images

### Key Changes:
1. `subtitle` - Changed back to `"⟨Generated⟩"`
2. `flavorText` - Now includes: `${moveData.move}\n${moveData.flavorText}`

---

## 📦 Updated Files

Download these updated scripts:
- [completeCardPipeline.mjs](computer:///mnt/user-data/outputs/completeCardPipeline.mjs)
- [unifiedCardGenerator.mjs](computer:///mnt/user-data/outputs/unifiedCardGenerator.mjs)

---

## 🎯 Example Output

### Generated Card Data:
```javascript
{
  id: "dragonwarrior",
  name: "Dragon Warrior",
  subtitle: "⟨Generated⟩",
  level: "1",
  theme: "dragonWarrior",
  manaCost: [...],
  image: "/images/card-images/dragon-warrior.png",
  type: "Creature — Generated",
  stats: { attack: "3", defense: "3" },
  flavorText: "Inferno Collapse\nWhen the skies burn and mountains turn to glass, kingdoms learn what true heat means. The only warning is the sudden absence of air.",
  artist: "SURF FINANCE STUDIOS",
  rarity: "1/1"
}
```

### How It Displays:
```
┌─────────────────────────┐
│   Dragon Warrior        │  ← name
│   ⟨Generated⟩          │  ← subtitle (default)
├─────────────────────────┤
│                         │
│   [Card Image]          │
│                         │
├─────────────────────────┤
│ Inferno Collapse        │  ← moveset (first line)
│                         │
│ When the skies burn     │  ← flavor text (after newline)
│ and mountains turn to   │
│ glass, kingdoms learn   │
│ what true heat means.   │
└─────────────────────────┘
```

---

## 💡 Why This Change?

1. **Better Visibility** - Moveset is more prominent in the flavor text area
2. **Cleaner Subtitle** - Subtitle remains consistent across all cards
3. **Natural Reading Flow** - Move → Description reads naturally
4. **Easier Styling** - Frontend can style the first line differently if desired

---

## 🎨 Frontend Rendering Tip

In your React component, you can split and style the flavor text:

```javascript
const renderFlavorText = (flavorText) => {
  const [moveset, ...descriptionLines] = flavorText.split('\n');
  const description = descriptionLines.join('\n');
  
  return (
    <div className="flavor-text">
      <div className="moveset">{moveset}</div>
      <div className="description">{description}</div>
    </div>
  );
};
```

**CSS Styling:**
```css
.moveset {
  font-weight: bold;
  font-size: 1.1em;
  color: var(--vibrant-color);
  margin-bottom: 0.5em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.description {
  font-style: italic;
  line-height: 1.4;
}
```

---

## ✅ Everything Still Works

All other functionality remains the same:
- ✅ Color extraction
- ✅ Theme generation
- ✅ Metadata export
- ✅ Signature moves saved separately in `signatureMoves.json`
- ✅ Same API usage and rate limiting
- ✅ Same output structure

---

## 🚀 Next Steps

1. Download the updated scripts
2. Replace your existing versions
3. Run the generator as normal
4. Update your frontend component to render the new format (optional styling)

---

**Built for the SURF Waves Collection** 🌊  
Moveset now in the spotlight! 🎯
