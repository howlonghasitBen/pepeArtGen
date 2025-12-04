# CLAUDE.md - AI Assistant Development Guide

**Last Updated:** December 3, 2025
**Repository:** pepeArtGen (SURF Waves TCG Collection)
**Purpose:** Comprehensive guide for AI assistants working on this codebase

---

## 🎯 Project Overview

**SURF Waves Trading Card Generator** is a dual-component system for creating, minting, and managing AI-generated NFT trading cards on Base L2 blockchain.

### Core Components

1. **Card Generation Pipeline** (Node.js) - Root directory
   - AI-powered card content generation using Google Gemini & Imagen
   - Two generators: `completeCardPipeline.mjs` (with image gen) & `unifiedCardGenerator.mjs` (existing images)
   - Outputs: React-ready card data, themes, NFT metadata

2. **Mini-App** (React + Web3) - `/mini-app` directory
   - Full-stack Web3 application for card generation, curation, and minting
   - USDC payment integration via Circle API
   - NFT minting via custom ERC-721 contract on Base L2
   - Supabase backend for data persistence

---

## 📁 Repository Structure

```
pepeArtGen/
├── Root Level - Card Generation Pipeline
│   ├── completeCardPipeline.mjs      # Generate cards from prompts (with AI images)
│   ├── unifiedCardGenerator.mjs      # Generate cards from existing images
│   ├── curate.mjs                    # Card curation utility
│   ├── testColorExtraction.mjs       # Color palette testing
│   ├── MEGA_FLAVOR_STYLES.js         # Legacy flavor text styles (deprecated)
│   ├── package.json                  # Node.js dependencies
│   └── Documentation/
│       ├── START_HERE.md             # Entry point for users
│       ├── README.md                 # Overview & features
│       ├── QUICKSTART.md             # 5-minute tutorial
│       ├── COMPLETE_PIPELINE_GUIDE.md
│       ├── UNIFIED_GENERATOR_GUIDE.md
│       ├── HOW_IT_WORKS.md           # Technical architecture
│       ├── CONFIGURATION.md          # All config options
│       ├── TROUBLESHOOTING.md
│       ├── DOCUMENTATION_GUIDE.md
│       ├── CURATION_GUIDE.md
│       └── WHITEPAPER.md             # Project vision
│
└── mini-app/ - Full-Stack Web3 Application
    ├── src/
    │   ├── components/               # React UI components
    │   │   ├── GeneratorScreen.jsx   # Main card generation UI
    │   │   ├── CurationScreen.jsx    # Card curation interface
    │   │   ├── MyCardsScreen.jsx     # User's minted cards
    │   │   ├── SwipeableCard.jsx     # Interactive card display
    │   │   ├── PaymentModal.jsx      # USDC payment flow
    │   │   ├── MintingModal.jsx      # NFT minting UI
    │   │   ├── MintSuccessModal.jsx  # Post-mint display
    │   │   └── ...
    │   ├── hooks/
    │   │   ├── useGenerationPayment.js  # USDC payment logic
    │   │   ├── useMintCard.js           # NFT minting logic
    │   │   ├── useMyCards.js            # Fetch user's cards
    │   │   └── useAllCards.js           # Fetch all cards
    │   ├── context/
    │   │   └── Web3Context.jsx       # Web3 provider setup
    │   ├── contracts/
    │   │   ├── PepeCardNFT.json      # ABI for NFT contract
    │   │   ├── abi.json              # Contract ABIs
    │   │   └── WavesTCGNFT.json
    │   ├── public/                   # Static assets
    │   ├── App.jsx                   # Main app component
    │   └── main.jsx                  # React entry point
    │
    ├── server/                       # Express.js backend
    │   ├── api.mjs                   # Main API server
    │   ├── paymentRoutes.mjs         # USDC payment endpoints
    │   ├── mintRoutes.mjs            # NFT minting endpoints
    │   ├── verifyPayment.mjs         # Payment verification
    │   ├── supabaseClient.mjs        # Supabase connection
    │   ├── cardRenderer.mjs          # Card image generation
    │   ├── cardHTMLGenerator.mjs     # HTML template for cards
    │   └── ipfsUpload.mjs            # IPFS upload utilities
    │
    ├── contracts/                    # Solidity smart contracts
    │   └── PepeCardNFT.sol           # ERC-721 NFT contract
    │
    ├── scripts/                      # Deployment scripts
    ├── test/                         # Foundry tests
    ├── supabase/                     # Supabase migrations
    │
    ├── Documentation/
    │   ├── README.md                 # Mini-app overview
    │   ├── DEPLOYMENT_GUIDE.md
    │   ├── INTEGRATION_GUIDE.md
    │   ├── CARD_RENDERING_GUIDE.md
    │   ├── ANIMATION_URL_GUIDE.md
    │   └── LOCAL_TESTING.md
    │
    ├── package.json                  # Frontend dependencies
    ├── vite.config.js                # Vite configuration
    ├── hardhat.config.js             # Hardhat (legacy)
    ├── foundry.toml                  # Foundry configuration
    └── Dockerfile                    # Container deployment
```

---

## 🛠️ Tech Stack

### Root Pipeline (Card Generation)
- **Runtime:** Node.js >=18.0.0
- **AI Services:**
  - Google Imagen 4.0 (image generation)
  - Google Gemini 2.0/2.5 Flash (text generation, vision analysis)
- **Libraries:**
  - `@google/genai` - Google AI API client
  - `@ai-sdk/google` - Vercel AI SDK wrapper
  - `node-vibrant` - Color palette extraction
  - `dotenv` - Environment management

### Mini-App Frontend
- **Framework:** React 18.3.1
- **Build Tool:** Vite 6.0.7
- **Web3 Stack:**
  - `wagmi` 2.12.33 - React Hooks for Ethereum
  - `viem` 2.21.53 - TypeScript Ethereum library
  - `@reown/appkit` 1.5.0 - Wallet connection UI
  - `ethers` 6.13.4 - Ethereum utilities
- **Animation:**
  - `@react-spring/web` 9.7.5 - Spring animations
  - `@use-gesture/react` 10.3.1 - Gesture handling
- **State Management:**
  - `@tanstack/react-query` 5.62.0 - Server state
- **Backend Client:**
  - `@supabase/supabase-js` 2.49.2

### Mini-App Backend
- **Server:** Express.js 4.21.2
- **Database:** Supabase (PostgreSQL)
- **Storage:** IPFS via Pinata 2.5.1
- **Rendering:** Puppeteer 24.31.0 (headless browser for card images)
- **Payment:** Circle USDC API

### Smart Contracts
- **Language:** Solidity ^0.8.0
- **Framework:** Foundry (preferred), Hardhat (legacy)
- **Standards:** ERC-721, ERC-2981 (royalties)
- **Network:** Base L2 (Mainnet & Sepolia testnet)
- **Libraries:** OpenZeppelin Contracts

---

## 🔑 Environment Variables

### Root Pipeline (.env)
```bash
# For Complete Pipeline (image generation)
API_KEY=your_google_ai_studio_key

# For Unified Generator (text generation only)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_studio_key
```

### Mini-App (.env)
```bash
# Frontend
VITE_REOWN_PROJECT_ID=your_reown_project_id
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CONTRACT_ADDRESS=deployed_nft_contract_address
VITE_USDC_CONTRACT_ADDRESS=base_usdc_contract_address
VITE_SERVER_URL=http://localhost:3001

# Backend (server/.env)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
PINATA_JWT=your_pinata_jwt_token
PINATA_GATEWAY_URL=your_pinata_gateway
CIRCLE_API_KEY=your_circle_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Smart Contract Deployment
PRIVATE_KEY=deployment_wallet_private_key
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=your_basescan_api_key
```

---

## 🚀 Development Workflows

### Setting Up Development Environment

```bash
# 1. Clone and install root dependencies
git clone <repo-url>
cd pepeArtGen
npm install

# 2. Set up root environment
cp .env.example .env
# Edit .env with your Google AI key

# 3. Install mini-app dependencies
cd mini-app
npm install

# 4. Set up mini-app environment
cp .env.template .env
# Edit .env with all required keys

# 5. Install Foundry (for smart contracts)
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge install OpenZeppelin/openzeppelin-contracts
```

### Common Development Commands

#### Root Pipeline
```bash
# Generate cards from scratch (with AI images)
node completeCardPipeline.mjs

# Generate cards from existing images
mkdir input_dir
# Add images to input_dir/
node unifiedCardGenerator.mjs

# Test color extraction
node testColorExtraction.mjs

# Curate generated cards
node curate.mjs
```

#### Mini-App Development
```bash
cd mini-app

# Run full stack (frontend + backend)
npm run dev:all

# Run frontend only
npm run dev

# Run backend only
npm run dev:server

# Build for production
npm run build

# Preview production build
npm run preview
```

#### Smart Contract Development
```bash
cd mini-app

# Run tests
npm run test
forge test -vv

# Gas report
npm run test:gas

# Coverage
npm run test:coverage

# Deploy to testnet
npm run deploy:card:testnet

# Deploy to mainnet (CAREFUL!)
npm run deploy:card:mainnet
```

---

## 🏗️ Architecture Patterns & Conventions

### Card Generation Pipeline

#### 1. Intelligent Content Generation System
The system uses **contextual AI generation**, not templates:

```javascript
// OLD (deprecated): Random flavor text styles
const randomStyle = MEGA_FLAVOR_STYLES[Math.floor(Math.random() * 51)];

// NEW (current): Image-based contextual generation
const signatureMove = await generateSignatureMove(imageBuffer);
const flavorText = await generateFlavorText(imageBuffer, signatureMove);
```

**Key Principle:** Every card's content is unique and based on visual analysis.

#### 2. Unified Format for Moves + Flavor
All cards use this format in the flavor text field:
```
[SIGNATURE MOVE]
[Atmospheric flavor text that references the move]
```

Example:
```
Shadow Consumption
Where its presence lingers, light itself forgets how to exist.
Those who witness the collapse speak only in whispers, if they speak at all.
```

#### 3. Color Theme Generation
Extracted from images, converted to React CSS objects:

```javascript
// Color extraction with node-vibrant
const palette = await Vibrant.from(imagePath).getPalette();

// Theme object structure
{
  id: "card_name",
  name: "Card Name",
  colors: {
    primary: "#HEX",
    secondary: "#HEX",
    accent: "#HEX",
    // ... 6 colors total
  },
  gradients: {
    main: "linear-gradient(...)",
    card: "linear-gradient(...)",
    border: "linear-gradient(...)"
  }
}
```

#### 4. NFT Metadata Standard
Two variants per card:
- **1/1 Edition:** Unique, higher value
- **Common Edition:** Multiple copies

```javascript
{
  name: "Card Name #1",
  description: "...",
  image: "ipfs://...",
  animation_url: "https://yoursite.com/card/card-name",
  external_url: "https://yoursite.com",
  attributes: [
    { trait_type: "Level", value: "1" },
    { trait_type: "Attack", value: "3" },
    { trait_type: "Defense", value: "3" },
    { trait_type: "HP", value: "5" },
    { trait_type: "Mana Cost", value: "2" },
    { trait_type: "Terrain", value: "?" },
    { trait_type: "Edition", value: "1/1" },
    { trait_type: "Artist", value: "SURF FINANCE STUDIOS" }
  ]
}
```

### Mini-App Architecture

#### 1. Web3 Context Pattern
All Web3 interactions go through centralized context:

```jsx
// src/context/Web3Context.jsx
<Web3ContextProvider>
  {/* All wallet, chain, and contract state */}
  <App />
</Web3ContextProvider>
```

#### 2. Custom Hooks for Web3 Operations
- `useGenerationPayment.js` - USDC payments for generation
- `useMintCard.js` - NFT minting with payment
- `useMyCards.js` - Fetch user's cards from Supabase
- `useAllCards.js` - Fetch all cards

**Pattern:**
```javascript
const { pay, isPaying, error } = useGenerationPayment();
const { mintCard, isMinting, mintError } = useMintCard();
```

#### 3. Server Route Organization
```
/api/payment/* - USDC payment processing
/api/mint/*    - NFT minting and metadata
/api/cards/*   - Card data operations
```

#### 4. Error Handling Convention
Always use try-catch with user-friendly messages:

```javascript
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  console.error('[Context] Operation failed:', error);
  return {
    success: false,
    error: error.message || 'Operation failed'
  };
}
```

#### 5. Payment Flow Architecture
```
User clicks "Generate Card"
  ↓
PaymentModal appears
  ↓
User approves USDC spend (if needed)
  ↓
User sends USDC to treasury
  ↓
Backend verifies payment on-chain
  ↓
Backend generates card with AI
  ↓
Backend saves to Supabase
  ↓
Frontend displays generated card
```

#### 6. Minting Flow Architecture
```
User selects card to mint
  ↓
MintingModal appears
  ↓
User pays mint price in ETH
  ↓
Smart contract mints NFT
  ↓
Backend captures card as image (Puppeteer)
  ↓
Backend uploads to IPFS (Pinata)
  ↓
Backend updates metadata with IPFS hash
  ↓
NFT appears in user's wallet
  ↓
MintSuccessModal displays card
```

---

## 📝 Code Style & Conventions

### File Naming
- **React Components:** PascalCase - `GeneratorScreen.jsx`
- **Hooks:** camelCase with 'use' prefix - `useMintCard.js`
- **Utilities:** camelCase - `cardRenderer.mjs`
- **Constants/Config:** UPPER_CASE - `CONFIG` object
- **Contracts:** PascalCase - `PepeCardNFT.sol`

### Import Order
```javascript
// 1. External dependencies
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

// 2. Internal utilities/hooks
import { useMintCard } from '../hooks/useMintCard';

// 3. Components
import PaymentModal from './PaymentModal';

// 4. Styles/assets (if any)
import './styles.css';
```

### Component Structure (React)
```jsx
// 1. Imports
import { useState } from 'react';

// 2. Component definition
function ComponentName({ prop1, prop2 }) {
  // 3. Hooks
  const [state, setState] = useState(null);

  // 4. Effects
  useEffect(() => {
    // ...
  }, []);

  // 5. Event handlers
  const handleClick = () => {
    // ...
  };

  // 6. Render helpers
  const renderItem = () => {
    // ...
  };

  // 7. Return JSX
  return (
    <div>
      {/* ... */}
    </div>
  );
}

// 8. Export
export default ComponentName;
```

### Smart Contract Patterns
```solidity
// 1. License and pragma
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

// 2. Imports (OpenZeppelin first)
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// 3. Contract with NatSpec comments
/**
 * @title PepeCardNFT
 * @notice ERC-721 NFT contract for SURF Waves cards
 */
contract PepeCardNFT is ERC721, ... {
  // 4. Custom errors (gas efficient)
  error InsufficientPayment();
  error MaxSupplyReached();

  // 5. State variables
  uint256 public constant MAX_SUPPLY = 10000;

  // 6. Events
  event CardMinted(address indexed to, uint256 indexed tokenId);

  // 7. Modifiers
  modifier onlyWhenNotPaused() { ... }

  // 8. Constructor
  constructor() { ... }

  // 9. External functions
  function mint() external payable { ... }

  // 10. Public functions
  function tokenURI() public view { ... }

  // 11. Internal functions
  function _baseURI() internal view { ... }

  // 12. Private functions
  function _doSomething() private { ... }
}
```

---

## 🧪 Testing Guidelines

### Root Pipeline Testing
```bash
# Test with small batch first
# Edit completeCardPipeline.mjs:
const CONFIG = {
  numberOfCards: 3,  // Start small!
  // ...
};

# Then run
node completeCardPipeline.mjs

# Check output in complete-cards/ or generated-cards/
```

### Mini-App Frontend Testing
```bash
# Start dev server
cd mini-app
npm run dev:all

# Test wallet connection
# - Click Connect Wallet
# - Approve connection
# - Verify address displays

# Test card generation
# - Navigate to Generator
# - Click "Generate Card"
# - Approve USDC spend
# - Verify card appears

# Test minting
# - Go to Curation
# - Click "Mint"
# - Pay mint fee
# - Verify NFT in wallet
```

### Smart Contract Testing
```bash
cd mini-app

# Run all tests
forge test -vv

# Test specific function
forge test --match-test test_Mint_Success -vvv

# Gas optimization check
forge test --gas-report

# Coverage
forge coverage

# Fork testing (test against live Base)
forge test --fork-url $BASE_RPC_URL -vvv
```

---

## 🚢 Deployment Guide

### Root Pipeline Output
**No deployment needed** - outputs are files to be integrated into React app:

1. Copy `generated-cards/generatedThemes.js` to React `src/data/`
2. Copy `generated-cards/generatedCardData.js` to React `src/data/`
3. Upload images to hosting (GitHub Pages, Vercel, etc.)
4. Upload metadata to IPFS via Pinata

### Mini-App Deployment

#### Frontend (Vercel/Netlify)
```bash
cd mini-app

# Build
npm run build

# Deploy to Vercel
vercel deploy --prod

# Or Netlify
netlify deploy --prod --dir=dist
```

#### Backend (Railway/Render)
```bash
# Backend runs on separate server
# Uses server/api.mjs as entry point

# Railway: Auto-deploys from git
# Render: Set start command to "npm run server"

# Environment variables must be set in platform UI
```

#### Smart Contracts (Base L2)
```bash
cd mini-app

# 1. Test on Sepolia first
npm run deploy:card:testnet

# 2. Verify contract
# (automatic with --verify flag)

# 3. Update .env with deployed address
VITE_CONTRACT_ADDRESS=0x...

# 4. Deploy to mainnet (after thorough testing)
npm run deploy:card:mainnet
```

---

## 🎯 Common Tasks for AI Assistants

### 1. Adding a New Card Attribute
```javascript
// Location: Root pipeline config
defaultStats: {
  level: "1",
  attack: "3",
  defense: "3",
  hp: "5",
  manaCost: "2",
  terrain: "?",
  newAttribute: "value",  // Add here
}

// Also update NFT metadata generation in:
// - completeCardPipeline.mjs (line ~400)
// - unifiedCardGenerator.mjs (line ~300)
```

### 2. Modifying AI Prompts
```javascript
// Signature move generation
// Location: completeCardPipeline.mjs or unifiedCardGenerator.mjs
const movePrompt = `
  Based on this image, create a 2-5 word signature move name.
  Make it evocative and powerful.
  Examples: "Void Collapse", "Tidal Devastation"
`;

// Flavor text generation
const flavorPrompt = `
  Write atmospheric flavor text (2-3 sentences) that:
  1. References the signature move: "${signatureMove}"
  2. Creates emotional impact
  3. Uses sensory details
  4. Maintains mystery
`;
```

### 3. Adding a Payment Method
```javascript
// Location: mini-app/src/hooks/useGenerationPayment.js
// Current: USDC only
// To add ETH payment:

const payWithETH = async () => {
  const tx = await sendTransaction({
    to: TREASURY_ADDRESS,
    value: parseEther(GENERATION_PRICE_ETH),
  });
  await waitForTransactionReceipt(tx.hash);
  // Verify and generate card
};
```

### 4. Changing Smart Contract Parameters
```solidity
// Location: mini-app/contracts/PepeCardNFT.sol
constructor(
  address _treasury,
  address _royaltyReceiver
) ERC721("SURF Waves Cards", "WAVE") {
  MAX_SUPPLY = 10000;          // Change max supply
  mintPrice = 0.001 ether;     // Change mint price
  cooldownPeriod = 60 seconds; // Change cooldown
  // ...
}
```

### 5. Updating Frontend Card Display
```jsx
// Location: mini-app/src/components/SwipeableCard.jsx
// Modify the card HTML structure, animations, or styling
```

### 6. Adding New API Endpoints
```javascript
// Location: mini-app/server/api.mjs
app.post('/api/new-endpoint', async (req, res) => {
  try {
    const { param1, param2 } = req.body;

    // Validate inputs
    if (!param1) {
      return res.status(400).json({ error: 'param1 required' });
    }

    // Process
    const result = await doSomething(param1, param2);

    // Return
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## ⚠️ Important Gotchas & Known Issues

### 1. Rate Limits
- **Imagen:** 100 images/day (free tier)
- **Gemini:** 1,500 requests/day (free tier)
- **Solution:** Adjust delays or upgrade to paid tier

```javascript
// Increase delays if hitting rate limits
delayBetweenImages: 8000,      // 8 seconds
delayBetweenFlavorText: 6000,  // 6 seconds
```

### 2. IPFS Gateway Delays
IPFS can be slow. Always use a pinning service (Pinata/Filebase):
```javascript
// Use dedicated gateway, not public
PINATA_GATEWAY_URL=gateway.pinata.cloud/ipfs/
// NOT: ipfs.io/ipfs/ (slow, unreliable)
```

### 3. Base L2 RPC Rate Limits
Free RPC endpoints have limits. Use Alchemy/Infura for production:
```bash
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
# NOT: https://mainnet.base.org (rate limited)
```

### 4. USDC Approval Flow
Users must approve USDC spending before payment:
```javascript
// ALWAYS check allowance first
const allowance = await usdcContract.allowance(userAddress, treasuryAddress);
if (allowance < paymentAmount) {
  await usdcContract.approve(treasuryAddress, paymentAmount);
  // Wait for approval tx to confirm
}
// Then transfer
await usdcContract.transfer(treasuryAddress, paymentAmount);
```

### 5. Puppeteer Memory Issues
Card rendering can be memory-intensive:
```javascript
// Close browser after each render
const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();
  // ... render card
} finally {
  await browser.close(); // Critical!
}
```

### 6. Smart Contract Gas Optimization
Always test gas costs before mainnet:
```bash
forge test --gas-report

# Look for expensive operations:
# - SSTORE (storage writes): ~20k gas
# - External calls: varies
# - Loops: multiply cost by iterations
```

### 7. React Component Re-renders
Use React.memo and useMemo for expensive operations:
```jsx
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => {
    return heavyComputation(data);
  }, [data]);

  return <div>{processedData}</div>;
});
```

---

## 📚 Key Files Reference

### Must-Read Before Modifying

| File | Purpose | Critical Points |
|------|---------|----------------|
| `completeCardPipeline.mjs` | Full card generation | AI prompts, image generation, rate limits |
| `unifiedCardGenerator.mjs` | Existing image processing | Color extraction, AI analysis |
| `mini-app/src/App.jsx` | Main app component | Routing, screen management |
| `mini-app/server/api.mjs` | Backend server | All API endpoints |
| `mini-app/server/paymentRoutes.mjs` | USDC payments | Payment verification logic |
| `mini-app/server/mintRoutes.mjs` | NFT minting | IPFS upload, metadata creation |
| `mini-app/contracts/PepeCardNFT.sol` | NFT contract | Minting logic, access control |
| `mini-app/src/context/Web3Context.jsx` | Web3 provider | Wallet, chain, contract setup |

### Configuration Files

| File | Purpose |
|------|---------|
| `.env` (root) | Google AI API keys |
| `mini-app/.env` | All frontend/backend env vars |
| `mini-app/foundry.toml` | Solidity compiler settings |
| `mini-app/vite.config.js` | Frontend build config |
| `mini-app/hardhat.config.js` | Legacy - prefer Foundry |

### Documentation Map

| Question | Read This |
|----------|-----------|
| "How do I get started?" | `START_HERE.md` |
| "What does this project do?" | `README.md` |
| "How do I generate cards?" | `QUICKSTART.md` |
| "How does the AI work?" | `HOW_IT_WORKS.md` |
| "What can I configure?" | `CONFIGURATION.md` |
| "Something broke!" | `TROUBLESHOOTING.md` |
| "How do I deploy?" | `mini-app/DEPLOYMENT_GUIDE.md` |
| "How do cards render?" | `mini-app/CARD_RENDERING_GUIDE.md` |

---

## 🤖 AI Assistant Guidelines

### When Making Changes

1. **Always read existing files first**
   - Use Read tool before editing
   - Understand current implementation
   - Don't propose changes blindly

2. **Respect existing patterns**
   - Follow established code style
   - Use same naming conventions
   - Match error handling approach

3. **Test incrementally**
   - Small changes first
   - Verify each step works
   - Don't batch multiple risky changes

4. **Update documentation**
   - If changing behavior, update relevant .md files
   - Keep CLAUDE.md current
   - Add comments for complex logic

5. **Security first**
   - Never commit private keys or secrets
   - Validate all user inputs
   - Use parameterized queries (Supabase)
   - Check for common vulnerabilities (XSS, injection, etc.)

### When Deploying

1. **Never push to main/master directly**
   - Always use feature branches
   - Branch naming: `claude/feature-description-sessionid`
   - Example: `claude/add-new-payment-method-abc123`

2. **Smart contract deployment is IRREVERSIBLE**
   - Test thoroughly on Sepolia first
   - Verify all parameters
   - Double-check addresses
   - Get user confirmation before mainnet deploy

3. **Environment variables**
   - Never hardcode secrets
   - Always use .env files
   - Verify correct env file is loaded

### When Stuck

1. **Check documentation first**
   - Comprehensive guides exist
   - TROUBLESHOOTING.md covers common issues
   - HOW_IT_WORKS.md explains architecture

2. **Search codebase**
   - Use Grep tool for similar patterns
   - Look for existing implementations
   - Check git history for context

3. **Ask user for clarification**
   - If requirements are ambiguous
   - If multiple approaches exist
   - If change affects existing functionality

### Code Quality Checklist

Before committing changes:

- [ ] Code follows existing style
- [ ] No hardcoded secrets or keys
- [ ] Error handling is comprehensive
- [ ] User-facing messages are clear
- [ ] Gas costs are reasonable (if smart contract)
- [ ] No console.logs in production code (backend OK, frontend remove)
- [ ] Dependencies are necessary and documented
- [ ] Breaking changes are discussed with user
- [ ] Tests pass (if applicable)
- [ ] Documentation is updated

---

## 🔄 Git Workflow

### Branch Strategy
```bash
# Current working branch
claude/claude-md-miqo0dolx54602d1-0174xdHDCfr5uFZaWwAYruJq

# Always develop on claude/* branches
# Format: claude/<feature-description>-<session-id>

# Create new branch
git checkout -b claude/new-feature-abc123

# Make changes, commit
git add .
git commit -m "Add new feature: description"

# Push with -u flag
git push -u origin claude/new-feature-abc123
```

### Commit Message Format
```
<type>: <short description>

<detailed explanation if needed>

<breaking changes if any>
```

Types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style (no functionality change)
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance tasks

Examples:
```
feat: add ETH payment option to generation flow

Added useETHPayment hook and integrated into PaymentModal.
Users can now choose between USDC and ETH for card generation.

fix: resolve IPFS upload timeout issue

Increased timeout from 30s to 120s and added retry logic.
Fixes issue where large images fail to upload.

docs: update DEPLOYMENT_GUIDE with new contract address

Contract redeployed to Base mainnet with optimized gas settings.
Updated all references to use new address.
```

---

## 📞 Support & Resources

### External Documentation
- **Google AI Studio:** https://aistudio.google.com/
- **Wagmi Docs:** https://wagmi.sh/
- **Viem Docs:** https://viem.sh/
- **Foundry Book:** https://book.getfoundry.sh/
- **Base Docs:** https://docs.base.org/
- **OpenSea Metadata:** https://docs.opensea.io/docs/metadata-standards
- **Pinata IPFS:** https://docs.pinata.cloud/
- **Circle USDC:** https://developers.circle.com/

### Project-Specific Resources
- **Repository:** https://github.com/howlonghasitBen/pepeArtGen
- **Live App:** (check mini-app/.env for deployment URL)
- **OpenSea Collection:** (check after NFT deployment)

---

## 🎓 Learning Path for New AI Assistants

### Day 1: Understand the System
1. Read `START_HERE.md`
2. Read `README.md`
3. Read `HOW_IT_WORKS.md`
4. Explore repo structure with `ls` and `find`

### Day 2: Card Generation
1. Read `QUICKSTART.md`
2. Read relevant generator guide
3. Run test generation (3-5 cards)
4. Examine output files

### Day 3: Mini-App Frontend
1. Read `mini-app/README.md`
2. Explore React components
3. Understand Web3 integration
4. Run dev server and test locally

### Day 4: Backend & Smart Contracts
1. Read `mini-app/DEPLOYMENT_GUIDE.md`
2. Explore server routes
3. Read PepeCardNFT.sol
4. Run smart contract tests

### Day 5: Full Stack Integration
1. Trace a complete user flow
2. Understand payment → generation → minting pipeline
3. Review error handling throughout
4. Identify areas for improvement

---

## 🔐 Security Considerations

### Smart Contract Security
- ✅ ReentrancyGuard on all payable functions
- ✅ Pausable for emergency stops
- ✅ Access control on admin functions
- ✅ Input validation on all parameters
- ✅ Custom errors for gas efficiency
- ⚠️ **No formal audit yet** - recommended before large-value launches

### Backend Security
- ✅ Payment verification on-chain (not just client-side)
- ✅ Environment variables for secrets
- ✅ CORS configured
- ✅ Input validation on all endpoints
- ⚠️ Rate limiting should be added for production

### Frontend Security
- ✅ No private keys in frontend code
- ✅ User confirmation for transactions
- ✅ Display transaction details before signing
- ✅ Error messages don't leak sensitive info

### API Keys
- 🔒 **Never commit** .env files
- 🔒 Use .gitignore to exclude .env
- 🔒 Rotate keys if accidentally exposed
- 🔒 Use minimum required permissions

---

## 📊 Performance Optimization

### Card Generation Pipeline
- Batch processing: 10-100 cards at once
- Delays prevent rate limiting: 4-8 seconds between requests
- Color extraction cached per image
- Output files organized for quick access

### Mini-App Frontend
- React.memo for expensive components
- useMemo for heavy computations
- Lazy loading for large components
- Image optimization (WebP, proper sizing)

### Mini-App Backend
- Puppeteer browser reuse (when safe)
- IPFS pinning for fast retrieval
- Supabase connection pooling
- Async/await for parallel operations

### Smart Contracts
- Gas-optimized storage patterns
- Batch minting for multiple NFTs
- Custom errors instead of strings
- Efficient loop implementations

---

## 🎯 Roadmap & TODOs

### Potential Improvements
- [ ] Add rate limiting to backend API
- [ ] Implement caching layer for card data
- [ ] Add batch minting UI
- [ ] Create admin dashboard
- [ ] Add analytics tracking
- [ ] Implement lazy loading for card gallery
- [ ] Add search/filter functionality
- [ ] Create card preview before minting
- [ ] Add sharing functionality
- [ ] Implement referral system
- [ ] Add more payment options (ETH, other tokens)
- [ ] Create mobile app version
- [ ] Add animated card reveals
- [ ] Implement trading/marketplace features

### Known Bugs to Fix
- (Check GitHub Issues for current list)

---

## 📝 Changelog

### December 2025
- Initial CLAUDE.md creation
- Comprehensive documentation of existing system
- Repository structure mapping
- Development workflow documentation

---

**End of CLAUDE.md**

This document should be updated whenever significant architectural changes are made to the codebase. AI assistants should read this file at the start of each new session to understand the current state of the project.
