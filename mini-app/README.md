# 🃏 Pepe Card Generator - Base Mini-app

A mobile-friendly card generator mini-app built on Coinbase's Base chain. Generate AI-powered trading cards, swipe to curate, and mint on BASE for 1 USDC.

## ✨ Features

- 🎨 **AI Card Generation**: Generate unique monster cards using Google's Gemini API
- 📱 **Mobile-First Design**: Swipe gestures optimized for mobile
- 🔄 **Swipe to Curate**: Left to discard, right to mint
- 🪙 **BASE Chain Minting**: Mint NFTs for 1 USDC each
- 💰 **Free Tier Friendly**: 100 free generations per day (Gemini + Imagen)
- 🎯 **Batch Generation**: Generate up to 10 cards at once
- 🔗 **Coinbase Wallet Integration**: Connect with Coinbase Smart Wallet

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Google AI API Key ([Get one here](https://aistudio.google.com/app/apikey))
- WalletConnect Project ID ([Get one here](https://cloud.walletconnect.com/))

### Installation

```bash
cd mini-app
npm install
```

### Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your API keys:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
API_KEY=your_google_ai_api_key
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### Deploy Smart Contract (Required)

Before running the app, deploy the minting contract to BASE:

```bash
# For testnet (Base Sepolia)
npm run deploy:contract -- --network baseSepolia

# For mainnet (BASE)
npm run deploy:contract -- --network base
```

After deployment, add the contract address to `.env`:
```env
VITE_NFT_CONTRACT_ADDRESS=0x...
```

### Run Development Server

```bash
npm run dev
```

This starts:
- Frontend: `http://localhost:3000`
- API Server: `http://localhost:3001`

## 📖 How It Works

### 1. Generate Cards

- **Single Mode**: Enter one monster name
- **Batch Mode**: Enter up to 10 monster names (comma or newline separated)
- Click "Generate Card(s)" and wait ~10-15 seconds per card

### 2. Curate with Swipes

- **Swipe Left** or tap **✗**: Discard card
- **Swipe Right** or tap **✓**: Mark for minting
- **Undo**: Go back one card

### 3. Mint on BASE

- Review selected cards
- Connect Coinbase Wallet
- Approve USDC spending (one-time)
- Mint all selected cards for 1 USDC each

## 🏗️ Architecture

### Frontend (`src/`)

```
src/
├── components/
│   ├── GeneratorScreen.jsx    # Card generation UI
│   ├── CurationScreen.jsx     # Swipe curation UI
│   ├── SwipeableCard.jsx      # Card with swipe gestures
│   └── MintingModal.jsx       # Minting interface
├── hooks/
│   └── useMintCard.js         # Web3 minting logic
├── contracts/
│   └── abi.json               # Smart contract ABI
└── App.jsx                    # Main app with wallet setup
```

### Backend (`server/`)

```
server/
└── api.mjs                    # Express API for card generation
```

### Smart Contracts (`contracts/`)

```
contracts/
└── PepeCardNFT.sol            # ERC-721 NFT contract
```

## 🔧 Configuration

### Free Tier Limits

- **Imagen**: 100 images/day
- **Gemini**: 1,500 requests/day
- **Batch Size**: 10 cards max

### Smart Contract

- **Chain**: BASE (Mainnet: 8453, Sepolia: 84532)
- **Mint Fee**: 1 USDC per card
- **USDC Address**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (BASE Mainnet)

## 📱 Base Mini-app Integration

This project is built as a Coinbase Base Mini-app following the official quickstart:

- Uses RainbowKit for wallet connection
- Optimized for mobile browsers
- Integrates with Coinbase Smart Wallet
- Deployed on BASE L2

### Base Mini-app Configuration

The app is configured for BASE with:
- Wagmi v2 for Web3 interactions
- RainbowKit for wallet UI
- Viem for contract calls
- BASE chain as primary network

## 🎨 Card Generation

### AI Pipeline

1. **Image Generation**: Google Imagen generates card art from monster name
2. **Move Generation**: Gemini analyzes image and creates signature move
3. **Flavor Text**: Gemini writes atmospheric flavor text
4. **Stats**: Random stats (level, attack, defense, HP, mana)

### Example Card

```json
{
  "id": "shadowdragon-123456",
  "name": "Shadow Dragon",
  "move": "Void Collapse",
  "flavorText": "Where its presence lingers, light itself forgets how to exist.",
  "stats": {
    "level": "1",
    "attack": "5",
    "defense": "4",
    "hp": "8",
    "manaCost": "3"
  }
}
```

## 🧪 Testing

### Local Testing

```bash
# Run development server
npm run dev

# Generate test cards
# Visit http://localhost:3000
# Try: "Fire Dragon", "Ice Wizard", "Shadow Assassin"
```

### Contract Testing

```bash
# Deploy to testnet first
npm run deploy:contract -- --network baseSepolia

# Test minting with testnet USDC
# Get testnet USDC from Base Sepolia faucet
```

## 🚢 Deployment

### Frontend Deployment

```bash
npm run build
# Deploy `dist/` folder to your hosting (Vercel, Netlify, etc.)
```

### Contract Deployment

```bash
# Production deployment
npm run deploy:contract -- --network base
```

### Environment Variables for Production

```env
VITE_NFT_CONTRACT_ADDRESS=0x...  # Your deployed contract
VITE_WALLETCONNECT_PROJECT_ID=...
```

## 💡 Tips

### Generating Better Cards

- Use descriptive monster names: "Ancient Fire Dragon" > "Dragon"
- Try different themes: fantasy, sci-fi, horror, etc.
- Batch generate for variety

### Optimizing Costs

- Generate on free tier (100/day)
- Only mint your best cards
- Use batch minting (same gas as single mint)

### Mobile UX

- Works best on iOS Safari / Chrome
- Swipe gestures feel natural on touch screens
- Can also use buttons if swiping doesn't work

## 🐛 Troubleshooting

### "Daily limit reached"

- Free tier allows 100 generations/day
- Resets every 24 hours
- Upgrade to paid tier for more

### "NFT contract not deployed"

- Run `npm run deploy:contract`
- Add contract address to `.env`

### "Transaction failed"

- Check USDC balance
- Ensure USDC approval
- Try again with higher gas

### Swipe not working

- Use action buttons instead
- Check if touch events are enabled
- Try on different browser

## 📚 Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: CSS3, Framer Motion
- **Web3**: Wagmi v2, RainbowKit, Viem
- **Backend**: Express, Node.js
- **AI**: Google Gemini, Imagen
- **Blockchain**: BASE L2, Solidity 0.8.20
- **NFT Standard**: ERC-721

## 🔗 Links

- [Base Documentation](https://docs.base.org/)
- [Base Mini-apps Guide](https://docs.base.org/mini-apps/quickstart/create-new-miniapp)
- [RainbowKit Docs](https://www.rainbowkit.com/)
- [Google AI Studio](https://aistudio.google.com/)

## 📄 License

MIT License - See parent project LICENSE

## 🙏 Credits

Built with:
- Google Gemini & Imagen APIs
- Coinbase Base L2
- RainbowKit wallet connector
- React Spring for animations

---

**Ready to generate epic cards!** 🎴✨

Start with: `npm run dev`
