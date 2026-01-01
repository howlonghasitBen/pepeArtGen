import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

/**
 * POST /api/drafts
 * Create a new card draft
 */
router.post('/', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { ownerAddress, name, cardData, sourceCardId } = req.body;

    if (!ownerAddress) {
      return res.status(400).json({ error: 'ownerAddress is required' });
    }

    const { data, error } = await supabase
      .from('card_drafts')
      .insert({
        owner_address: ownerAddress,
        name: name || 'Untitled Card',
        card_data: cardData || {},
        source_card_id: sourceCardId || null
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      id: data.id,
      ...data
    });
  } catch (error) {
    console.error('[Drafts] Create error:', error);
    res.status(500).json({
      error: 'Failed to create draft',
      details: error.message
    });
  }
});

/**
 * PUT /api/drafts
 * Update an existing draft
 */
router.put('/', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { id, ownerAddress, name, cardData } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('card_drafts')
      .select('owner_address, is_locked')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    if (existing.owner_address !== ownerAddress) {
      return res.status(403).json({ error: 'Not authorized to edit this draft' });
    }

    if (existing.is_locked) {
      return res.status(400).json({ error: 'Draft is locked and cannot be edited' });
    }

    const { data, error } = await supabase
      .from('card_drafts')
      .update({
        name: name,
        card_data: cardData,
        version: existing.version + 1
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error('[Drafts] Update error:', error);
    res.status(500).json({
      error: 'Failed to update draft',
      details: error.message
    });
  }
});

/**
 * GET /api/drafts
 * Get drafts for a wallet
 */
router.get('/', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { owner } = req.query;

    if (!owner) {
      return res.status(400).json({ error: 'owner query param is required' });
    }

    const { data, error } = await supabase
      .from('card_drafts')
      .select('id, name, card_data, version, is_locked, created_at, updated_at')
      .eq('owner_address', owner)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('[Drafts] List error:', error);
    res.status(500).json({
      error: 'Failed to fetch drafts',
      details: error.message
    });
  }
});

/**
 * GET /api/drafts/:id
 * Get a specific draft
 */
router.get('/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { id } = req.params;

    const { data, error } = await supabase
      .from('card_drafts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Draft not found' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('[Drafts] Get error:', error);
    res.status(500).json({
      error: 'Failed to fetch draft',
      details: error.message
    });
  }
});

/**
 * DELETE /api/drafts/:id
 * Delete a draft
 */
router.delete('/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { id } = req.params;
    const ownerAddress = req.query.owner;

    if (!ownerAddress) {
      return res.status(400).json({ error: 'owner query param is required' });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('card_drafts')
      .select('owner_address')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    if (existing.owner_address !== ownerAddress) {
      return res.status(403).json({ error: 'Not authorized to delete this draft' });
    }

    const { error } = await supabase
      .from('card_drafts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Draft deleted'
    });
  } catch (error) {
    console.error('[Drafts] Delete error:', error);
    res.status(500).json({
      error: 'Failed to delete draft',
      details: error.message
    });
  }
});

export default router;
