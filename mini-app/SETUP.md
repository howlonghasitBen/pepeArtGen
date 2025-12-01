# 🚀 Setup Guide

Complete setup instructions for the Pepe Card Generator Mini-app.

## Step 1: Install Dependencies

```bash
cd mini-app
npm install
```

## Step 2: Get API Keys

### Google AI API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

### WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a free account
3. Create a new project
4. Copy the Project ID

## Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your keys:

```env
# Required
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
API_KEY=AIza...
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# For contract deployment (optional for dev)
DEPLOYER_PRIVATE_KEY=your_private_key
BASESCAN_API_KEY=your_basescan_key
```

## Step 4: Deploy Smart Contract

### Option A: Use Testnet (Recommended for Testing)

```bash
npm run deploy:contract -- --network baseSepolia
```

You'll need:
- Testnet ETH on Base Sepolia (get from [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))
- Update your `.env` with the contract address

### Option B: Use Mainnet (Production)

```bash
npm run deploy:contract -- --network base
```

You'll need:
- Real ETH on BASE mainnet
- USDC for testing mints

After deployment, add the contract address to `.env`:

```env
VITE_NFT_CONTRACT_ADDRESS=0x...
```

## Step 5: Run Development Server

```bash
npm run dev
```

This starts:
- Frontend on `http://localhost:3000`
- API server on `http://localhost:3001`

## Step 6: Test the App

1. Open `http://localhost:3000` in your browser
2. Enter a monster name (try "Shadow Dragon")
3. Click "Generate Card"
4. Wait ~15 seconds for generation
5. Swipe to curate!
6. Connect wallet and mint (testnet only!)

## 🎯 Quick Test Workflow

```bash
# 1. Install
npm install

# 2. Setup .env
cp .env.example .env
# Add your GOOGLE_GENERATIVE_AI_API_KEY

# 3. Skip contract deployment for now (just test generation)
npm run dev

# 4. Generate test cards without minting
# Just try the generation and swipe features
```

## ⚡ Troubleshooting

### "WalletConnect Not Configured" warning
- **CRITICAL**: WalletConnect requires a valid project ID to function
- Get a free project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)
- Add to `.env`: `VITE_WALLETCONNECT_PROJECT_ID=your_project_id`
- Restart dev server after adding the ID
- Without this, wallet connections will NOT work

### "API_KEY not found"
- Make sure `.env` exists
- Check `GOOGLE_GENERATIVE_AI_API_KEY` is set
- Restart dev server after adding keys

### "Module not found"
- Run `npm install` again
- Delete `node_modules` and reinstall

### Contract deployment fails
- Check you have ETH on the network
- Verify `DEPLOYER_PRIVATE_KEY` is correct
- Try testnet first (baseSepolia)

### Minting fails
- Make sure contract is deployed
- Check `VITE_NFT_CONTRACT_ADDRESS` is set
- Verify you have USDC in your wallet
- Approve USDC spending first

## 🎓 Learning Path

### Just want to try card generation?
1. Get Google AI API key
2. Run `npm run dev`
3. Generate cards (no wallet needed)

### Want to test full minting flow?
1. Deploy to Base Sepolia testnet
2. Get testnet ETH and USDC
3. Connect Coinbase Wallet
4. Mint test NFTs

### Ready for production?
1. Deploy to BASE mainnet
2. Add real USDC to wallet
3. Deploy frontend to hosting
4. Share with users!

## 📱 Mobile Testing

To test on your phone:

1. Find your local IP:
```bash
# Mac/Linux
ifconfig | grep inet

# Windows
ipconfig
```

2. Update `vite.config.js`:
```js
server: {
  host: '0.0.0.0',  // Add this
  port: 3000,
  // ...
}
```

3. Visit `http://YOUR_IP:3000` on your phone

## 🔐 Security Notes

- **Never commit `.env` to git**
- **Keep your private key safe**
- Use testnet for development
- Test thoroughly before mainnet deployment

## 🆘 Need Help?

- Check [README.md](README.md) for full documentation
- Review [Base Documentation](https://docs.base.org/)
- Check console for error messages

---

**Ready to build!** 🚀
