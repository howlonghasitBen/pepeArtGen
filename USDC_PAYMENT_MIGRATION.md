# USDC Payment & Supabase Integration Migration

## Overview

This migration implements a complete payment-first flow with USDC on Base L2, replacing the previous free-tier generation with ETH minting system. Users pay $2.50 USDC upfront for generation credits (1 initial + 2 re-rolls), then mint their favorite cards to NFTs **for FREE** (only gas fees ~$0.01).

## Key Changes Summary

### 💰 Payment Flow (NEW)
- **Before:** Free generation (100/day limit) → Mint with 0.001 ETH
- **After:** Pay $2.50 USDC → Generate card → Re-roll up to 2x → Mint for FREE (only gas)

### 🗄️ Database Integration (NEW)
- **Before:** In-memory storage (lost on restart)
- **After:** Persistent Supabase database with full IPFS indexing

### 🪙 Smart Contract Changes
- **Before:** `WavesTCGNFT.sol` (ETH-based, 0.001 ETH per mint)
- **After:** `PepeCardNFT.sol` (FREE minting - only gas fees ~$0.01)

## Implementation Details

### 1. Supabase Integration

#### Schema Tables Created:
- **`payment_sessions`** - Tracks USDC payments and generation credits
- **`cards`** - Stores all generated card data
- **`ipfs_links`** - Indexes all IPFS CIDs
- **`mints`** - Records successful NFT mints
- **`analytics_events`** - Tracks user analytics

#### Configuration Required:
Add to `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Get credentials from: https://app.supabase.com/project/_/settings/api

#### Migrations:
Run the SQL migration:
```bash
psql $SUPABASE_URL < mini-app/supabase/migrations/001_initial_schema.sql
```

### 2. Smart Contract (FREE Minting)

#### New Contract: `PepeCardNFT.sol`

**Features:**
- **FREE minting** - no USDC or ETH required
- Users only pay gas fees (~$0.01 on Base)
- Simplified ERC721 implementation
- Batch minting support

**Payment Model:**
- Users pay $2.50 USDC to **backend/treasury** for AI generation service
- Minting to blockchain is **FREE** (only gas costs)
- This prevents spam while keeping minting accessible

#### Deployment:
```bash
# Deploy to Base Sepolia (testnet)
forge script script/DeployPepeCardNFT.s.sol:DeployPepeCardNFT \
  --rpc-url base_sepolia \
  --broadcast \
  --verify

# Deploy to Base Mainnet (production)
forge script script/DeployPepeCardNFT.s.sol:DeployPepeCardNFT \
  --rpc-url base \
  --broadcast \
  --verify \
  --slow
```

Update `.env` with deployed address:
```env
VITE_NFT_CONTRACT_ADDRESS=0x_your_deployed_contract_address
# Note: Minting is FREE - only gas fees apply
```

### 3. Backend API Changes

#### New Payment Endpoints:

**POST `/api/payment/initiate`**
Create payment session after USDC transfer
```json
{
  "walletAddress": "0x...",
  "transactionHash": "0x...",
  "amountUsdc": "2.50"
}
```

**POST `/api/payment/confirm`**
Confirm payment after transaction mines
```json
{
  "transactionHash": "0x..."
}
```

**GET `/api/payment/session/:walletAddress`**
Get active payment session for wallet

**GET `/api/payment/check-price`**
Get current pricing information

#### Modified `/api/generate` Endpoint:

Now requires payment session:
```json
{
  "monsterNames": ["Shadow Dragon"],
  "sessionId": "uuid-here",
  "walletAddress": "0x..."
}
```

Returns error if no valid session or generations exhausted.

### 4. Frontend Components

#### New Components:

**`PaymentModal.jsx`**
- Shows before first generation
- Handles USDC payment flow
- Checks for existing active sessions
- Displays balance and pricing

**`useGenerationPayment.js` Hook**
- Manages USDC transfers for generation
- Creates payment sessions
- Checks active sessions
- Tracks generation credits

#### Updated Components:

**`GeneratorScreen.jsx`**
- Removed batch mode (single card only)
- Added re-roll button (max 2 re-rolls)
- Shows active session status
- Triggers payment modal when needed

**`useMintCard.js` Hook**
- Now uses USDC instead of ETH
- Implements ERC-20 approval flow
- Checks USDC allowance
- Auto-approves if needed

**`MintingModal.jsx` & `CurationScreen.jsx`**
- Updated pricing: 2.50 USDC per card
- Shows total cost correctly

### 5. User Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  1. USER CONNECTS WALLET                                │
│     ↓                                                    │
│  2. CHECKS FOR ACTIVE SESSION                           │
│     ├─ Has Session? → Skip payment                      │
│     └─ No Session? → Show PaymentModal                  │
│                                                          │
│  3. PAYMENT FLOW (if no session)                        │
│     ├─ User pays 2.50 USDC to treasury                  │
│     ├─ Backend creates payment session                  │
│     └─ Session grants 3 generations                     │
│                                                          │
│  4. GENERATION PHASE                                    │
│     ├─ User enters monster name                         │
│     ├─ Click "Generate Card" (uses 1 credit)            │
│     ├─ AI generates card (~10-15 seconds)               │
│     └─ Card displayed for review                        │
│                                                          │
│  5. CURATION PHASE                                      │
│     ├─ Happy with card? → Proceed to mint               │
│     ├─ Not happy? → Click "Re-roll" (2 max)             │
│     │   └─ Uses another generation credit                │
│     └─ Out of re-rolls? → Must mint or pay again        │
│                                                          │
│  6. MINTING PHASE                                       │
│     ├─ User selects cards to mint (swipe right)         │
│     ├─ Upload card to IPFS (metadata + images)          │
│     ├─ Call mintCard() - FREE (only gas ~$0.01)         │
│     └─ NFT minted on Base L2!                           │
└─────────────────────────────────────────────────────────┘
```

## Environment Variables

### Required for Backend:
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# USDC & Contract Addresses
USDC_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
TREASURY_ADDRESS=0x_your_treasury_address

# AI Services
GOOGLE_GENERATIVE_AI_API_KEY=your_key
API_KEY=your_key

# IPFS
PINATA_JWT=your_pinata_jwt
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

### Required for Frontend:
```env
# Contract Addresses
VITE_NFT_CONTRACT_ADDRESS=0x_deployed_pepe_card_nft_address
VITE_USDC_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
VITE_TREASURY_ADDRESS=0x_your_treasury_address

# Pricing
VITE_MINT_PRICE=2.50
```

## Testing Checklist

### Backend Testing:
- [ ] Supabase connection works
- [ ] Payment session creation succeeds
- [ ] Generation requires valid session
- [ ] Generation credits decrement correctly
- [ ] Session expires after 1 hour
- [ ] IPFS links stored in database
- [ ] Card data persists after server restart

### Frontend Testing:
- [ ] PaymentModal appears when no session
- [ ] USDC balance displays correctly
- [ ] Payment creates active session
- [ ] Generation button enabled with session
- [ ] Re-roll button shows correct count (2 max)
- [ ] Session status banner updates
- [ ] USDC approval flow works
- [ ] Minting pays correct amount (2.50 USDC)
- [ ] Error handling for insufficient balance

### Smart Contract Testing:
```bash
# Run Foundry tests
cd mini-app
forge test -vv

# Test USDC approval
# Test minting with USDC
# Test batch minting
```

## Migration Steps for Existing Deployment

1. **Set up Supabase project**
   - Create new Supabase project
   - Run migration SQL
   - Add credentials to `.env`

2. **Deploy new USDC contract**
   ```bash
   forge script script/DeployPepeCardNFT.s.sol:DeployPepeCardNFT \
     --rpc-url base --broadcast --verify
   ```

3. **Install dependencies**
   ```bash
   npm install @supabase/supabase-js@^2.39.0
   ```

4. **Update environment variables**
   - Add Supabase credentials
   - Update contract addresses
   - Update pricing to 2.50

5. **Deploy backend updates**
   ```bash
   # Restart API server with new code
   npm run server
   ```

6. **Deploy frontend updates**
   ```bash
   # Build and deploy
   npm run build
   ```

7. **Verify deployment**
   - Test payment flow end-to-end
   - Verify Supabase data storage
   - Check IPFS indexing
   - Test minting with USDC

## Cost Analysis

### Per User Session:
- **Generation Payment:** $2.50 USDC (paid to backend/treasury)
- **Minting (per card):** FREE (user only pays gas ~$0.01)
- **Gas Fees (Base L2):** ~$0.01 per mint transaction

### Revenue Potential:
- 100 users/day × $2.50 = **$250/day** in generation fees
- Minting is FREE - no additional revenue from minting
- **Total:** $250/day potential revenue

**Note:** Revenue comes from generation service, not from minting. This keeps the UX simple and accessible.

### Costs:
- Supabase Free Tier: Up to 500MB database, 50k rows
- Pinata Free Tier: 1GB storage, unlimited requests
- Google Imagen: $0.04/image (after free tier)
- Base L2 Gas: Negligible

## Security Considerations

⚠️ **IMPORTANT:**
- Supabase `SUPABASE_ANON_KEY` is safe for client-side use
- Implement Row Level Security (RLS) in Supabase for production
- Treasury address should be a secure multisig wallet
- Never expose `PRIVATE_KEY` or service role keys
- Validate all payment transactions on-chain before granting credits
- Rate limit API endpoints to prevent abuse

## Rollback Plan

If issues occur:
1. Keep old contract deployed as backup
2. Switch `.env` back to old contract address
3. Restart server with previous code
4. Supabase data remains intact for when fixed

## Support

For issues:
- Check Supabase logs for database errors
- Check API server console for backend errors
- Check browser console for frontend errors
- Verify environment variables are set correctly

## Additional Notes

- Payment sessions expire after 1 hour
- Users can have multiple cards in session before minting
- Re-rolls don't require additional payment
- All IPFS CIDs are permanently indexed in Supabase
- Analytics events tracked for future insights
