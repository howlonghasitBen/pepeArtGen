# Local Testing Guide

This guide walks you through testing the complete NFT minting system on your local machine before deploying to testnet.

## Prerequisites

### Required Software

- **Node.js 18+** (check: `node --version`)
- **npm** (check: `npm --version`)
- **Foundry** (check: `forge --version`)
- **Git** (check: `git --version`)

### Required API Keys

1. **Google AI API Key**
   - Visit: https://aistudio.google.com/app/apikey
   - Click "Create API Key"
   - Enable "Imagen API" and "Gemini API"
   - Copy the key

2. **Pinata JWT Token**
   - Visit: https://pinata.cloud/
   - Sign up for free account
   - Go to: API Keys → New Key
   - Enable `pinFileToIPFS` permission
   - Copy JWT token (starts with `eyJ...`)

3. **Base Sepolia ETH** (for testnet deployment)
   - Visit: https://www.alchemy.com/faucets/base-sepolia
   - Enter your wallet address
   - Receive free testnet ETH

## Step 1: Clone and Install

```bash
# Navigate to mini-app directory
cd pepeArtGen/mini-app

# Install all dependencies (including Puppeteer ~300MB)
npm install

# This will install:
# - puppeteer (HTML rendering)
# - express, cors (API server)
# - @google/genai (AI generation)
# - pinata-web3 (IPFS uploads)
# - node-vibrant (color extraction)
# - and more...

# Installation takes 2-5 minutes depending on your connection
```

## Step 2: Configure Environment

```bash
# Copy example to actual .env file
cp .env.example .env

# Edit .env with your favorite editor
nano .env
# or
vim .env
# or
code .env
```

### Fill in Required Values

```bash
# === REQUIRED FOR TESTING ===

# Google AI (for card generation)
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...your_key_here
API_KEY=AIzaSy...your_key_here  # Same as above

# Pinata (for IPFS uploads)
PINATA_JWT=eyJhbGc...your_jwt_here

# === OPTIONAL FOR LOCAL TESTING ===

# These are only needed for actual blockchain deployment
# PRIVATE_KEY=your_private_key_here
# TREASURY_ADDRESS=0x_your_address
# ROYALTY_RECEIVER=0x_your_address
# BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
# BASESCAN_API_KEY=your_basescan_key

# Frontend contract address (add after deployment)
# VITE_NFT_CONTRACT_ADDRESS=0x_deployed_address
# VITE_MINT_PRICE=0.001
```

**Save the file!**

## Step 3: Test Smart Contract Locally

Before testing the full system, verify the contract works:

```bash
# Run all 26 tests
forge test -vv

# Expected output:
# Ran 26 tests for test/PepeArtGenNFT.t.sol:PepeArtGenNFTTest
# [PASS] test_Mint_Success() (gas: 162554)
# [PASS] test_MintBatch_Success() (gas: 261367)
# ... (24 more tests)
# Suite result: ok. 26 passed; 0 failed; 0 skipped

# If all tests pass ✅ → Contract is working!
# If tests fail ❌ → Check error messages
```

Common test issues:
- **"forge: command not found"** → Install Foundry: https://getfoundry.sh
- **"ImportError"** → Run: `forge install`

## Step 4: Start Backend API Server

Open a terminal and start the backend:

```bash
# Make sure you're in mini-app directory
cd pepeArtGen/mini-app

# Start the API server
npm run server

# Expected output:
# 🚀 Card Generator API running on http://localhost:3001
# 📊 Free tier limit: 100 cards/day
# 📦 Batch limit: 10 cards
# 🎨 Using node-vibrant for color extraction
# 📤 IPFS upload endpoint ready

# ✅ Server is ready!
# ❌ If you see errors, check troubleshooting section below
```

**Keep this terminal open!** The server must run continuously.

### Test Backend Endpoints

Open a new terminal and test:

```bash
# Test 1: Check server health
curl http://localhost:3001/api/limits

# Expected response:
# {"dailyLimit":100,"batchLimit":10,"used":0,"remaining":100}

# ✅ If you see this → Backend is working!
```

## Step 5: Start Frontend Dev Server

Open a **new terminal** (keep backend running):

```bash
# Navigate to mini-app directory
cd pepeArtGen/mini-app

# Start Vite dev server
npm run dev

# Expected output:
# VITE v4.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose

# ✅ Frontend is ready!
```

## Step 6: Test AI Card Generation

### Via Browser (Recommended)

1. Open browser: http://localhost:5173
2. You should see the card generator interface
3. Enter a monster name (e.g., "Fire Phoenix")
4. Click "Generate"
5. Wait 10-15 seconds
6. **Expected result**: Card appears with AI-generated image

**Watch the backend terminal** for logs:
```
🃏 Processing card 1/1: Fire Phoenix
  🎨 Generating image with Imagen for: Fire Phoenix
  ✅ Image generated successfully
  🎨 Extracting colors from image...
  🎭 Generating theme from colors...
  ✍️  Generating move and flavor text...
  ✅ Card generated successfully!
```

### Via API (Alternative)

```bash
# Generate a single card
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"monsterNames": ["Ice Dragon"], "batchMode": false}'

# Expected: JSON response with card data
```

### Troubleshooting Card Generation

**Error: "API key not found"**
```bash
# Check .env file has:
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
API_KEY=AIza...

# Restart backend:
# Ctrl+C in backend terminal
npm run server
```

**Error: "Image generation returned no data"**
- Google Imagen blocked the content (policy violation)
- Try different monster name
- Avoid violent/inappropriate names

**Error: "Daily generation limit reached"**
- Free tier limit: 100 cards/day
- Reset at midnight UTC
- Or upgrade Google AI plan

## Step 7: Test IPFS Upload (Without Minting)

Test IPFS upload independently:

```bash
# Create a test card object (save as test-card.json)
cat > test-card.json << 'EOF'
{
  "card": {
    "id": "test-dragon-123",
    "name": "Test Dragon",
    "subtitle": "⟨Generated⟩",
    "level": "1",
    "type": "Creature — Generated",
    "stats": { "attack": 5, "defense": 3 },
    "flavorText": "Test Breath\nA test dragon for testing purposes.",
    "artist": "Waves TCG",
    "rarity": "1/1",
    "imageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "manaCost": [
      {"type": "hp", "value": 5, "color": "red", "textColor": "#fff"},
      {"type": "mana", "value": 3, "color": "blue", "textColor": "#fff"}
    ],
    "theme": {}
  }
}
EOF

# Upload to IPFS
curl -X POST http://localhost:3001/api/upload-to-ipfs \
  -H "Content-Type: application/json" \
  -d @test-card.json

# Expected output:
# {
#   "success": true,
#   "rawImageCID": "Qm...",
#   "cardImageCID": "Qm...",
#   "htmlCID": "Qm...",
#   "metadataCID": "Qm...",
#   ...
# }
```

**Watch backend logs:**
```
📤 Uploading card to IPFS: Test Dragon
  🎨 Uploading raw AI image...
  ✅ Raw image uploaded: ipfs://QmXxYy...
  🎴 Generating HTML card...
  🖼️  Rendering card to PNG...
    🖼️  Launching browser...
    📄 Loading HTML...
    📸 Capturing screenshot...
    ✅ Screenshot captured
  📤 Uploading rendered card image...
  ✅ Card image uploaded: ipfs://QmZzAa...
  📤 Uploading HTML card...
  ✅ HTML card uploaded: ipfs://QmBbCc...
  📝 Creating metadata...
  📤 Uploading metadata...
  ✅ Metadata uploaded: ipfs://QmCcDd...
  🎉 Upload complete!
```

### View Uploaded Files

```bash
# Get CIDs from response, then visit in browser:
# Image: https://gateway.pinata.cloud/ipfs/QmCardImageCID
# HTML:  https://gateway.pinata.cloud/ipfs/QmHTMLCID
# Meta:  https://gateway.pinata.cloud/ipfs/QmMetadataCID
```

### Troubleshooting IPFS Upload

**Error: "PINATA_JWT not configured"**
```bash
# Add to .env:
PINATA_JWT=eyJhbGc...

# Restart backend
```

**Error: "Invalid Pinata JWT token"**
- Token expired or wrong
- Generate new token at https://pinata.cloud/
- Make sure to enable `pinFileToIPFS` permission

**Error: "Failed to launch browser"**
- Puppeteer missing dependencies (Linux)
- See "Install Puppeteer Dependencies" section below

**Slow rendering (>10 seconds)**
- Normal on first run (Chromium initializing)
- Subsequent renders: 2-5 seconds
- Check system resources (RAM, CPU)

## Step 8: Deploy Contract to Testnet

**Note**: You can skip this and test everything else without deploying!

When ready to test minting on blockchain:

```bash
# Add to .env:
PRIVATE_KEY=0x...your_private_key
TREASURY_ADDRESS=0x...your_address
ROYALTY_RECEIVER=0x...your_address
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Deploy
forge script script/Deploy.s.sol:DeployPepeArtGen \
  --rpc-url base_sepolia \
  --broadcast \
  --verify

# Output shows:
# Contract deployed to: 0xABC123...
# ✅ Copy this address!

# Add to .env:
VITE_NFT_CONTRACT_ADDRESS=0xABC123...from_above
VITE_MINT_PRICE=0.001

# Restart frontend:
# Ctrl+C in frontend terminal
npm run dev
```

## Step 9: Test Complete Flow

Now test everything together:

1. **Generate Card** (frontend): http://localhost:5173
   - Enter: "Thunder Phoenix"
   - Click "Generate"
   - Wait ~10 seconds
   - ✅ Card appears

2. **Connect Wallet**
   - Click "Connect Wallet"
   - Select MetaMask (or other)
   - Switch network to Base Sepolia
   - ✅ Wallet connected

3. **Mint NFT**
   - Click "Mint" on generated card
   - Wait for IPFS upload (~15-20 seconds)
   - Backend logs show upload progress
   - Confirm transaction in wallet
   - Wait for confirmation (~5 seconds)
   - ✅ NFT minted!

4. **View on OpenSea** (wait 1-5 min)
   - Visit: https://testnets.opensea.io/assets/base-sepolia/YOUR_CONTRACT/1
   - ✅ Styled card visible as preview
   - ✅ Click NFT → Interactive HTML card shows

## Complete Test Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured with API keys
- [ ] Smart contract tests pass (`forge test -vv`)
- [ ] Backend server starts (`npm run server`)
- [ ] Backend health check passes (`curl localhost:3001/api/limits`)
- [ ] Frontend starts (`npm run dev`)
- [ ] Frontend loads in browser (http://localhost:5173)
- [ ] AI card generation works (enter name → generate)
- [ ] IPFS upload works (backend logs show upload success)
- [ ] Puppeteer rendering works (card preview generated)
- [ ] Contract deployment succeeds (if testing minting)
- [ ] Wallet connection works (MetaMask connects)
- [ ] NFT minting works (transaction confirms)
- [ ] OpenSea indexing works (NFT appears on testnet.opensea.io)

## Troubleshooting

### Backend Won't Start

**Error: "Cannot find module 'express'"**
```bash
npm install
```

**Error: "EADDRINUSE: Port 3001 already in use"**
```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in server/api.mjs:
const PORT = 3002;
```

**Error: "MODULE_NOT_FOUND"**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Frontend Won't Start

**Error: "Cannot find module 'vite'"**
```bash
# Install dev dependencies
npm install --save-dev vite @vitejs/plugin-react
```

**Error: "Failed to resolve import"**
- Missing dependencies
- Run: `npm install`
- Check `package.json` has all dependencies

### Puppeteer Issues

**Error: "Failed to launch browser"** (Linux)

Install Chromium dependencies:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
  chromium-browser \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libgbm1 \
  libasound2

# Or use system Chromium
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
npm install puppeteer
```

**Error: "Timeout waiting for page"**
- IPFS image loading slowly
- Increase timeout in `server/cardRenderer.mjs`:
```javascript
await page.setContent(cardHTML, {
  waitUntil: 'networkidle0',
  timeout: 60000  // 60 seconds
});
```

**Error: "Protocol error"**
- Chromium crashed
- Check system memory (needs ~500MB per render)
- Close other applications

### Wallet Connection Issues

**MetaMask not connecting**
- Make sure MetaMask installed
- Check network is Base Sepolia (Chain ID: 84532)
- Refresh page and try again

**Wrong network**
- Click MetaMask
- Switch to Base Sepolia
- Or add network manually:
  - Network Name: Base Sepolia
  - RPC URL: https://sepolia.base.org
  - Chain ID: 84532
  - Currency: ETH

### Transaction Failures

**Error: "Insufficient funds"**
- Need Base Sepolia ETH
- Get from: https://www.alchemy.com/faucets/base-sepolia

**Error: "CooldownActive"**
- Wait 60 seconds between mints
- Or adjust cooldown in contract

**Error: "Gas estimation failed"**
- Contract not deployed correctly
- Check contract address in .env
- Redeploy if needed

## Performance Benchmarks

Expected timings on modern hardware:

| Operation | Time | Notes |
|-----------|------|-------|
| `npm install` | 2-5 min | First time only |
| Backend startup | 1-2 sec | |
| Frontend startup | 2-3 sec | |
| AI generation | 10-15 sec | Google Imagen |
| Color extraction | 1-2 sec | |
| Text generation | 2-3 sec | Gemini Flash |
| IPFS image upload | 1-3 sec | Depends on connection |
| Puppeteer render | 3-7 sec | First: 5-10s, cached: 2-3s |
| IPFS card upload | 1-2 sec | |
| HTML upload | 1 sec | |
| Metadata upload | 1 sec | |
| **Total mint time** | **20-30 sec** | End to end |
| Blockchain confirm | 2-5 sec | Base L2 |
| OpenSea indexing | 1-5 min | Automatic |

## Next Steps

Once local testing works:

1. **Optimize** - Fine-tune settings for your needs
2. **Deploy** - Deploy to Base mainnet
3. **Monitor** - Set up error tracking (Sentry)
4. **Scale** - Add database, caching, CDN
5. **Launch** - Open to users!

## Getting Help

If you're stuck:

1. Check backend terminal for error messages
2. Check browser console (F12) for frontend errors
3. Review this troubleshooting section
4. Check INTEGRATION_GUIDE.md for detailed explanations
5. Open an issue on GitHub with:
   - Error messages (full output)
   - Steps to reproduce
   - System info (OS, Node version)
   - Screenshots if applicable

## Quick Reference

### Start Everything

```bash
# Terminal 1: Backend
cd pepeArtGen/mini-app
npm run server

# Terminal 2: Frontend
cd pepeArtGen/mini-app
npm run dev

# Browser: Open http://localhost:5173
```

### Stop Everything

```bash
# In each terminal: Ctrl+C
# Or close terminals
```

### Reset Everything

```bash
# Stop servers (Ctrl+C in terminals)
# Delete generated data
rm -rf node_modules package-lock.json
# Reinstall
npm install
# Start fresh
npm run server
npm run dev
```

---

**You're ready to test!** 🚀

Start with Step 1 and work through each step. Most issues are solved by checking:
1. Environment variables in `.env`
2. API keys are valid and not expired
3. Dependencies installed correctly
4. Terminals show no errors

Good luck! 🃏✨
