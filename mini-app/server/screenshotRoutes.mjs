import express from 'express';
import {
  captureCardScreenshot,
  saveScreenshot,
  getCardScreenshots,
  getGalleryScreenshots,
  deleteScreenshot
} from './screenshotService.mjs';
import { cardService } from './supabaseClient.mjs';

const router = express.Router();

/**
 * POST /api/screenshots/capture
 * Capture a card screenshot and save to storage
 */
router.post('/capture', async (req, res) => {
  try {
    const { cardId, cardData, ownerAddress, mintId } = req.body;

    if (!ownerAddress) {
      return res.status(400).json({ error: 'ownerAddress is required' });
    }

    let card = cardData;

    // If cardId provided, fetch from database
    if (cardId && !cardData) {
      card = await cardService.getCard(cardId);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }
    }

    if (!card) {
      return res.status(400).json({ error: 'Either cardId or cardData is required' });
    }

    // Capture screenshot
    console.log('[Screenshot] Capturing card:', card.name || 'Untitled');
    const screenshotBuffer = await captureCardScreenshot(card);

    // Save to storage
    console.log('[Screenshot] Saving to storage...');
    const result = await saveScreenshot(
      screenshotBuffer,
      cardId || null,
      mintId || null,
      ownerAddress
    );

    console.log('[Screenshot] Saved successfully:', result.screenshotUrl);

    res.json({
      success: true,
      screenshotId: result.id,
      screenshotUrl: result.screenshotUrl,
      thumbnailUrl: result.thumbnailUrl
    });
  } catch (error) {
    console.error('[Screenshot] Capture error:', error);
    res.status(500).json({
      error: 'Failed to capture screenshot',
      details: error.message
    });
  }
});

/**
 * GET /api/screenshots/card/:cardId
 * Get all screenshots for a specific card
 */
router.get('/card/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;

    const screenshots = await getCardScreenshots(cardId);

    res.json({
      success: true,
      screenshots
    });
  } catch (error) {
    console.error('[Screenshot] Fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch screenshots',
      details: error.message
    });
  }
});

/**
 * GET /api/screenshots/gallery
 * Get screenshots for gallery/carousel display
 */
router.get('/gallery', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const screenshots = await getGalleryScreenshots(limit, offset);

    res.json({
      success: true,
      screenshots,
      pagination: {
        limit,
        offset,
        hasMore: screenshots.length === limit
      }
    });
  } catch (error) {
    console.error('[Screenshot] Gallery error:', error);
    res.status(500).json({
      error: 'Failed to fetch gallery',
      details: error.message
    });
  }
});

/**
 * DELETE /api/screenshots/:screenshotId
 * Delete a screenshot
 */
router.delete('/:screenshotId', async (req, res) => {
  try {
    const { screenshotId } = req.params;

    await deleteScreenshot(screenshotId);

    res.json({
      success: true,
      message: 'Screenshot deleted'
    });
  } catch (error) {
    console.error('[Screenshot] Delete error:', error);
    res.status(500).json({
      error: 'Failed to delete screenshot',
      details: error.message
    });
  }
});

export default router;
