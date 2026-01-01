# Card Game Development Suite - Implementation Plan

## Overview

Transform the current card generation/minting mini-app into a comprehensive **Card Game Development Suite** inspired by WillowTree's item editing approach for Borderlands. The suite will enable granular, part-by-part editing of trading cards similar to how WillowTree allows editing individual weapon components.

---

## Phase 1: Core Editor Infrastructure

### 1.1 Database Schema Extensions

**New Tables:**

```sql
-- Card templates for reusable base configurations
CREATE TABLE card_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'creature', 'spell', 'terrain', etc.
  base_stats JSONB DEFAULT '{}',
  base_theme JSONB DEFAULT '{}',
  created_by TEXT, -- wallet address
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Card drafts for work-in-progress cards
CREATE TABLE card_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_address TEXT NOT NULL,
  name TEXT NOT NULL,
  card_data JSONB NOT NULL, -- Full card state
  template_id UUID REFERENCES card_templates(id),
  version INTEGER DEFAULT 1,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset library for images, themes, color palettes
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_address TEXT NOT NULL,
  type TEXT NOT NULL, -- 'image', 'theme', 'palette', 'ability'
  name TEXT NOT NULL,
  data JSONB NOT NULL, -- Asset data or IPFS reference
  metadata JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Card screenshots for server-side storage
CREATE TABLE card_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id),
  mint_id UUID REFERENCES mints(id),
  screenshot_url TEXT NOT NULL, -- Server storage URL or Supabase Storage
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decks for organizing cards
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_address TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  card_ids UUID[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 Card Part System (WillowTree-style)

Define card "parts" that can be individually edited:

```javascript
// Card Parts Schema
const CARD_PARTS = {
  // Identity
  identity: {
    name: { type: 'string', editable: true },
    subtitle: { type: 'string', editable: true },
    type: { type: 'select', options: ['Creature', 'Spell', 'Terrain', 'Artifact'] },
    level: { type: 'number', min: 1, max: 10 }
  },

  // Combat Stats
  stats: {
    hp: { type: 'number', min: 1, max: 20 },
    attack: { type: 'number', min: 0, max: 15 },
    defense: { type: 'number', min: 0, max: 15 },
    mana: { type: 'number', min: 0, max: 10 },
    speed: { type: 'number', min: 1, max: 10 }
  },

  // Abilities
  abilities: {
    moveName: { type: 'string' },
    moveDescription: { type: 'textarea' },
    passiveAbility: { type: 'textarea', optional: true },
    specialAbility: { type: 'textarea', optional: true }
  },

  // Visuals
  visuals: {
    image: { type: 'image' }, // Base64 or URL
    colorPalette: { type: 'palette' }, // 6-color extraction
    theme: { type: 'theme' } // CSS theme object
  },

  // Flavor
  flavor: {
    flavorText: { type: 'textarea' },
    artist: { type: 'string' },
    rarity: { type: 'select', options: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', '1/1'] },
    setName: { type: 'string', optional: true },
    cardNumber: { type: 'string', optional: true }
  },

  // Terrain/Element
  terrain: {
    terrainType: { type: 'select', options: ['Fire', 'Water', 'Earth', 'Air', 'Shadow', 'Light', 'Neutral'] },
    terrainBonus: { type: 'textarea', optional: true }
  }
};
```

---

## Phase 2: Editor UI Components

### 2.1 New Screen: CardEditorScreen

Main editing interface with WillowTree-style part panels:

```
┌─────────────────────────────────────────────────────────────────┐
│  CARD EDITOR SUITE                               [Save] [Export]│
├────────────────┬────────────────────────────────────────────────┤
│                │                                                │
│  PART SELECTOR │           LIVE PREVIEW                         │
│                │                                                │
│  ▼ Identity    │        ┌────────────────┐                      │
│    • Name      │        │                │                      │
│    • Subtitle  │        │   [Card Image] │                      │
│    • Type      │        │                │                      │
│    • Level     │        │   Card Name    │                      │
│                │        │   ATK: X DEF: X│                      │
│  ▼ Stats       │        │                │                      │
│    • HP        │        │   Flavor text  │                      │
│    • Attack    │        │   here...      │                      │
│    • Defense   │        │                │                      │
│    • Mana      │        └────────────────┘                      │
│                │                                                │
│  ▼ Abilities   │  ─────────────────────────────────────────────  │
│    • Move Name │           PART EDITOR PANEL                    │
│    • Move Desc │                                                │
│                │   [Selected Part: Stats]                       │
│  ▼ Visuals     │                                                │
│    • Image     │   HP:     [====7====] ▼                        │
│    • Colors    │   Attack: [====5====] ▼                        │
│    • Theme     │   Defense:[====4====] ▼                        │
│                │   Mana:   [====3====] ▼                        │
│  ▼ Flavor      │                                                │
│                │   [Randomize] [Copy from Template] [Reset]     │
│  ▼ Terrain     │                                                │
│                │                                                │
├────────────────┴────────────────────────────────────────────────┤
│  [Load Template] [Save as Template] [AI Generate Part] [Undo]   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Breakdown

**New Components to Create:**

1. **CardEditorScreen.jsx** - Main editor container
2. **PartSelector.jsx** - Left panel with expandable part categories
3. **PartEditor.jsx** - Dynamic editor for selected part
4. **LiveCardPreview.jsx** - Real-time card preview (uses SwipeableCard)
5. **StatSlider.jsx** - Slider component for numeric stats
6. **ColorPaletteEditor.jsx** - Visual color palette editing
7. **ThemeEditor.jsx** - CSS theme customization
8. **ImageUploader.jsx** - Upload/crop/edit card image
9. **AbilityEditor.jsx** - Rich text editor for abilities
10. **TemplateLibrary.jsx** - Browse/load card templates
11. **AssetLibrary.jsx** - Manage images, themes, palettes
12. **DeckBuilder.jsx** - Organize cards into decks

### 2.3 AI-Assisted Editing

Add AI generation buttons for each part:

```javascript
// AI generation endpoints
POST /api/editor/generate-part
  - Input: { partType, context, currentCard }
  - partType: 'name', 'ability', 'flavor', 'stats', 'theme'
  - Returns: Generated content for that part
```

---

## Phase 3: Server-Side Screenshot Storage

### 3.1 Screenshot Service

**New Backend Module: `screenshotService.mjs`**

```javascript
// Functions:
- captureCardScreenshot(cardData) → Buffer
- saveScreenshot(buffer, cardId, mintId) → URL
- generateThumbnail(buffer, size) → Buffer
- getCardScreenshots(cardId) → screenshots[]
- deleteScreenshot(screenshotId) → boolean
```

**Storage Options:**
1. **Supabase Storage** (Recommended) - Built-in, easy integration
2. **S3/R2** - More control, potentially cheaper at scale
3. **Local filesystem** - Simplest for development

### 3.2 Screenshot Endpoints

```javascript
// New routes in api.mjs or separate screenshotRoutes.mjs

POST /api/screenshots/capture
  - Input: { cardId } or { cardData }
  - Process: Render card with Puppeteer, save to storage
  - Returns: { screenshotUrl, thumbnailUrl }

GET /api/screenshots/card/:cardId
  - Returns: All screenshots for a card

GET /api/screenshots/gallery
  - Query params: limit, offset, sortBy
  - Returns: Paginated screenshots for carousel

DELETE /api/screenshots/:screenshotId
  - Deletes screenshot from storage
```

### 3.3 Auto-Screenshot on Mint

Update mint flow to automatically capture and store screenshots:

```javascript
// In mintRoutes.mjs, after successful mint:
1. Capture high-quality screenshot
2. Generate thumbnail (300x420)
3. Store both in Supabase Storage
4. Save URLs to card_screenshots table
5. Return screenshot URLs in response
```

---

## Phase 4: Enhanced Features

### 4.1 Import/Export System

```javascript
// Export formats
- JSON (full card data)
- PNG (card image)
- PDF (printable)
- NFT Metadata (IPFS-ready)

// Import sources
- JSON file
- Image (triggers AI analysis)
- Template library
- Clipboard paste
```

### 4.2 Parts Library (Like WillowTree Parts Swapper)

Pre-built components users can swap in:

```javascript
// Ability Templates
const ABILITY_TEMPLATES = [
  { name: 'Fireball', cost: 3, effect: 'Deal 4 damage to target' },
  { name: 'Shield Wall', cost: 2, effect: 'Gain +3 DEF until next turn' },
  // ...more
];

// Stat Presets
const STAT_PRESETS = {
  'Glass Cannon': { hp: 4, attack: 8, defense: 2 },
  'Tank': { hp: 10, attack: 3, defense: 7 },
  'Balanced': { hp: 6, attack: 5, defense: 5 },
  // ...more
};

// Theme Presets
const THEME_PRESETS = [
  { name: 'Fire', colors: {...}, gradients: {...} },
  { name: 'Ice', colors: {...}, gradients: {...} },
  // ...more
];
```

### 4.3 Deck Builder

```
┌─────────────────────────────────────────────────────────────────┐
│  DECK BUILDER                                    [New Deck]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MY DECKS                      DECK: "Fire Aggro" (24/30)       │
│  ──────────                    ────────────────────────────     │
│  • Fire Aggro (24/30)          [Card] [Card] [Card] [Card]      │
│  • Control Blue (30/30)        [Card] [Card] [Card] [Card]      │
│  • Draft Deck (12/30)          [Card] [Card] [Card] [Card]      │
│                                ...                              │
│  [+ New Deck]                                                   │
│                                STATS:                           │
│  ──────────────────            Avg Mana: 3.2                    │
│  CARD LIBRARY                  Creatures: 18                    │
│  ──────────────────            Spells: 6                        │
│  [Search...        ]                                            │
│  Filter: [All ▼]               [Export] [Share] [Test Draw]     │
│                                                                 │
│  [Card] [Card] [Card]                                           │
│  [Card] [Card] [Card]                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Gallery/Carousel System

New components for displaying stored screenshots:

```javascript
// Components
- CardCarousel.jsx - Horizontal scrolling gallery
- CardGallery.jsx - Grid view with filtering
- FeaturedCards.jsx - Curated showcase
- RecentMints.jsx - Latest minted cards
```

---

## Phase 5: Navigation & App Structure

### 5.1 Updated App Navigation

```javascript
// New screen structure
const SCREENS = {
  generator: 'Generator',      // Existing - AI generation
  editor: 'Card Editor',       // NEW - WillowTree-style editor
  deckBuilder: 'Deck Builder', // NEW - Deck management
  gallery: 'Gallery',          // NEW - All cards showcase
  curation: 'Curation',        // Existing - Swipe to mint
  myCards: 'My Cards',         // Existing - User's collection
  templates: 'Templates',      // NEW - Template library
  assets: 'Assets',            // NEW - Asset management
};
```

### 5.2 Updated Navigation Bar

```
┌─────────────────────────────────────────────────────────────────┐
│  🌊 WAVES TCG STUDIO                      [Wallet: 0x...] [⚙️]  │
├─────────────────────────────────────────────────────────────────┤
│  [Generate] [Editor] [Decks] [Gallery] [My Cards] [Templates]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Order

### Milestone 1: Foundation (Editor Core)
1. ✅ Explore current architecture
2. Create card_drafts and card_screenshots tables
3. Build CardEditorScreen with basic part editing
4. Implement LiveCardPreview component
5. Add save/load draft functionality

### Milestone 2: Parts System
6. Create PartSelector component
7. Build individual part editors (StatSlider, ColorPaletteEditor, etc.)
8. Implement part swap/copy functionality
9. Add undo/redo system

### Milestone 3: Screenshot Storage
10. Set up Supabase Storage bucket
11. Create screenshotService.mjs
12. Add screenshot capture to mint flow
13. Build Gallery and Carousel components

### Milestone 4: Templates & Assets
14. Create templates and assets tables
15. Build TemplateLibrary component
16. Build AssetLibrary component
17. Implement import/export system

### Milestone 5: Deck Builder
18. Create decks table
19. Build DeckBuilder screen
20. Add deck statistics and analysis
21. Implement deck sharing

### Milestone 6: Polish & Integration
22. Update navigation
23. Add AI-assisted part generation
24. Performance optimization
25. Documentation update

---

## Files to Create

### Frontend (mini-app/src/)
```
components/
  editor/
    CardEditorScreen.jsx      # Main editor container
    PartSelector.jsx          # Left panel navigation
    PartEditor.jsx            # Dynamic part editing
    LiveCardPreview.jsx       # Real-time preview
    StatSlider.jsx            # Numeric stat editing
    ColorPaletteEditor.jsx    # Color editing
    ThemeEditor.jsx           # Theme customization
    ImageUploader.jsx         # Image management
    AbilityEditor.jsx         # Ability text editing

  library/
    TemplateLibrary.jsx       # Browse templates
    AssetLibrary.jsx          # Manage assets
    PartsLibrary.jsx          # Pre-built parts

  deck/
    DeckBuilder.jsx           # Deck management
    DeckCard.jsx              # Card in deck view
    DeckStats.jsx             # Deck statistics

  gallery/
    CardGallery.jsx           # Grid gallery view
    CardCarousel.jsx          # Horizontal carousel
    GalleryFilters.jsx        # Filter controls

hooks/
  useCardEditor.js            # Editor state management
  useCardDrafts.js            # Draft CRUD operations
  useTemplates.js             # Template operations
  useAssets.js                # Asset operations
  useDecks.js                 # Deck operations
  useScreenshots.js           # Screenshot operations
```

### Backend (mini-app/server/)
```
screenshotRoutes.mjs          # Screenshot endpoints
screenshotService.mjs         # Screenshot capture/storage
editorRoutes.mjs              # Editor-specific endpoints
templateRoutes.mjs            # Template CRUD
assetRoutes.mjs               # Asset CRUD
deckRoutes.mjs                # Deck CRUD
```

### Database (mini-app/supabase/migrations/)
```
002_card_editor_schema.sql    # New tables for editor
```

---

## Questions for User

Before proceeding, I'd like to clarify:

1. **Screenshot Storage**: Should we use Supabase Storage (simplest) or a separate service like Cloudflare R2 (cheaper at scale)?

2. **Template Sharing**: Should templates be publicly shareable between users, or private only?

3. **Deck Size**: What's the target deck size for the game rules (30 cards, 40 cards, etc.)?

4. **Editor Access**: Should the full editor require payment/wallet connection, or be freely accessible?

5. **Priority**: Which milestone should we start with?
   - A) Editor Core (part-by-part editing)
   - B) Screenshot Storage (carousel feature)
   - C) Both in parallel

---

## Technical Notes

- **State Management**: Editor will need complex state - consider adding zustand or extending React Context
- **Undo/Redo**: Use immer for immutable state updates with history
- **Real-time Preview**: Debounce updates to prevent excessive re-renders
- **Large Images**: Implement client-side compression before upload
- **Puppeteer Memory**: Ensure browser instance cleanup for screenshot service
