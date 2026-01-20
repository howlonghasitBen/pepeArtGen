-- Migration: 003_synced_nfts
-- Stores NFT metadata synced from OpenSea/IPFS for display
-- This captures NFTs that exist on-chain but weren't created through the app

CREATE TABLE IF NOT EXISTS synced_nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id INTEGER NOT NULL UNIQUE,
  contract_address TEXT NOT NULL,
  name TEXT,
  description TEXT,
  -- Original image URL from IPFS metadata (3:4 aspect ratio)
  image_url TEXT,
  -- OpenSea's cached image URL (may be square/resized)
  opensea_image_url TEXT,
  -- Full metadata from IPFS
  metadata JSONB,
  -- OpenSea API response data
  opensea_data JSONB,
  -- Sync tracking
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Link to internal card if it exists
  card_id UUID REFERENCES cards(id) ON DELETE SET NULL
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_synced_nfts_token ON synced_nfts(token_id);
CREATE INDEX IF NOT EXISTS idx_synced_nfts_contract ON synced_nfts(contract_address);
CREATE INDEX IF NOT EXISTS idx_synced_nfts_card ON synced_nfts(card_id);

-- Enable RLS
ALTER TABLE synced_nfts ENABLE ROW LEVEL SECURITY;

-- Allow public read access (NFTs are public data)
CREATE POLICY "Allow public read access to synced_nfts"
  ON synced_nfts
  FOR SELECT
  TO public
  USING (true);

-- Only service role can insert/update
CREATE POLICY "Allow service role to manage synced_nfts"
  ON synced_nfts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE synced_nfts IS 'Stores NFT metadata synced from OpenSea/IPFS. Used as cache for fast display without hitting external APIs.';
COMMENT ON COLUMN synced_nfts.image_url IS 'Original image URL from IPFS metadata - preserves 3:4 aspect ratio';
COMMENT ON COLUMN synced_nfts.opensea_image_url IS 'OpenSea CDN image URL - may be resized/cropped';
