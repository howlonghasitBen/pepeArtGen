# 🎴 Card Curation Tool

**Visual gallery interface for curating generated cards**

## Quick Start

```bash
node curate.mjs
```

That's it! Your browser will open automatically at `http://localhost:3000`

## What It Does

1. **Shows a gallery** of all cards from `complete-cards/generated-images/`
2. **Click cards** to mark them for deletion (they'll get a red border)
3. **Bulk operations** - Use "Select All" / "Deselect All" buttons
4. **Delete** - Click "Delete Selected" to permanently remove marked cards

## What Gets Deleted

When you delete a card, the tool removes:

- ✅ Image from `complete-cards/generated-images/`
- ✅ Theme entry from `complete-cards/generatedThemes.js`
- ✅ Card data entry from `complete-cards/generatedCardData.js`
- ✅ Both metadata files from `complete-cards/metadata/`

## Features

- **Visual confirmation** - Red border shows cards marked for deletion
- **Confirmation modal** - Double-checks before permanent deletion
- **Live counter** - See how many cards are marked
- **No backups** - Permanent deletion (as requested)
- **Responsive grid** - Works on desktop and mobile

## Usage Tips

1. Run after `completeCardPipeline.mjs` generates cards
2. Curate before moving to production repo
3. Use keyboard/mouse - click any card to toggle
4. Server runs until you press `Ctrl+C`

## Example Workflow

```bash
# 1. Generate cards
node completeCardPipeline.mjs

# 2. Review and curate
node curate.mjs
# (opens browser, click unwanted cards, delete)

# 3. Move to production
# Your curated cards are ready!
```

## Requirements

- Node.js 18+
- Generated cards in `complete-cards/` directory
- Modern web browser

## Troubleshooting

**"No cards found"**

- Make sure you've run `completeCardPipeline.mjs` first
- Check that `complete-cards/generated-images/` has images

**Server won't start**

- Port 3000 might be in use
- Change `CONFIG.port` in `curate.mjs`

**Browser doesn't open**

- Manually visit `http://localhost:3000`

## Notes

- No undo! Deleted cards are permanently removed
- Source images in `input_dir/` are NOT deleted
- Only works with `complete-cards/` directory
- Safe to stop server anytime (Ctrl+C)

---

**Built for SURF Waves Collection** 🌊
