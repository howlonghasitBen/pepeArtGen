// Payment tracking routes for USDC payments with on-chain verification
import express from 'express';
import {
  paymentSessionService,
  cardService,
  analyticsService,
  isSupabaseConfigured,
  supabase
} from './supabaseClient.mjs';
import { verifyPayment, isTransactionUsed, waitForConfirmation } from './verifyPayment.mjs';

const router = express.Router();

// Get treasury address from env
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || process.env.VITE_TREASURY_ADDRESS;
const NETWORK = process.env.NETWORK || 'base'; // 'base' or 'baseSepolia'

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

// Middleware to check treasury is configured
const requireTreasury = (req, res, next) => {
  if (!TREASURY_ADDRESS) {
    return res.status(503).json({
      error: 'Treasury not configured',
      message: 'Please set TREASURY_ADDRESS in your .env file'
    });
  }
  next();
};

/**
 * POST /api/payment/initiate
 * Initiate a payment session (called after USDC transaction is submitted)
 * Now includes on-chain verification
 */
router.post('/initiate', requireSupabase, requireTreasury, async (req, res) => {
  try {
    const { walletAddress, transactionHash, amountUsdc } = req.body;

    if (!walletAddress || !transactionHash || !amountUsdc) {
      return res.status(400).json({
        error: 'Missing required fields: walletAddress, transactionHash, amountUsdc'
      });
    }

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      return res.status(400).json({
        error: 'Invalid transaction hash format'
      });
    }

    // Check if transaction hash already used (prevent replay)
    const alreadyUsed = await isTransactionUsed(transactionHash, supabase);
    if (alreadyUsed) {
      return res.status(409).json({
        error: 'Transaction already used',
        message: 'This transaction has already been used to create a session'
      });
    }

    // Create pending session first (will verify async)
    const session = await paymentSessionService.createSession(
      walletAddress,
      amountUsdc,
      transactionHash
    );

    // Track analytics
    await analyticsService.trackEvent('payment_initiated', walletAddress, {
      amount: amountUsdc,
      transactionHash,
      network: NETWORK
    });

    res.json({
      success: true,
      sessionId: session.id,
      status: 'pending',
      message: 'Payment session created. Awaiting on-chain verification.',
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
 * POST /api/payment/verify
 * Verify a payment on-chain and confirm the session
 */
router.post('/verify', requireSupabase, requireTreasury, async (req, res) => {
  try {
    const { transactionHash, walletAddress } = req.body;

    if (!transactionHash) {
      return res.status(400).json({
        error: 'Missing required field: transactionHash'
      });
    }

    console.log(`\n💰 Verifying payment: ${transactionHash}`);

    // 1. Wait for transaction to be mined (if needed)
    const { confirmed, receipt, error: confirmError } = await waitForConfirmation(
      transactionHash,
      NETWORK,
      90 // Max 90 attempts (180 seconds = 3 minutes)
    );

    if (!confirmed) {
      return res.status(400).json({
        error: 'Transaction not confirmed',
        message: confirmError || 'Transaction not found on-chain after waiting'
      });
    }

    // 2. Verify the payment details on-chain (reuse receipt from waitForConfirmation)
    const verification = await verifyPayment(
      transactionHash,
      walletAddress,
      TREASURY_ADDRESS,
      NETWORK,
      receipt // Pass the receipt we already fetched
    );

    if (!verification.valid) {
      console.log(`   ❌ Verification failed: ${verification.error}`);
      
      // Mark session as failed if it exists
      if (supabase) {
        await supabase
          .from('payment_sessions')
          .update({ status: 'failed' })
          .eq('transaction_hash', transactionHash);
      }

      return res.status(400).json({
        error: 'Payment verification failed',
        message: verification.error
      });
    }

    // 3. Confirm the session
    const session = await paymentSessionService.confirmSession(transactionHash);

    // 4. Track analytics
    await analyticsService.trackEvent('payment_verified', session.wallet_address, {
      sessionId: session.id,
      transactionHash,
      amount: verification.details.amount,
      blockNumber: verification.details.blockNumber
    });

    console.log(`   ✅ Payment verified and session confirmed!`);

    res.json({
      success: true,
      sessionId: session.id,
      status: 'confirmed',
      generationsRemaining: session.generations_remaining,
      confirmedAt: session.confirmed_at,
      verification: {
        amount: verification.details.amount,
        blockNumber: verification.details.blockNumber
      }
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      error: 'Failed to verify payment',
      message: error.message
    });
  }
});

/**
 * POST /api/payment/confirm
 * Legacy endpoint - now calls verify internally
 * Kept for backwards compatibility
 */
router.post('/confirm', requireSupabase, requireTreasury, async (req, res) => {
  try {
    const { transactionHash, walletAddress } = req.body;

    if (!transactionHash) {
      return res.status(400).json({
        error: 'Missing required field: transactionHash'
      });
    }

    // Get the session to find wallet address if not provided
    let senderWallet = walletAddress;
    if (!senderWallet && supabase) {
      const { data: session } = await supabase
        .from('payment_sessions')
        .select('wallet_address')
        .eq('transaction_hash', transactionHash)
        .single();
      
      senderWallet = session?.wallet_address;
    }

    if (!senderWallet) {
      return res.status(400).json({
        error: 'Could not determine wallet address for verification'
      });
    }

    // Verify payment on-chain
    console.log(`\n💰 Confirming payment: ${transactionHash}`);
    
    const verification = await verifyPayment(
      transactionHash,
      senderWallet,
      TREASURY_ADDRESS,
      NETWORK
    );

    if (!verification.valid) {
      console.log(`   ❌ Verification failed: ${verification.error}`);
      return res.status(400).json({
        error: 'Payment verification failed',
        message: verification.error
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
        message: 'You have used all 3 generations (1 initial + 2 re-rolls). Please make a new payment.',
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
    network: NETWORK,
    treasuryConfigured: !!TREASURY_ADDRESS,
    generationsIncluded: 3,
    description: 'Includes 1 initial generation + 2 re-rolls'
  });
});

/**
 * GET /api/payment/status/:transactionHash
 * Check the status of a specific transaction/session
 */
router.get('/status/:transactionHash', requireSupabase, async (req, res) => {
  try {
    const { transactionHash } = req.params;

    const { data: session, error } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('transaction_hash', transactionHash)
      .single();

    if (error || !session) {
      return res.status(404).json({
        error: 'Session not found',
        transactionHash
      });
    }

    res.json({
      transactionHash,
      status: session.status,
      walletAddress: session.wallet_address,
      amountUsdc: session.amount_usdc,
      generationsRemaining: session.generations_remaining,
      createdAt: session.created_at,
      confirmedAt: session.confirmed_at,
      expiresAt: session.expires_at
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({
      error: 'Failed to check payment status',
      message: error.message
    });
  }
});

/**
 * POST /api/payment/retry-verify
 * Manually retry verification for a pending session
 * Useful if initial verification timed out but tx did confirm
 */
router.post('/retry-verify', requireTreasury, async (req, res) => {
  try {
    const { transactionHash, walletAddress } = req.body;

    if (!transactionHash || !walletAddress) {
      return res.status(400).json({
        error: 'Missing required fields: transactionHash, walletAddress'
      });
    }

    console.log(`\n🔄 Retrying verification for: ${transactionHash}`);
    console.log(`   Network: ${NETWORK}`);
    console.log(`   Treasury: ${TREASURY_ADDRESS}`);

    // Verify payment on-chain (no waiting, tx should be mined by now)
    const verification = await verifyPayment(
      transactionHash,
      walletAddress,
      TREASURY_ADDRESS,
      NETWORK
    );

    if (!verification.valid) {
      console.log(`   ❌ Verification failed: ${verification.error}`);
      return res.status(400).json({
        error: 'Payment verification failed',
        message: verification.error
      });
    }

    console.log(`   ✅ Payment verified on-chain!`);

    // Check if session exists in Supabase
    if (isSupabaseConfigured()) {
      const { data: existingSession } = await supabase
        .from('payment_sessions')
        .select('*')
        .eq('transaction_hash', transactionHash)
        .single();

      if (existingSession) {
        // Update existing session to confirmed
        if (existingSession.status !== 'confirmed') {
          await supabase
            .from('payment_sessions')
            .update({
              status: 'confirmed',
              confirmed_at: new Date().toISOString()
            })
            .eq('transaction_hash', transactionHash);
        }

        return res.json({
          success: true,
          sessionId: existingSession.id,
          status: 'confirmed',
          generationsRemaining: existingSession.generations_remaining,
          verification: verification.details,
          message: 'Existing session confirmed'
        });
      }

      // Create new confirmed session
      const { data: newSession, error } = await supabase
        .from('payment_sessions')
        .insert({
          wallet_address: walletAddress,
          amount_usdc: verification.details.amount,
          transaction_hash: transactionHash,
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          generations_remaining: 3
        })
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        sessionId: newSession.id,
        status: 'confirmed',
        generationsRemaining: 3,
        verification: verification.details,
        message: 'New session created and confirmed'
      });
    }

    res.json({
      success: true,
      status: 'verified',
      verification: verification.details,
      message: 'Payment verified (no database configured)'
    });

  } catch (error) {
    console.error('Error retrying verification:', error);
    res.status(500).json({
      error: 'Failed to retry verification',
      message: error.message
    });
  }
});

export default router;
