# 🚀 WavesTCGNFT Deployment Guide

Complete guide for deploying and configuring the Waves TCG NFT project.

---

## 📋 Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- Node.js 18+ and npm/yarn
- Wallet with ETH on Base (for deployment gas fees)
- Wallet with USDC on Base (for testing generation payment)

---

## 🔐 Environment Variables Setup

### 1. Copy the example file

```bash
cd mini-app
cp .env.example .env
```

### 2. Configure Backend Variables

#### **Required for Smart Contract Deployment:**

```bash
# Private key for deploying contracts (KEEP SECRET!)
PRIVATE_KEY=0x_your_private_key_here

# Treasury receives generation payments ($2.50 USDC per session)
TREASURY_ADDRESS=0x_your_treasury_address

# Royalty receiver for NFT sales (5% default)
ROYALTY_RECEIVER=0x_your_royalty_receiver_address

# Network selection
NETWORK=base  # or 'baseSepolia' for testnet

# RPC endpoint
BASE_RPC_URL=https://mainnet.base.org
# Or use Alchemy: https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

#### **Required for Card Generation:**

```bash
# Google AI for image and text generation
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key

# Pinata for IPFS uploads
PINATA_JWT=your_pinata_jwt_token
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Supabase for database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

#### **Required for Payment Verification:**

```bash
# USDC contract on Base (for $2.50 generation payment)
USDC_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
# Base Sepolia testnet: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### 3. Configure Frontend Variables

```bash
# Deployed WavesTCGNFT contract address (set after deployment)
VITE_NFT_CONTRACT_ADDRESS=0x_your_deployed_contract_address

# USDC contract (same as backend)
VITE_USDC_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Treasury for payment verification
VITE_TREASURY_ADDRESS=0x_your_treasury_address

# Network for OpenSea links
VITE_NETWORK=base  # or 'baseSepolia'

# WalletConnect project ID (get from https://cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

---

## 🏗️ Smart Contract Deployment

### 1. Install Foundry Dependencies

```bash
cd mini-app
forge install
```

### 2. Build the Contract

```bash
forge build
```

### 3. Deploy to Base

**Base Mainnet:**
```bash
forge script script/Deploy.s.sol:DeployWavesTCG \
  --rpc-url $BASE_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

**Base Sepolia Testnet:**
```bash
forge script script/Deploy.s.sol:DeployWavesTCG \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

### 4. Save the Contract Address

After deployment, you'll see output like:
```
WavesTCGNFT deployed at: 0x1234567890abcdef...
```

**Add this to your .env:**
```bash
VITE_NFT_CONTRACT_ADDRESS=0x1234567890abcdef...
```

### 5. Verify Mint Price (Already FREE)

The contract is deployed with `mintPrice = 0` by default. Verify it:

```bash
cast call $VITE_NFT_CONTRACT_ADDRESS "mintPrice()" --rpc-url $BASE_RPC_URL
# Should return: 0 [0]
```

✅ **Minting is FREE from deployment - no additional configuration needed!**

---

## 🗄️ Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Copy the URL and anon key to your `.env`

### 2. Run Database Migrations

Navigate to SQL Editor in Supabase and run:

```bash
mini-app/supabase/migrations/001_initial_schema.sql
```

This creates the following tables:
- `payment_sessions` - Tracks USDC payments
- `cards` - Generated card data
- `ipfs_links` - IPFS upload records
- `mints` - NFT mint records
- `analytics_events` - Event tracking

---

## 🎨 Frontend Setup

### 1. Install Dependencies

```bash
cd mini-app
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

### 3. Start Backend API

```bash
npm run server
```

Backend runs at: `http://localhost:3001`

---

## ✅ Verification Checklist

Before going to production, verify:

- [ ] **Smart Contract Deployed** - `VITE_NFT_CONTRACT_ADDRESS` is set
- [ ] **Mint Price = 0** - Run `cast call` to verify
- [ ] **Contract Verified on BaseScan** - Users can view source code
- [ ] **Treasury Address Set** - USDC payments go to correct wallet
- [ ] **Supabase Database Running** - Tables created and accessible
- [ ] **IPFS Pinata Configured** - JWT token is valid
- [ ] **Google AI API Working** - Image/text generation functional
- [ ] **Payment Verification Works** - Test $2.50 USDC payment flow
- [ ] **Minting Works** - Test full flow: pay → generate → mint
- [ ] **OpenSea Links Correct** - Success modal shows proper URLs
- [ ] **Download Works** - Card art downloads from IPFS

---

## 🧪 Testing the Complete Flow

### 1. Payment (Backend)

```bash
# User pays $2.50 USDC to treasury
# Backend verifies transaction on-chain
# Creates session with 3 generations (1 + 2 re-rolls)
```

### 2. Generation

```bash
# User enters monster name
# Google Imagen generates card image
# Google Gemini generates move name + flavor text
# Colors extracted, theme generated
# Card stored in database
```

### 3. Curation

```bash
# User swipes cards left (discard) or right (mint)
# Selected cards move to mint queue
```

### 4. IPFS Upload

```bash
# For each card:
#   - Raw AI image → IPFS
#   - HTML card → IPFS
#   - Puppeteer PNG render → IPFS
#   - Metadata JSON → IPFS
# All 4 links stored in database
```

### 5. Minting (On-Chain)

```bash
# User clicks "Mint N Cards (FREE)"
# Frontend calls WavesTCGNFT.mint() or .mintBatch()
# Transaction confirms on Base
# Mint recorded to database with token IDs
# Success modal shows download + OpenSea links
```

---

## 🔧 Post-Deployment Configuration

### Set Mint Cooldown (Optional)

```bash
# Default: 60 seconds between mints
# To change to 30 seconds:
cast send $VITE_NFT_CONTRACT_ADDRESS \
  "setCooldown(uint256)" 30 \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY
```

### Update Base URI (Optional)

```bash
# If you want a base URI for all tokens:
cast send $VITE_NFT_CONTRACT_ADDRESS \
  "setBaseURI(string)" "ipfs://YOUR_BASE_CID/" \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY
```

### Pause Minting (Emergency)

```bash
# Pause minting:
cast send $VITE_NFT_CONTRACT_ADDRESS \
  "pause()" \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY

# Unpause:
cast send $VITE_NFT_CONTRACT_ADDRESS \
  "unpause()" \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY
```

---

## 🌊 OpenSea Collection Setup

1. Mint at least 1 NFT to your wallet
2. Go to [OpenSea](https://opensea.io/account)
3. Your collection will auto-appear
4. Click "Edit Collection"
5. Add:
   - Collection banner image
   - Collection logo
   - Description
   - Social links
   - Royalty settings (5% default)

---

## 📊 Monitoring

### Check Contract Stats

```bash
# Total supply
cast call $VITE_NFT_CONTRACT_ADDRESS "totalSupply()" --rpc-url $BASE_RPC_URL

# Remaining supply (max 10,000)
cast call $VITE_NFT_CONTRACT_ADDRESS "remainingSupply()" --rpc-url $BASE_RPC_URL

# Current mint price (should be 0)
cast call $VITE_NFT_CONTRACT_ADDRESS "mintPrice()" --rpc-url $BASE_RPC_URL

# Treasury address
cast call $VITE_NFT_CONTRACT_ADDRESS "treasury()" --rpc-url $BASE_RPC_URL
```

### Check Database Stats

Query Supabase:

```sql
-- Total payments received
SELECT COUNT(*), SUM(amount_usdc) FROM payment_sessions WHERE status = 'confirmed';

-- Total cards generated
SELECT COUNT(*) FROM cards;

-- Total NFTs minted
SELECT COUNT(*) FROM mints;

-- Recent mints
SELECT * FROM minting_history ORDER BY minted_at DESC LIMIT 10;
```

---

## 🚨 Troubleshooting

### Minting fails with "InsufficientPayment"

**Solution:** This error means the contract is expecting payment. Verify mint price is 0:
```bash
cast call $VITE_NFT_CONTRACT_ADDRESS "mintPrice()" --rpc-url $BASE_RPC_URL
# Should return: 0 [0]
```

If it's not 0, the contract may have been modified. Reset it:
```bash
cast send $VITE_NFT_CONTRACT_ADDRESS "setMintPrice(uint256)" 0 --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY
```

### OpenSea links show wrong network

**Solution:** Update `VITE_NETWORK` in `.env`:
```bash
VITE_NETWORK=base  # for mainnet
# or
VITE_NETWORK=baseSepolia  # for testnet
```

### Card art download fails

**Solution:** Check IPFS links in database and verify Pinata gateway is accessible.

### Payment verification fails

**Solution:**
1. Check `TREASURY_ADDRESS` matches frontend and backend
2. Verify `BASE_RPC_URL` is working
3. Check transaction hash on BaseScan

---

## 📦 Production Deployment

### Frontend (Vercel/Netlify)

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Deploy `dist/` folder to Vercel/Netlify

3. Set environment variables in hosting platform

### Backend (Render/Railway/Fly.io)

1. Deploy backend server:
   ```bash
   npm run server
   ```

2. Set all backend environment variables

3. Update `API_BASE_URL` in frontend to production URL

---

## 🎉 You're Ready!

Your Waves TCG NFT platform is now live! Users can:
1. Pay $2.50 USDC for 3 generations
2. Create unique AI-generated cards
3. Mint NFTs for FREE (only gas)
4. Download full card art
5. View on OpenSea marketplace

---

## 📞 Support

- Smart Contract Issues: Check BaseScan for transaction details
- API Issues: Check backend logs (`npm run server`)
- Database Issues: Check Supabase dashboard
- IPFS Issues: Check Pinata dashboard

For questions, open an issue on GitHub.
