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

const MAX_DECK_SIZE = 30;

/**
 * POST /api/decks
 * Create a new deck
 */
router.post('/', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { ownerAddress, name, description } = req.body;

    if (!ownerAddress) {
      return res.status(400).json({ error: 'ownerAddress is required' });
    }

    const { data, error } = await supabase
      .from('decks')
      .insert({
        owner_address: ownerAddress,
        name: name || 'New Deck',
        description: description || null,
        card_ids: []
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error('[Decks] Create error:', error);
    res.status(500).json({
      error: 'Failed to create deck',
      details: error.message
    });
  }
});

/**
 * GET /api/decks
 * Get decks for a wallet
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
      .from('decks')
      .select('*')
      .eq('owner_address', owner)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('[Decks] List error:', error);
    res.status(500).json({
      error: 'Failed to fetch decks',
      details: error.message
    });
  }
});

/**
 * GET /api/decks/:id
 * Get a specific deck
 */
router.get('/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { id } = req.params;

    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Deck not found' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('[Decks] Get error:', error);
    res.status(500).json({
      error: 'Failed to fetch deck',
      details: error.message
    });
  }
});

/**
 * PUT /api/decks/:id
 * Update a deck
 */
router.put('/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { id } = req.params;
    const { name, description, cardIds, ownerAddress } = req.body;

    // Verify ownership
    const { data: existing } = await supabase
      .from('decks')
      .select('owner_address')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    if (existing.owner_address !== ownerAddress) {
      return res.status(403).json({ error: 'Not authorized to edit this deck' });
    }

    // Validate deck size
    if (cardIds && cardIds.length > MAX_DECK_SIZE) {
      return res.status(400).json({
        error: `Deck cannot exceed ${MAX_DECK_SIZE} cards`
      });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (cardIds !== undefined) {
      updates.card_ids = cardIds;
      updates.is_complete = cardIds.length >= MAX_DECK_SIZE;
    }

    const { data, error } = await supabase
      .from('decks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error('[Decks] Update error:', error);
    res.status(500).json({
      error: 'Failed to update deck',
      details: error.message
    });
  }
});

/**
 * DELETE /api/decks/:id
 * Delete a deck
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
      .from('decks')
      .select('owner_address')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    if (existing.owner_address !== ownerAddress) {
      return res.status(403).json({ error: 'Not authorized to delete this deck' });
    }

    const { error } = await supabase
      .from('decks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Deck deleted'
    });
  } catch (error) {
    console.error('[Decks] Delete error:', error);
    res.status(500).json({
      error: 'Failed to delete deck',
      details: error.message
    });
  }
});

/**
 * POST /api/decks/:id/cards
 * Add a card to a deck
 */
router.post('/:id/cards', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { id } = req.params;
    const { cardId, ownerAddress } = req.body;

    if (!cardId) {
      return res.status(400).json({ error: 'cardId is required' });
    }

    // Get current deck
    const { data: deck } = await supabase
      .from('decks')
      .select('*')
      .eq('id', id)
      .single();

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    if (deck.owner_address !== ownerAddress) {
      return res.status(403).json({ error: 'Not authorized to modify this deck' });
    }

    const currentCards = deck.card_ids || [];

    if (currentCards.length >= MAX_DECK_SIZE) {
      return res.status(400).json({
        error: `Deck is full (${MAX_DECK_SIZE} cards max)`
      });
    }

    const { data, error } = await supabase
      .from('decks')
      .update({
        card_ids: [...currentCards, cardId],
        is_complete: currentCards.length + 1 >= MAX_DECK_SIZE
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
    console.error('[Decks] Add card error:', error);
    res.status(500).json({
      error: 'Failed to add card to deck',
      details: error.message
    });
  }
});

/**
 * DELETE /api/decks/:id/cards/:index
 * Remove a card from a deck by index
 */
router.delete('/:id/cards/:index', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { id, index } = req.params;
    const ownerAddress = req.query.owner;
    const cardIndex = parseInt(index);

    // Get current deck
    const { data: deck } = await supabase
      .from('decks')
      .select('*')
      .eq('id', id)
      .single();

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    if (deck.owner_address !== ownerAddress) {
      return res.status(403).json({ error: 'Not authorized to modify this deck' });
    }

    const currentCards = deck.card_ids || [];

    if (cardIndex < 0 || cardIndex >= currentCards.length) {
      return res.status(400).json({ error: 'Invalid card index' });
    }

    const newCards = [...currentCards];
    newCards.splice(cardIndex, 1);

    const { data, error } = await supabase
      .from('decks')
      .update({
        card_ids: newCards,
        is_complete: false
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
    console.error('[Decks] Remove card error:', error);
    res.status(500).json({
      error: 'Failed to remove card from deck',
      details: error.message
    });
  }
});

export default router;
