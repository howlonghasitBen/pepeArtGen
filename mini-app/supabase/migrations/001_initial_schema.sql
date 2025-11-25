-- Supabase Schema for Pepe Art Generator Mini-App
-- Migration: 001_initial_schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Payment sessions table
-- Tracks USDC payments before generation
CREATE TABLE payment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  amount_usdc DECIMAL(10, 2) NOT NULL,
  transaction_hash TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')),
  generations_remaining INTEGER DEFAULT 3, -- 1 initial + 2 re-rolls
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Index for fast wallet lookups
CREATE INDEX idx_payment_sessions_wallet ON payment_sessions(wallet_address);
CREATE INDEX idx_payment_sessions_status ON payment_sessions(status);
CREATE INDEX idx_payment_sessions_expires ON payment_sessions(expires_at);

-- Generated cards table
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_session_id UUID REFERENCES payment_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hp INTEGER,
  attack INTEGER,
  defense INTEGER,
  speed INTEGER,
  rarity TEXT,
  move_name TEXT,
  move_description TEXT,
  flavor_text TEXT,
  theme_colors JSONB, -- Store color palette
  image_data TEXT, -- Base64 image data (temporary, until IPFS)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for session lookups
CREATE INDEX idx_cards_session ON cards(payment_session_id);
CREATE INDEX idx_cards_created ON cards(created_at);

-- IPFS links table
-- Indexes all IPFS CIDs for generated content
CREATE TABLE ipfs_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  cid TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('raw_image', 'styled_card', 'html', 'metadata')),
  gateway_url TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for card lookups
CREATE INDEX idx_ipfs_links_card ON ipfs_links(card_id);
CREATE INDEX idx_ipfs_links_type ON ipfs_links(type);
CREATE INDEX idx_ipfs_links_cid ON ipfs_links(cid);

-- Minted NFTs table
CREATE TABLE mints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  payment_session_id UUID REFERENCES payment_sessions(id) ON DELETE SET NULL,
  minter_address TEXT NOT NULL,
  token_id INTEGER,
  metadata_uri TEXT NOT NULL,
  transaction_hash TEXT UNIQUE NOT NULL,
  contract_address TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'base',
  minted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for wallet and token lookups
CREATE INDEX idx_mints_minter ON mints(minter_address);
CREATE INDEX idx_mints_token ON mints(token_id);
CREATE INDEX idx_mints_card ON mints(card_id);
CREATE INDEX idx_mints_session ON mints(payment_session_id);

-- Analytics table (optional, for tracking metrics)
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  wallet_address TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);

-- View for active payment sessions
CREATE VIEW active_payment_sessions AS
SELECT
  ps.*,
  COUNT(c.id) as cards_generated
FROM payment_sessions ps
LEFT JOIN cards c ON ps.id = c.payment_session_id
WHERE ps.status = 'confirmed'
  AND ps.expires_at > NOW()
  AND ps.generations_remaining > 0
GROUP BY ps.id;

-- View for minting history
CREATE VIEW minting_history AS
SELECT
  m.id,
  m.minter_address,
  m.token_id,
  m.transaction_hash,
  m.minted_at,
  c.name as card_name,
  c.rarity,
  ps.amount_usdc as payment_amount
FROM mints m
LEFT JOIN cards c ON m.card_id = c.id
LEFT JOIN payment_sessions ps ON m.payment_session_id = ps.id
ORDER BY m.minted_at DESC;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM payment_sessions
  WHERE expires_at < NOW() - INTERVAL '24 hours'
    AND status != 'confirmed';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE payment_sessions IS 'Tracks USDC payments before card generation. Each session allows 3 generations (1 initial + 2 re-rolls)';
COMMENT ON TABLE cards IS 'Stores generated card data with all attributes and AI-generated content';
COMMENT ON TABLE ipfs_links IS 'Indexes all IPFS CIDs for images, metadata, and HTML files';
COMMENT ON TABLE mints IS 'Records all successful NFT mints on the blockchain';
COMMENT ON COLUMN payment_sessions.generations_remaining IS 'Number of generations left (starts at 3: 1 initial + 2 re-rolls)';
COMMENT ON COLUMN ipfs_links.type IS 'Type of IPFS content: raw_image (AI output), styled_card (rendered PNG), html (interactive card), metadata (NFT metadata JSON)';
