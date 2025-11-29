import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase credentials not found in .env file');
  console.warn('⚠️  Please add SUPABASE_URL and SUPABASE_ANON_KEY to your .env file');
  console.warn('⚠️  Running without persistent storage - data will be lost on server restart');
}

if (!supabaseServiceRoleKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not found in .env file');
  console.warn('⚠️  All database operations will be disabled due to RLS policies');
  console.warn('⚠️  Get your service role key from: https://app.supabase.com/project/_/settings/api');
}

// Create Supabase client with anon key (legacy - kept for reference)
// NOTE: With RLS enabled on all tables, this client cannot access any data
// All operations must use the service role client below
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Create service role client for ALL server-side database operations
// SECURITY: Service role bypasses RLS, enabling secure server-only database access
// This is the PRIMARY client used by all database services
// IMPORTANT: Never expose this client or key to the frontend
const supabaseServiceRole = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseServiceRole !== null;
};

// Payment session helpers
export const paymentSessionService = {
  // Create a new payment session
  async createSession(walletAddress, amountUsdc, transactionHash) {
    if (!supabaseServiceRole) throw new Error('Supabase not configured');

    const { data, error } = await supabaseServiceRole
      .from('payment_sessions')
      .insert({
        wallet_address: walletAddress,
        amount_usdc: amountUsdc,
        transaction_hash: transactionHash,
        status: 'pending',
        generations_remaining: 3 // 1 initial + 2 re-rolls
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Confirm payment session
  async confirmSession(transactionHash) {
    if (!supabaseServiceRole) throw new Error('Supabase not configured');

    const { data, error } = await supabaseServiceRole
      .from('payment_sessions')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('transaction_hash', transactionHash)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get active session for wallet
  async getActiveSession(walletAddress) {
    if (!supabaseServiceRole) throw new Error('Supabase not configured');

    const { data, error } = await supabaseServiceRole
      .from('payment_sessions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('status', 'confirmed')
      .gt('generations_remaining', 0)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data || null;
  },

  // Decrement generations remaining
  async useGeneration(sessionId) {
    if (!supabaseServiceRole) throw new Error('Supabase not configured');

    const { data, error } = await supabaseServiceRole
      .rpc('decrement_generations', { session_id: sessionId });

    if (error) {
      // Fallback if RPC not available
      const { data: session } = await supabaseServiceRole
        .from('payment_sessions')
        .select('generations_remaining')
        .eq('id', sessionId)
        .single();

      if (session && session.generations_remaining > 0) {
        const { data, error } = await supabaseServiceRole
          .from('payment_sessions')
          .update({
            generations_remaining: session.generations_remaining - 1
          })
          .eq('id', sessionId)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    }

    return data;
  },

  // Get session by ID
  async getSession(sessionId) {
    if (!supabaseServiceRole) throw new Error('Supabase not configured');

    const { data, error } = await supabaseServiceRole
      .from('payment_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return data;
  }
};

// Card helpers
export const cardService = {
  // Create a new card
  async createCard(sessionId, cardData) {
    if (!supabaseServiceRole) throw new Error('Supabase not configured');

    const { data, error } = await supabaseServiceRole
      .from('cards')
      .insert({
        payment_session_id: sessionId,
        name: cardData.name,
        hp: cardData.stats?.hp,
        attack: cardData.stats?.attack,
        defense: cardData.stats?.defense,
        speed: cardData.stats?.speed,
        rarity: cardData.stats?.rarity,
        move_name: cardData.move?.name,
        move_description: cardData.move?.description,
        flavor_text: cardData.flavorText,
        theme_colors: cardData.themeColors,
        image_data: cardData.imageData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get card by ID
  async getCard(cardId) {
    if (!supabaseServiceRole) throw new Error('Supabase not configured');

    const { data, error } = await supabaseServiceRole
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (error) throw error;
    return data;
  },

  // Get all cards for a session
  async getSessionCards(sessionId) {
    if (!supabaseServiceRole) throw new Error('Supabase not configured');

    const { data, error } = await supabaseServiceRole
      .from('cards')
      .select('*')
      .eq('payment_session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

// IPFS links helpers
export const ipfsService = {
  // Add IPFS link
  async addLink(cardId, cid, type, gatewayUrl, fileSize = null) {
    if (!supabaseServiceRole) throw new Error('Supabase not configured');

    const { data, error } = await supabaseServiceRole
      .from('ipfs_links')
      .insert({
        card_id: cardId,
        cid,
        type,
        gateway_url: gatewayUrl,
        file_size: fileSize
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all links for a card
  async getCardLinks(cardId) {
    if (!supabaseServiceRole) throw new Error('Supabase not configured');

    const { data, error } = await supabaseServiceRole
      .from('ipfs_links')
      .select('*')
      .eq('card_id', cardId);

    if (error) throw error;
    return data;
  },

  // Get link by CID
  async getLinkByCid(cid) {
    if (!supabaseServiceRole) throw new Error('Supabase not configured');

    const { data, error } = await supabaseServiceRole
      .from('ipfs_links')
      .select('*')
      .eq('cid', cid)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }
};

// Mint helpers
export const mintService = {
  // Record a mint
  async recordMint(cardId, sessionId, minterAddress, tokenId, metadataUri, transactionHash, contractAddress, network = 'base') {
    if (!supabaseServiceRole) throw new Error('Supabase not configured');

    const { data, error } = await supabaseServiceRole
      .from('mints')
      .insert({
        card_id: cardId,
        payment_session_id: sessionId,
        minter_address: minterAddress,
        token_id: tokenId,
        metadata_uri: metadataUri,
        transaction_hash: transactionHash,
        contract_address: contractAddress,
        network
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get mints for a wallet
  async getWalletMints(walletAddress) {
    if (!supabaseServiceRole) throw new Error('Supabase not configured');

    const { data, error } = await supabaseServiceRole
      .from('mints')
      .select('*')
      .eq('minter_address', walletAddress)
      .order('minted_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

// Analytics helpers
export const analyticsService = {
  // Track an event
  // Uses service role client to bypass RLS policies on analytics_events table
  async trackEvent(eventType, walletAddress = null, metadata = {}) {
    if (!supabaseServiceRole) return; // Silently skip if not configured

    try {
      await supabaseServiceRole
        .from('analytics_events')
        .insert({
          event_type: eventType,
          wallet_address: walletAddress,
          metadata
        });
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }
};

export default supabase;
