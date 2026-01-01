-- Supabase Schema for Card Editor Suite
-- Migration: 002_card_editor_schema

-- Card drafts table
-- Stores work-in-progress cards that users are editing
CREATE TABLE card_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_address TEXT NOT NULL,
  source_card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Card',
  card_data JSONB NOT NULL DEFAULT '{}',
  version INTEGER DEFAULT 1,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for draft lookups
CREATE INDEX idx_card_drafts_owner ON card_drafts(owner_address);
CREATE INDEX idx_card_drafts_source ON card_drafts(source_card_id);
CREATE INDEX idx_card_drafts_updated ON card_drafts(updated_at DESC);

-- Card screenshots table
-- Stores rendered card images for galleries and carousels
CREATE TABLE card_screenshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  mint_id UUID REFERENCES mints(id) ON DELETE CASCADE,
  owner_address TEXT NOT NULL,
  screenshot_url TEXT NOT NULL,
  thumbnail_url TEXT,
  storage_path TEXT NOT NULL,
  width INTEGER DEFAULT 400,
  height INTEGER DEFAULT 560,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for screenshot lookups
CREATE INDEX idx_screenshots_card ON card_screenshots(card_id);
CREATE INDEX idx_screenshots_mint ON card_screenshots(mint_id);
CREATE INDEX idx_screenshots_owner ON card_screenshots(owner_address);
CREATE INDEX idx_screenshots_created ON card_screenshots(created_at DESC);

-- Decks table
-- Stores user deck configurations (max 30 cards)
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_address TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'New Deck',
  description TEXT,
  card_ids UUID[] DEFAULT '{}',
  cover_image_url TEXT,
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for deck lookups
CREATE INDEX idx_decks_owner ON decks(owner_address);
CREATE INDEX idx_decks_updated ON decks(updated_at DESC);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_card_drafts_updated_at
  BEFORE UPDATE ON card_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- View for gallery display (screenshots with card info)
CREATE VIEW gallery_cards AS
SELECT
  cs.id as screenshot_id,
  cs.screenshot_url,
  cs.thumbnail_url,
  cs.created_at as screenshot_created,
  c.id as card_id,
  c.name as card_name,
  c.rarity,
  c.attack,
  c.defense,
  c.hp,
  m.token_id,
  m.minter_address,
  m.minted_at
FROM card_screenshots cs
JOIN cards c ON cs.card_id = c.id
LEFT JOIN mints m ON cs.mint_id = m.id
ORDER BY cs.created_at DESC;

-- View for deck statistics
CREATE VIEW deck_stats AS
SELECT
  d.id as deck_id,
  d.owner_address,
  d.name,
  array_length(d.card_ids, 1) as card_count,
  d.is_complete,
  CASE
    WHEN array_length(d.card_ids, 1) >= 30 THEN true
    ELSE false
  END as is_full,
  d.updated_at
FROM decks d;

-- Comments for documentation
COMMENT ON TABLE card_drafts IS 'Work-in-progress cards being edited. Links to source generated card if editing an existing card.';
COMMENT ON TABLE card_screenshots IS 'Server-side stored screenshots of cards for gallery/carousel display.';
COMMENT ON TABLE decks IS 'User deck configurations with max 30 cards per deck.';
COMMENT ON COLUMN card_drafts.card_data IS 'Full card state as JSONB including identity, stats, abilities, visuals, flavor, terrain.';
COMMENT ON COLUMN card_drafts.is_locked IS 'Locked drafts cannot be edited (e.g., after minting).';
COMMENT ON COLUMN card_screenshots.storage_path IS 'Path in Supabase Storage bucket for the screenshot file.';
COMMENT ON COLUMN decks.card_ids IS 'Array of card UUIDs in the deck. Max 30 cards enforced at application level.';
