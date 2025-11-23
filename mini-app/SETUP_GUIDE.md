# Infrastructure Setup Guide for PepeArtGen NFT Minting

Complete checklist for setting up all required accounts and services.

## 1. Wallet Setup (5 minutes)

### Deployment Wallet
- [ ] Create new wallet in MetaMask or preferred wallet
- [ ] Export private key (keep secure!)
- [ ] Fund with Base ETH (~0.1 ETH for deployment + testing)
- [ ] Save address as `PRIVATE_KEY` in `.env`

### Treasury Wallet (Multisig Recommended)
- [ ] Option A: Use Gnosis Safe (https://safe.base.org/)
  - Create 2-of-3 multisig
  - Add multiple owners for security
- [ ] Option B: Use single wallet (simpler but less secure)
- [ ] Save address as `TREASURY_ADDRESS` in `.env`

### Royalty Receiver
- [ ] Same as treasury or separate wallet for royalties
- [ ] Save address as `ROYALTY_RECEIVER` in `.env`

**Estimated Cost**: Free (just need test ETH for Base Sepolia)

---

## 2. RPC Provider (5 minutes)

### Option A: Alchemy (Recommended)
- [ ] Sign up at https://www.alchemy.com/
- [ ] Create new app: "Base" network
- [ ] Copy API keys:
  - Base Mainnet RPC
  - Base Sepolia RPC
- [ ] Paste in `.env` file

**Free Tier**: 300M compute units/month (enough for testing)
**Paid Tier**: $49/month for production (300K-3M requests)

### Option B: Public RPCs (Free but rate-limited)
```bash
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

---

## 3. Block Explorer API (5 minutes)

### Basescan API Key (for contract verification)
- [ ] Sign up at https://basescan.org/
- [ ] Navigate to "API-KEYs" section
- [ ] Create new API key
- [ ] Save as `BASESCAN_API_KEY` in `.env`

**Cost**: Free (5 calls/second)

---

## 4. IPFS Storage (10 minutes)

### Option A: Pinata (Recommended)
- [ ] Sign up at https://pinata.cloud/
- [ ] Navigate to API Keys section
- [ ] Create new key with permissions:
  - `pinFileToIPFS`
  - `pinJSONToIPFS`
  - `unpin`
- [ ] Copy JWT token
- [ ] Save as `PINATA_JWT` in `.env`

**Free Tier**: 1GB storage, 100GB bandwidth
**Picnic Tier**: $20/month - 1TB storage, 500GB bandwidth, dedicated gateway
**Recommended for launch**: Start with Picnic tier

### Option B: Filebase
- [ ] Sign up at https://filebase.com/
- [ ] Create S3-compatible access keys
- [ ] Configure bucket for IPFS

**Free Tier**: 5GB storage, 25GB bandwidth
**Starter Tier**: $20/month - 1TB storage, superior bandwidth pricing

---

## 5. AI Image Generation (Already have!)

You're already using Google AI Studio in pepeArtGen:
- [ ] Verify API_KEY in pepeArtGen `.env`
- [ ] Current limits: 100 images/day (Imagen), 1500 requests/day (Gemini)

**For production scaling**:
### OpenRouter (Optional upgrade)
- [ ] Sign up at https://openrouter.ai/
- [ ] Add credits ($10-50 for testing)
- [ ] Create API key
- [ ] ~$0.03 per image generation

---

## 6. Database (Optional - for production minting app)

### Supabase (Free tier perfect for testing)
- [ ] Sign up at https://supabase.com/
- [ ] Create new project
- [ ] Save connection strings
- [ ] Set up tables (see architecture guide)

**Free Tier**: 500MB database, 1GB file storage, 50K monthly active users
**Pro Tier**: $25/month for production

---

## 7. Development Tools (10 minutes)

### Install Foundry
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Install Node.js Dependencies (for IPFS upload)
```bash
npm install pinata-web3 dotenv
```

---

## 8. Get Test ETH (5 minutes)

### Base Sepolia Testnet Faucets
- [ ] Visit https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- [ ] Or: https://faucet.quicknode.com/base/sepolia
- [ ] Request 0.5-1 ETH (plenty for testing)
- [ ] Wait 1-5 minutes for confirmation

---

## 9. Environment Variables Setup

Create `.env` file with all your credentials:

```bash
# Copy template
cp .env.example .env

# Edit .env file with your values
nano .env
```

### Verify Your .env File

Check that all these are filled in:
```bash
cat .env | grep -v "^#" | grep "="
```

Should show:
- PRIVATE_KEY=0x...
- TREASURY_ADDRESS=0x...
- ROYALTY_RECEIVER=0x...
- BASE_RPC_URL=https://...
- BASE_SEPOLIA_RPC_URL=https://...
- BASESCAN_API_KEY=...
- PINATA_JWT=...
- IPFS_GATEWAY=https://...

---

## 10. Pre-Deployment Checklist

### Smart Contract
- [ ] Review `PepeArtGenNFT.sol` contract
- [ ] Customize name/symbol if needed
- [ ] Verify MAX_SUPPLY (currently 10,000)
- [ ] Check MINT_PRICE (currently 0.001 ETH)

### Testing
- [ ] Run tests: `forge test -vv`
- [ ] Check gas usage: `forge test --gas-report`
- [ ] All tests passing? ✅

### Testnet Deployment
- [ ] Fund deployment wallet with Base Sepolia ETH
- [ ] Deploy to testnet: `forge script script/Deploy.s.sol:DeployPepeArtGen --rpc-url base_sepolia --broadcast --verify`
- [ ] Save deployed contract address
- [ ] Verify on Basescan Sepolia

### IPFS Upload
- [ ] Generate cards: `cd ../pepeArtGen && node completeCardPipeline.mjs`
- [ ] Upload images to IPFS (get CID)
- [ ] Update metadata with image CIDs
- [ ] Upload metadata to IPFS (get CID)
- [ ] Update contract baseURI with metadata CID

### Test Minting
- [ ] Mint test NFT on Sepolia
- [ ] Verify on OpenSea Testnet
- [ ] Check metadata displays correctly
- [ ] Test cooldown functionality
- [ ] Test batch minting
- [ ] Test admin functions

---

## 11. Mainnet Deployment (When ready!)

### Final Checks
- [ ] All testnet testing complete
- [ ] Metadata uploaded to production IPFS
- [ ] Treasury wallet configured (multisig recommended)
- [ ] Fund deployment wallet with ~0.02 ETH on Base Mainnet
- [ ] Backup private keys securely

### Deploy
```bash
forge script script/Deploy.s.sol:DeployPepeArtGen \
  --rpc-url base \
  --broadcast \
  --verify \
  --slow
```

### Post-Deployment
- [ ] Update baseURI with production IPFS CID
- [ ] Test single mint
- [ ] Verify on OpenSea within 5 minutes
- [ ] Share contract address with community
- [ ] Set up monitoring/alerts
- [ ] Prepare frontend minting interface

---

## Cost Summary

### One-Time Setup Costs
- Contract Deployment: $2-5 (Base L2)
- Domain (optional): $12/year

### Monthly Operating Costs (by scale)

**Small Scale (100-1,000 mints/month)**
- IPFS: Free-$20/month
- RPC: Free (Alchemy free tier)
- Database: Free (Supabase free tier)
- Total: **$0-20/month**

**Medium Scale (1,000-10,000 mints/month)**
- IPFS: $20-100/month
- RPC: $0-49/month
- AI Generation: $30-150/month
- Database: $25/month
- Total: **$75-324/month**

**Large Scale (10,000+ mints/month)**
- IPFS: $100-500/month
- RPC: $49-199/month
- AI Generation: $300-1,500/month
- Database: $25-110/month
- Monitoring: $26/month
- Total: **$500-2,335/month**

### Per-NFT Costs
- Small scale: ~$0.25/NFT
- Medium scale: ~$0.20/NFT
- Large scale: ~$0.15/NFT

---

## Next Steps

Once all accounts are set up:

1. **Test Locally**: `forge test -vv`
2. **Deploy Testnet**: Follow deployment guide
3. **Generate Cards**: Use your pepeArtGen pipeline
4. **Upload IPFS**: Use upload script
5. **Test Minting**: Mint on testnet
6. **Launch Mainnet**: When everything works!

---

## Quick Reference URLs

- **Base Sepolia Faucet**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- **Basescan**: https://basescan.org/
- **Basescan Testnet**: https://sepolia.basescan.org/
- **OpenSea Testnet**: https://testnets.opensea.io/
- **OpenSea Mainnet**: https://opensea.io/
- **Alchemy Dashboard**: https://dashboard.alchemy.com/
- **Pinata Dashboard**: https://app.pinata.cloud/
- **Gnosis Safe**: https://safe.base.org/

---

## Troubleshooting

### "Insufficient funds" during deployment
- Check wallet has Base ETH (not Ethereum mainnet ETH)
- Need ~0.02 ETH for deployment + buffer

### "RPC URL not found"
- Verify .env file is in project root
- Check RPC URL has no typos
- Try public RPC if Alchemy key fails

### "Verification failed"
- Wait 1-2 minutes and try again
- Check Basescan API key is correct
- Verify you're using correct network (testnet vs mainnet)

### IPFS upload fails
- Check Pinata JWT token is correct
- Verify token has pinFileToIPFS permission
- Try smaller batch upload first

---

**Ready to deploy? Start with testnet first!** 🚀
