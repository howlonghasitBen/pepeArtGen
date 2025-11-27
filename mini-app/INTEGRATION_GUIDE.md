# Complete Integration Guide: AI Generation → IPFS → NFT Minting

This guide explains the complete end-to-end flow from generating a card with AI to minting it as an NFT on Base blockchain.

## Architecture Overview

```
User Input → AI Generation (Google Imagen) → IPFS Upload (Pinata) → NFT Mint (Base L2)
```

### Components

1. **Frontend** (React + Vite + wagmi)
2. **Backend API** (Express.js)
3. **Smart Contract** (Solidity ERC-721)
4. **External Services**:
   - Google Gemini AI (card generation)
   - Pinata (IPFS storage)
   - Base L2 (blockchain)

## Complete Data Flow

### 1. Card Generation Flow

```
User enters monster name → Frontend calls API
    ↓
Backend API (/api/generate)
    ↓
Google Imagen generates image (base64)
    ↓
Gemini Flash generates move + flavor text
    ↓
node-vibrant extracts colors from image
    ↓
Returns card data to frontend
```

**Files Involved:**
- Frontend: `src/components/GeneratorScreen.jsx`
- Backend: `server/api.mjs` (line 256-389)
- API Endpoint: `POST http://localhost:3001/api/generate`

**Request:**
```json
{
  "monsterNames": ["Shadow Dragon"],
  "batchMode": false
}
```

**Response:**
```json
{
  "success": true,
  "cards": [{
    "id": "shadowdragon-1234567890",
    "name": "Shadow Dragon",
    "imageData": "data:image/png;base64,iVBORw0KG...",
    "flavorText": "Eternal Darkness\nFrom the void it emerges...",
    "stats": { "attack": 7, "defense": 5 },
    ...
  }],
  "remaining": 99
}
```

### 2. IPFS Upload Flow

```
User clicks "Mint" → Frontend calls useMintCard hook
    ↓
uploadToIPFS() sends card data to backend
    ↓
Backend API (/api/upload-to-ipfs)
    ↓
Convert base64 image → Buffer → File object
    ↓
Upload image to Pinata → Get imageCID
    ↓
Create metadata JSON with ipfs://imageCID
    ↓
Upload metadata to Pinata → Get metadataCID
    ↓
Return ipfs://metadataCID to frontend
```

**Files Involved:**
- Frontend: `src/hooks/useMintCard.js` (line 21-47)
- Backend: `server/api.mjs` (line 413-507)
- API Endpoint: `POST http://localhost:3001/api/upload-to-ipfs`

**Request:**
```json
{
  "card": {
    "id": "shadowdragon-1234567890",
    "name": "Shadow Dragon",
    "imageData": "data:image/png;base64,iVBORw0KG...",
    "flavorText": "...",
    "stats": { "attack": 7, "defense": 5 },
    ...
  }
}
```

**Response:**
```json
{
  "success": true,
  "imageCID": "QmXxYy123...",
  "metadataCID": "QmZzAa456...",
  "imageURI": "ipfs://QmXxYy123...",
  "metadataURI": "ipfs://QmZzAa456...",
  "imageGateway": "https://gateway.pinata.cloud/ipfs/QmXxYy123...",
  "metadataGateway": "https://gateway.pinata.cloud/ipfs/QmZzAa456..."
}
```

**Metadata Structure (OpenSea Compatible):**
```json
{
  "name": "Shadow Dragon",
  "description": "Eternal Darkness\nFrom the void it emerges...",
  "image": "ipfs://QmXxYy123...",
  "attributes": [
    { "trait_type": "Type", "value": "Creature" },
    { "trait_type": "Level", "value": "1" },
    { "trait_type": "Attack", "value": 7 },
    { "trait_type": "Defense", "value": 5 },
    { "trait_type": "HP", "value": 8 },
    { "trait_type": "Mana", "value": 3 },
    { "trait_type": "Rarity", "value": "1/1" },
    { "trait_type": "Artist", "value": "Waves TCG" }
  ]
}
```

### 3. NFT Minting Flow

```
Frontend receives metadataURI from IPFS upload
    ↓
Call writeContractAsync with wagmi
    ↓
Smart Contract: mint(string metadataURI) payable
    ↓
Validate payment (msg.value >= mintPrice)
    ↓
Check cooldown (lastMintTime + 60 seconds)
    ↓
Mint token, set tokenURI, emit CardMinted event
    ↓
Refund excess payment
    ↓
Return transaction hash to frontend
    ↓
Frontend waits for confirmation
    ↓
OpenSea indexes NFT (1-5 minutes)
```

**Files Involved:**
- Frontend: `src/hooks/useMintCard.js` (line 52-87)
- Contract: `src/WavesTCGNFT.sol` (line 66-74, 109-123)
- Contract Function: `mint(string memory metadataURI) external payable`

**Transaction Parameters:**
```javascript
{
  address: "0xYourContractAddress",
  abi: NFT_ABI,
  functionName: 'mint',
  args: ["ipfs://QmZzAa456..."],
  value: parseEther("0.001") // 0.001 ETH on Base
}
```

**Smart Contract Events:**
```solidity
event CardMinted(
  address indexed minter,
  uint256 indexed tokenId,
  string tokenURI
);
```

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# Required for card generation
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key

# Required for IPFS uploads
PINATA_JWT=your_pinata_jwt_token

# Required for contract deployment
PRIVATE_KEY=your_wallet_private_key
TREASURY_ADDRESS=0x_your_treasury_address
ROYALTY_RECEIVER=0x_your_royalty_receiver_address
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Required for frontend
VITE_NFT_CONTRACT_ADDRESS=0x_deployed_contract_address
VITE_MINT_PRICE=0.001
```

### 2. Get API Keys

**Google AI API Key:**
1. Go to https://aistudio.google.com/app/apikey
2. Create new API key
3. Enable "Imagen API" and "Gemini API"

**Pinata JWT Token:**
1. Sign up at https://pinata.cloud/
2. Go to API Keys → New Key
3. Enable `pinFileToIPFS` permission
4. Copy JWT token

### 3. Install Dependencies

```bash
cd mini-app
npm install
```

### 4. Test Contract Locally

```bash
# Run tests
forge test -vv

# All 26 tests should pass
```

### 5. Deploy to Base Sepolia

```bash
# Deploy contract
forge script script/Deploy.s.sol:DeployWavesTCG \
  --rpc-url base_sepolia \
  --broadcast \
  --verify

# Copy deployed contract address
# Add to .env as VITE_NFT_CONTRACT_ADDRESS
```

### 6. Start Backend API

```bash
# In mini-app directory
npm run server

# Should see:
# 🚀 Card Generator API running on http://localhost:3001
# 📤 IPFS upload endpoint ready
```

### 7. Start Frontend

```bash
# In new terminal, in mini-app directory
npm run dev

# Should see:
# VITE ready at http://localhost:5173
```

## Testing the Complete Flow

### Test 1: Generate a Card

1. Open http://localhost:5173
2. Enter a monster name (e.g., "Fire Phoenix")
3. Click "Generate"
4. Wait 5-15 seconds for AI generation
5. Card should appear with generated image

**Expected Console Logs:**
```
  🃏 Processing card 1/1: Fire Phoenix
  🎨 Generating image with Imagen...
  ✅ Image generated
  🎨 Extracting colors from image...
  ✍️ Generating move and flavor text...
  ✅ Card generated successfully!
```

### Test 2: Upload to IPFS

1. Click "Mint" on generated card
2. Backend uploads to IPFS

**Expected Console Logs (Backend):**
```
📤 Uploading card to IPFS: Fire Phoenix
  🎨 Uploading image...
  ✅ Image uploaded: ipfs://QmXxYy123...
  📝 Creating metadata...
  📤 Uploading metadata...
  ✅ Metadata uploaded: ipfs://QmZzAa456...
  🎉 Upload complete!
```

**Expected Console Logs (Frontend):**
```
📤 Uploading to IPFS: Fire Phoenix
✅ IPFS upload successful: ipfs://QmZzAa456...
```

### Test 3: Mint NFT

1. Connect wallet (must have Base Sepolia ETH)
2. Confirm transaction in wallet
3. Wait for confirmation

**Expected Console Logs:**
```
🎨 Minting NFT with metadata: ipfs://QmZzAa456...
⏳ Transaction submitted: 0xabc123...
```

**Check on Basescan:**
```
https://sepolia.basescan.org/tx/0xabc123...
```

**View on OpenSea (after 1-5 min):**
```
https://testnets.opensea.io/assets/base-sepolia/YOUR_CONTRACT_ADDRESS/1
```

## Cost Breakdown

### Per Single NFT Mint

| Service | Cost | Notes |
|---------|------|-------|
| Google Imagen | $0.03 | Image generation |
| Gemini Flash | $0.01 | Text generation |
| Pinata IPFS | $0.001 | Free tier sufficient |
| Base L2 Gas | $0.01-0.05 | ~100K gas @ 0.001 gwei |
| **Total** | **~$0.05-0.09** | Per complete mint |

### Monthly Costs (1000 mints)

- AI Generation: $40
- IPFS Storage: $20 (Picnic tier)
- Gas Fees: $10-50
- **Total: $70-110/month**

## Troubleshooting

### "IPFS upload failed: Invalid Pinata JWT"

**Solution:** Check `.env` file has correct `PINATA_JWT` value

```bash
# Test Pinata connection
curl -H "Authorization: Bearer YOUR_JWT" \
  https://api.pinata.cloud/data/testAuthentication
```

### "Image generation failed: policy violation"

**Solution:** Google Imagen blocks certain content. Try different monster name.

### "Cooldown active" error when minting

**Solution:** Wait 60 seconds between mints (configurable in contract)

```javascript
// Check cooldown status
const canMint = await contract.canMint(address)
const timeUntil = await contract.timeUntilMint(address)
```

### Frontend can't connect to backend

**Solution:** Make sure backend is running on port 3001

```bash
# Check if port is in use
lsof -i :3001

# Start backend
npm run server
```

### Transaction fails with "Insufficient payment"

**Solution:** Make sure wallet has enough ETH for mint price + gas

```bash
# Check mint price
cast call YOUR_CONTRACT_ADDRESS "mintPrice()" --rpc-url base_sepolia

# Get testnet ETH from faucet
# https://www.alchemy.com/faucets/base-sepolia
```

## Security Considerations

### Environment Variables

- ✅ **NEVER** commit `.env` file
- ✅ Use separate keys for testnet/mainnet
- ✅ Rotate API keys every 90 days
- ✅ Use AWS KMS for production private keys

### Rate Limiting

Backend implements:
- 100 generations/day (free tier)
- 10 cards per batch max
- 3 second delay between batch generations

### Contract Security

- ✅ ReentrancyGuard on all payment functions
- ✅ Pausable for emergency stops
- ✅ Cooldown prevents spam
- ✅ Supply limit enforced

## Next Steps

### For Testnet Testing

1. Get Base Sepolia ETH from faucet
2. Deploy contract
3. Test complete flow end-to-end
4. Verify on OpenSea testnet

### For Mainnet Deployment

1. Audit contract (recommended for $100K+ projects)
2. Set up production Pinata account
3. Configure monitoring (Sentry, DataDog)
4. Deploy to Base mainnet
5. Verify on Basescan
6. Submit to OpenSea for collection verification

## Reference Implementation

This implementation follows the architecture outlined in the technical specification document, providing:

- ✅ AI image generation (Google Imagen)
- ✅ Real-time IPFS upload (Pinata)
- ✅ ERC-721 minting on Base L2
- ✅ OpenSea metadata compatibility
- ✅ Rate limiting and security
- ✅ Cost optimization (<$0.10/NFT)

Total development time: ~6-8 weeks following this architecture.
