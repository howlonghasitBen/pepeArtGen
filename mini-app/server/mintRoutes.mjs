// Mint recording routes for tracking NFT mints on-chain
import express from 'express';
import {
  mintService,
  cardService,
  analyticsService,
  isSupabaseConfigured,
} from './supabaseClient.mjs';
import { createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';

const router = express.Router();

// Get network configuration from env
const NETWORK = process.env.NETWORK || 'base';
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const NFT_CONTRACT_ADDRESS = process.env.VITE_NFT_CONTRACT_ADDRESS;

// Configure viem client for on-chain verification
const chain = NETWORK === 'baseSepolia' ? baseSepolia : base;
const publicClient = createPublicClient({
  chain,
  transport: http(BASE_RPC_URL),
});

// Middleware to check Supabase configuration
const requireSupabase = (req, res, next) => {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error: 'Database not configured',
      message: 'Please configure Supabase in your .env file',
    });
  }
  next();
};

// Middleware to check NFT contract is configured
const requireContract = (req, res, next) => {
  if (!NFT_CONTRACT_ADDRESS) {
    return res.status(503).json({
      error: 'NFT contract not configured',
      message: 'Please set VITE_NFT_CONTRACT_ADDRESS in your .env file',
    });
  }
  next();
};

/**
 * POST /api/mint/record
 * Record a successful NFT mint to the database
 *
 * Request body:
 * {
 *   cardIds: ["uuid1", "uuid2", ...],  // Array of card IDs that were minted
 *   transactionHash: "0x...",           // Transaction hash from blockchain
 *   minterAddress: "0x...",             // Address that minted the NFTs
 *   metadataURIs: ["ipfs://...", ...],  // Array of metadata URIs (same order as cardIds)
 *   tokenIds: [1, 2, ...],              // Optional: token IDs if known (from transaction receipt)
 *   verify: true                         // Optional: verify transaction on-chain (default: true)
 * }
 */
router.post('/record', requireSupabase, requireContract, async (req, res) => {
  try {
    const {
      cardIds,
      transactionHash,
      minterAddress,
      metadataURIs,
      tokenIds,
      verify = true,
    } = req.body;

    // Validation
    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'cardIds must be a non-empty array',
      });
    }

    if (!transactionHash || !transactionHash.startsWith('0x')) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Valid transaction hash required',
      });
    }

    if (!minterAddress || !minterAddress.startsWith('0x')) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Valid minter address required',
      });
    }

    if (!Array.isArray(metadataURIs) || metadataURIs.length !== cardIds.length) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'metadataURIs must match cardIds length',
      });
    }

    if (tokenIds && (!Array.isArray(tokenIds) || tokenIds.length !== cardIds.length)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'tokenIds must match cardIds length if provided',
      });
    }

    // Optional: Verify transaction on-chain
    let verifiedTokenIds = tokenIds;
    if (verify) {
      console.log('🔍 Verifying transaction on-chain:', transactionHash);

      try {
        const receipt = await publicClient.getTransactionReceipt({
          hash: transactionHash,
        });

        if (!receipt) {
          return res.status(400).json({
            error: 'Transaction not found',
            message: 'Transaction has not been confirmed on-chain yet',
          });
        }

        if (receipt.status !== 'success') {
          return res.status(400).json({
            error: 'Transaction failed',
            message: 'Transaction was reverted on-chain',
          });
        }

        // Verify contract address matches
        const txContractAddress = receipt.to?.toLowerCase();
        const expectedContractAddress = NFT_CONTRACT_ADDRESS.toLowerCase();

        if (txContractAddress !== expectedContractAddress) {
          return res.status(400).json({
            error: 'Invalid transaction',
            message: `Transaction is not for the NFT contract. Expected ${expectedContractAddress}, got ${txContractAddress}`,
          });
        }

        // Extract token IDs from CardMinted events if not provided
        if (!verifiedTokenIds) {
          // CardMinted event signature: CardMinted(address indexed minter, uint256 indexed tokenId, string tokenURI)
          const CARD_MINTED_EVENT_SIGNATURE = '0x1f4db890a2c0e446ac04764c1688d824b1be6e8d29d8ec9df0f3f64b3d6f48e0'; // keccak256("CardMinted(address,uint256,string)")

          const mintEvents = receipt.logs.filter(
            (log) => log.topics[0] === CARD_MINTED_EVENT_SIGNATURE
          );

          if (mintEvents.length !== cardIds.length) {
            console.warn(`⚠️  Expected ${cardIds.length} CardMinted events, found ${mintEvents.length}`);
          }

          verifiedTokenIds = mintEvents.map((log) => {
            // Token ID is the second indexed parameter (topics[2])
            return parseInt(log.topics[2], 16);
          });

          console.log('✅ Extracted token IDs from events:', verifiedTokenIds);
        }

        console.log('✅ Transaction verified on-chain');
      } catch (verifyError) {
        console.error('❌ On-chain verification failed:', verifyError);

        // If verification fails, we still record the mint but log the error
        // This allows for manual verification later
        console.warn('⚠️  Proceeding with mint recording despite verification failure');
      }
    }

    // Get payment session IDs from cards
    const cards = await Promise.all(
      cardIds.map(async (cardId) => {
        try {
          return await cardService.getCard(cardId);
        } catch (err) {
          console.error(`Failed to fetch card ${cardId}:`, err);
          return null;
        }
      })
    );

    // Record each mint
    const recordedMints = [];
    const errors = [];

    for (let i = 0; i < cardIds.length; i++) {
      const cardId = cardIds[i];
      const card = cards[i];
      const metadataUri = metadataURIs[i];
      const tokenId = verifiedTokenIds ? verifiedTokenIds[i] : null;

      if (!card) {
        errors.push({
          cardId,
          error: 'Card not found in database',
        });
        continue;
      }

      try {
        const mint = await mintService.recordMint(
          cardId,
          card.payment_session_id,
          minterAddress.toLowerCase(),
          tokenId,
          metadataUri,
          transactionHash,
          NFT_CONTRACT_ADDRESS.toLowerCase(),
          NETWORK
        );

        recordedMints.push(mint);
        console.log(`✅ Recorded mint for card ${cardId}, token ID ${tokenId}`);
      } catch (err) {
        console.error(`Failed to record mint for card ${cardId}:`, err);
        errors.push({
          cardId,
          error: err.message,
        });
      }
    }

    // Track analytics
    await analyticsService.trackEvent('nft_minted', minterAddress, {
      transaction_hash: transactionHash,
      card_count: recordedMints.length,
      token_ids: verifiedTokenIds,
      network: NETWORK,
    });

    // Return results
    if (recordedMints.length === 0) {
      return res.status(500).json({
        error: 'Failed to record mints',
        message: 'All mint recordings failed',
        errors,
      });
    }

    if (errors.length > 0) {
      return res.status(207).json({
        message: 'Partial success - some mints failed to record',
        mints: recordedMints,
        errors,
      });
    }

    res.json({
      message: `Successfully recorded ${recordedMints.length} mint(s)`,
      mints: recordedMints,
      transactionHash,
      tokenIds: verifiedTokenIds,
    });
  } catch (error) {
    console.error('❌ Mint recording error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/mint/wallet/:address
 * Get all mints for a wallet address
 */
router.get('/wallet/:address', requireSupabase, async (req, res) => {
  try {
    const { address } = req.params;

    if (!address || !address.startsWith('0x')) {
      return res.status(400).json({
        error: 'Invalid address',
        message: 'Valid wallet address required',
      });
    }

    const mints = await mintService.getWalletMints(address.toLowerCase());

    res.json({
      address: address.toLowerCase(),
      count: mints.length,
      mints,
    });
  } catch (error) {
    console.error('❌ Error fetching wallet mints:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/mint/verify/:transactionHash
 * Verify a mint transaction and extract token IDs
 * Useful for debugging or manual verification
 */
router.get('/verify/:transactionHash', requireContract, async (req, res) => {
  try {
    const { transactionHash } = req.params;

    if (!transactionHash || !transactionHash.startsWith('0x')) {
      return res.status(400).json({
        error: 'Invalid transaction hash',
      });
    }

    const receipt = await publicClient.getTransactionReceipt({
      hash: transactionHash,
    });

    if (!receipt) {
      return res.status(404).json({
        error: 'Transaction not found',
        message: 'Transaction has not been confirmed yet',
      });
    }

    // Extract CardMinted events
    const CARD_MINTED_EVENT_SIGNATURE = '0x1f4db890a2c0e446ac04764c1688d824b1be6e8d29d8ec9df0f3f64b3d6f48e0';

    const mintEvents = receipt.logs.filter(
      (log) => log.topics[0] === CARD_MINTED_EVENT_SIGNATURE
    );

    const tokenIds = mintEvents.map((log) => parseInt(log.topics[2], 16));
    const minterAddress = mintEvents.length > 0 ? `0x${mintEvents[0].topics[1].slice(26)}` : null;

    res.json({
      transactionHash,
      status: receipt.status,
      contractAddress: receipt.to,
      blockNumber: receipt.blockNumber.toString(),
      minterAddress,
      tokenIds,
      eventCount: mintEvents.length,
    });
  } catch (error) {
    console.error('❌ Verification error:', error);
    res.status(500).json({
      error: 'Verification failed',
      message: error.message,
    });
  }
});

export default router;
