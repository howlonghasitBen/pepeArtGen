-- Enable Row Level Security on all tables
-- This migration secures the entire database by enabling RLS
--
-- SECURITY MODEL:
-- - All database operations are performed server-side using the service role key
-- - Service role automatically bypasses RLS, so no policies are needed
-- - This prevents unauthorized client access even if anon key is exposed
-- - Anon key becomes effectively useless for direct database access
--
-- TABLES PROTECTED:
-- 1. payment_sessions - Payment tracking and session management
-- 2. cards - Generated card data
-- 3. ipfs_links - IPFS content references
-- 4. mints - NFT minting records
-- 5. analytics_events - Analytics tracking

-- Enable RLS on all tables
ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipfs_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- No policies needed - all operations are performed by server using service role
-- Service role automatically bypasses RLS, providing secure server-side-only access
-- This prevents unauthorized client access while maintaining full functionality
