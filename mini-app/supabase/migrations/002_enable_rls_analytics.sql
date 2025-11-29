-- Enable Row Level Security on analytics_events table
-- This migration ensures analytics data is protected by RLS policies
-- Server-side operations use the service role key which bypasses RLS

-- Enable RLS on analytics_events table
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- No policies needed - analytics are written exclusively by server using service role
-- Service role automatically bypasses RLS, providing secure server-side-only access
-- This prevents unauthorized client access while maintaining analytics functionality
