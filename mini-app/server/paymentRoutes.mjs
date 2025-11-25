// Payment tracking routes for USDC payments
import express from 'express';
import {
  paymentSessionService,
  cardService,
  analyticsService,
  isSupabaseConfigured
} from './supabaseClient.mjs';

const router = express.Router();

// Middleware to check Supabase configuration
const requireSupabase = (req, res, next) => {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error: 'Database not configured',
      message: 'Please configure Supabase in your .env file'
    });
  }
  next();
};

/**
 * POST /api/payment/initiate
 * Initiate a payment session (called after USDC transaction is submitted)
 */
router.post('/initiate', requireSupabase, async (req, res) => {
  try {
    const { walletAddress, transactionHash, amountUsdc } = req.body;

    if (!walletAddress || !transactionHash || !amountUsdc) {
      return res.status(400).json({
        error: 'Missing required fields: walletAddress, transactionHash, amountUsdc'
      });
    }

    // Create payment session
    const session = await paymentSessionService.createSession(
      walletAddress,
      amountUsdc,
      transactionHash
    );

    // Track analytics
    await analyticsService.trackEvent('payment_initiated', walletAddress, {
      amount: amountUsdc,
      transactionHash
    });

    res.json({
      success: true,
      sessionId: session.id,
      generationsRemaining: session.generations_remaining,
      expiresAt: session.expires_at
    });
  } catch (error) {
    console.error('Error initiating payment session:', error);

    // Handle duplicate transaction hash
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Payment already processed',
        message: 'This transaction has already been used to create a session'
      });
    }

    res.status(500).json({
      error: 'Failed to initiate payment session',
      message: error.message
    });
  }
});

/**
 * POST /api/payment/confirm
 * Confirm a payment after transaction is mined
 */
router.post('/confirm', requireSupabase, async (req, res) => {
  try {
    const { transactionHash } = req.body;

    if (!transactionHash) {
      return res.status(400).json({
        error: 'Missing required field: transactionHash'
      });
    }

    // Confirm the session
    const session = await paymentSessionService.confirmSession(transactionHash);

    // Track analytics
    await analyticsService.trackEvent('payment_confirmed', session.wallet_address, {
      sessionId: session.id,
      transactionHash
    });

    res.json({
      success: true,
      sessionId: session.id,
      generationsRemaining: session.generations_remaining,
      confirmedAt: session.confirmed_at
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      error: 'Failed to confirm payment',
      message: error.message
    });
  }
});

/**
 * GET /api/payment/session/:walletAddress
 * Get active payment session for a wallet
 */
router.get('/session/:walletAddress', requireSupabase, async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const session = await paymentSessionService.getActiveSession(walletAddress);

    if (!session) {
      return res.json({
        hasActiveSession: false,
        session: null
      });
    }

    // Get cards generated in this session
    const cards = await cardService.getSessionCards(session.id);

    res.json({
      hasActiveSession: true,
      session: {
        id: session.id,
        generationsRemaining: session.generations_remaining,
        generationsUsed: 3 - session.generations_remaining,
        amountPaid: session.amount_usdc,
        expiresAt: session.expires_at,
        createdAt: session.created_at,
        cardsGenerated: cards.length
      },
      cards: cards.map(card => ({
        id: card.id,
        name: card.name,
        rarity: card.rarity,
        createdAt: card.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching payment session:', error);
    res.status(500).json({
      error: 'Failed to fetch payment session',
      message: error.message
    });
  }
});

/**
 * POST /api/payment/use-generation
 * Use one generation from the session (called before each card generation)
 */
router.post('/use-generation', requireSupabase, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing required field: sessionId'
      });
    }

    // Check if session has generations remaining
    const session = await paymentSessionService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    if (session.status !== 'confirmed') {
      return res.status(400).json({
        error: 'Payment not confirmed',
        message: 'Please wait for payment confirmation before generating cards'
      });
    }

    if (session.generations_remaining <= 0) {
      return res.status(403).json({
        error: 'No generations remaining',
        message: 'You have used all 3 generations (1 initial + 2 re-rolls). Please make a new payment to generate more cards.',
        generationsRemaining: 0
      });
    }

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      return res.status(403).json({
        error: 'Session expired',
        message: 'Your payment session has expired. Please make a new payment.',
        expiredAt: session.expires_at
      });
    }

    // Decrement generations remaining
    const updatedSession = await paymentSessionService.useGeneration(sessionId);

    res.json({
      success: true,
      generationsRemaining: updatedSession.generations_remaining,
      generationsUsed: 3 - updatedSession.generations_remaining
    });
  } catch (error) {
    console.error('Error using generation:', error);
    res.status(500).json({
      error: 'Failed to use generation',
      message: error.message
    });
  }
});

/**
 * GET /api/payment/check-price
 * Get current USDC price for card generation
 */
router.get('/check-price', (req, res) => {
  res.json({
    priceUsdc: '2.50',
    currency: 'USDC',
    generationsIncluded: 3,
    description: 'Includes 1 initial generation + 2 re-rolls'
  });
});

export default router;
