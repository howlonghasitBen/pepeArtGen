# 🚀 Quick Start: Deploy Your NFT Collection in 30 Minutes

This guide gets you from zero to deployed NFT contract on Base testnet.

## Prerequisites (5 min)

```bash
# 1. Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 2. Install Node.js (if not installed)
# Download from: https://nodejs.org/

# 3. Get Base Sepolia testnet ETH
# Visit: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
```

## Setup (10 min)

```bash
# 1. Navigate to contracts folder
cd pepeArtGen-contracts

# 2. Install Solidity dependencies
forge install OpenZeppelin/openzeppelin-contracts

# 3. Install Node dependencies
npm install

# 4. Create environment file
cp .env.example .env

# 5. Edit .env with your values
nano .env
```

### Required Environment Variables

Get these accounts set up first (see SETUP_GUIDE.md for details):

1. **PRIVATE_KEY**: Your wallet private key (from MetaMask)
2. **TREASURY_ADDRESS**: Where mint fees go (can be same wallet)
3. **ROYALTY_RECEIVER**: Where royalties go (can be same wallet)
4. **BASE_SEPOLIA_RPC_URL**: Get from Alchemy or use public RPC
5. **BASESCAN_API_KEY**: Get from basescan.org (free)
6. **PINATA_JWT**: Get from pinata.cloud (free tier OK)

## Test Locally (5 min)

```bash
# Run all tests
forge test -vv

# Check gas usage
forge test --gas-report

# Expected output:
# ✅ All tests passing
# ⛽ ~100k-150k gas per mint
```

## Deploy to Testnet (5 min)

```bash
# Deploy contract to Base Sepolia
npm run deploy:testnet

# Save the deployed contract address!
# Example output:
# WavesTCGNFT deployed at: 0x1234...5678
```

## Upload to IPFS (5 min)

```bash
# 1. Generate cards (if not done already)
cd ../pepeArtGen
node completeCardPipeline.mjs

# 2. Return to contracts folder
cd ../pepeArtGen-contracts

# 3. Upload to IPFS
npm run upload:ipfs

# 4. Save the metadata CID!
# Example output:
# ✅ Metadata uploaded: ipfs://QmXXX...
# Base URI: ipfs://QmXXX.../
```

## Update Contract (2 min)

```bash
# Set the baseURI in your deployed contract
cast send <YOUR_CONTRACT_ADDRESS> \
  "setBaseURI(string)" \
  "ipfs://QmYOUR_METADATA_CID/" \
  --rpc-url base_sepolia \
  --private-key $PRIVATE_KEY
```

## Test Mint (3 min)

```bash
# Mint your first NFT!
cast send <YOUR_CONTRACT_ADDRESS> \
  "mint(string)" \
  "1.json" \
  --value 0.001ether \
  --rpc-url base_sepolia \
  --private-key $PRIVATE_KEY

# View on OpenSea Testnet (wait 1-5 min for indexing):
# https://testnets.opensea.io/assets/base-sepolia/<CONTRACT_ADDRESS>/1
```

## Verify It Works ✅

Your NFT should show on OpenSea Testnet with:
- ✅ AI-generated card artwork
- ✅ Metadata (name, description, attributes)
- ✅ Trading card theme and colors
- ✅ Signature move and flavor text

## Deploy to Mainnet (When Ready!)

```bash
# 1. Fund your wallet with real Base ETH (~0.02 ETH)
# 2. Re-upload to IPFS for production (optional but recommended)
# 3. Deploy to Base mainnet
npm run deploy:mainnet

# 4. Update baseURI with production IPFS CID
cast send <MAINNET_CONTRACT_ADDRESS> \
  "setBaseURI(string)" \
  "ipfs://QmPRODUCTION_CID/" \
  --rpc-url base \
  --private-key $PRIVATE_KEY

# 5. Share your collection!
# OpenSea: https://opensea.io/assets/base/<CONTRACT>/1
```

## Troubleshooting

### "Insufficient funds" error
- Make sure you have Base Sepolia ETH (not regular ETH)
- Use the faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### "Contract verification failed"
- Wait 1-2 minutes and deployment should auto-verify
- Check your BASESCAN_API_KEY in .env

### OpenSea not showing NFT
- Wait 1-5 minutes for indexing
- Verify tokenURI works: `cast call <CONTRACT> "tokenURI(uint256)" 1 --rpc-url base_sepolia`
- Check IPFS gateway is accessible

### IPFS upload fails
- Verify PINATA_JWT in .env is correct
- Check you ran pepeArtGen pipeline first
- Try uploading smaller batch

## Next Steps

1. **Test thoroughly** on testnet before mainnet
2. **Create frontend** for minting (see README.md for React examples)
3. **Set up monitoring** for mint events
4. **Configure royalties** in OpenSea collection settings
5. **Launch mainnet** when ready!

## Cost Summary

- **Testnet**: FREE (just need testnet ETH)
- **Mainnet Contract Deployment**: ~$2-5 (one-time)
- **Each Mint**: ~$0.015-0.02 on Base L2
- **IPFS Storage**: $0-20/month (free tier or Picnic)

## Resources

- Full docs: See README.md
- Setup guide: See SETUP_GUIDE.md
- Architecture: See architecture guide in parent folder
- Base docs: https://docs.base.org/
- OpenSea docs: https://docs.opensea.io/

## Support

Questions? Check:
1. README.md (comprehensive guide)
2. SETUP_GUIDE.md (account setup)
3. Test suite (test/WavesTCGNFT.t.sol)
4. Foundry Book: https://book.getfoundry.sh/

---

**Built for the SURF Waves Collection** 🌊

Time to deploy: ~30 minutes
Cost: $0 (testnet) or ~$5 (mainnet)
Result: Production NFT contract + AI-generated cards! 🎴✨
