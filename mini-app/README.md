# WavesTCG NFT Minting Contract

Production-ready ERC-721 NFT contract for minting AI-generated SURF Waves trading cards on Base L2.

## Features

✅ **ERC-721** standard NFT implementation  
✅ **ERC-2981** marketplace royalties (5% default)  
✅ **Gas-optimized** for Base L2 (~$0.02 per mint)  
✅ **Security hardened** with ReentrancyGuard, Pausable, AccessControl  
✅ **Rate limiting** with configurable cooldown periods  
✅ **Batch minting** for gas efficiency  
✅ **IPFS metadata** with flexible URI management  
✅ **OpenSea compatible** out of the box  

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    pepeArtGen Pipeline                       │
│  (Generates AI images + metadata from your repo)            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   Upload to IPFS       │
         │   (Pinata/Filebase)    │
         └────────┬───────────────┘
                  │
                  ▼
         ┌────────────────────────┐
         │  Smart Contract Mint   │
         │  (WavesTCGNFT.sol)   │
         └────────┬───────────────┘
                  │
                  ▼
         ┌────────────────────────┐
         │   Base L2 Blockchain   │
         │   OpenSea Integration  │
         └────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Clone and setup
cd pepeArtGen-contracts
forge install OpenZeppelin/openzeppelin-contracts
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values:
# - PRIVATE_KEY (deployment wallet)
# - TREASURY_ADDRESS (receives mint fees)
# - ROYALTY_RECEIVER (receives marketplace royalties)
# - BASE_SEPOLIA_RPC_URL (testnet RPC)
# - BASESCAN_API_KEY (for verification)
```

### 3. Test Locally

```bash
# Run full test suite
forge test -vv

# Check gas usage
forge test --gas-report

# Test specific function
forge test --match-test test_Mint_Success -vvv
```

### 4. Deploy to Base Sepolia (Testnet)

```bash
# Deploy
forge script script/Deploy.s.sol:DeployWavesTCG \
  --rpc-url base_sepolia \
  --broadcast \
  --verify

# Save the deployed contract address!
```

### 5. Update IPFS Metadata

After deployment, you need to update the baseURI with your IPFS hash:

```bash
# Using cast (comes with Foundry)
cast send <CONTRACT_ADDRESS> \
  "setBaseURI(string)" \
  "ipfs://QmYourIPFSHash/" \
  --rpc-url base_sepolia \
  --private-key $PRIVATE_KEY
```

### 6. Test Minting

```bash
# Mint a single NFT
cast send <CONTRACT_ADDRESS> \
  "mint(string)" \
  "1.json" \
  --value 0.001ether \
  --rpc-url base_sepolia \
  --private-key $PRIVATE_KEY

# Check your NFT on OpenSea Testnet
# https://testnets.opensea.io/assets/base-sepolia/<CONTRACT_ADDRESS>/1
```

### 7. Deploy to Base Mainnet

Once tested on testnet:

```bash
forge script script/Deploy.s.sol:DeployWavesTCG \
  --rpc-url base \
  --broadcast \
  --verify \
  --slow
```

## Integration with pepeArtGen Pipeline

### Step 1: Generate Cards with Your Pipeline

```bash
cd ../pepeArtGen
node completeCardPipeline.mjs
# Or: node unifiedCardGenerator.mjs
```

This creates:
- `generated-cards/generated-images/` - AI-generated artwork
- `generated-cards/metadata/` - NFT metadata JSON files

### Step 2: Upload to IPFS

Create `uploadToIPFS.js`:

```javascript
import { PinataSDK } from "pinata-web3";
import fs from "fs";
import path from "path";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
});

async function uploadCollection() {
  // 1. Upload all images first
  console.log("Uploading images...");
  const imagesFolder = "./generated-cards/generated-images";
  const imageUpload = await pinata.upload.folder(imagesFolder);
  const imageCID = imageUpload.IpfsHash;
  console.log(`Images uploaded: ipfs://${imageCID}/`);

  // 2. Update metadata files to point to image CIDs
  const metadataFolder = "./generated-cards/metadata";
  const files = fs.readdirSync(metadataFolder);
  
  for (const file of files) {
    const filePath = path.join(metadataFolder, file);
    const metadata = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    // Update image URL to IPFS
    const imageName = metadata.image.split("/").pop();
    metadata.image = `ipfs://${imageCID}/${imageName}`;
    
    // Write updated metadata
    fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
  }

  // 3. Upload metadata folder
  console.log("Uploading metadata...");
  const metadataUpload = await pinata.upload.folder(metadataFolder);
  const metadataCID = metadataUpload.IpfsHash;
  console.log(`Metadata uploaded: ipfs://${metadataCID}/`);

  // 4. Update contract baseURI
  console.log("\nUpdate your contract with:");
  console.log(`setBaseURI("ipfs://${metadataCID}/")`);
  
  return { imageCID, metadataCID };
}

uploadCollection();
```

Run it:
```bash
npm install pinata-web3
node uploadToIPFS.js
```

### Step 3: Update Smart Contract

```bash
# Update baseURI with metadata CID from Step 2
cast send <CONTRACT_ADDRESS> \
  "setBaseURI(string)" \
  "ipfs://QmYourMetadataCID/" \
  --rpc-url base \
  --private-key $PRIVATE_KEY
```

### Step 4: Create Minting Frontend

Example React component using wagmi + RainbowKit:

```typescript
import { useContractWrite, usePrepareContractWrite } from "wagmi";
import { parseEther } from "viem";

const CONTRACT_ADDRESS = "0x..."; // Your deployed address
const MINT_PRICE = "0.001";

function MintCard({ tokenId }: { tokenId: number }) {
  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: [
      {
        name: "mint",
        type: "function",
        stateMutability: "payable",
        inputs: [{ name: "metadataURI", type: "string" }],
        outputs: [{ name: "tokenId", type: "uint256" }],
      },
    ],
    functionName: "mint",
    args: [`${tokenId}.json`],
    value: parseEther(MINT_PRICE),
  });

  const { write, isLoading, isSuccess } = useContractWrite(config);

  return (
    <div>
      <button onClick={() => write?.()} disabled={!write || isLoading}>
        {isLoading ? "Minting..." : "Mint Card"}
      </button>
      {isSuccess && <p>Card minted successfully!</p>}
    </div>
  );
}
```

## Contract Functions

### Public Functions

```solidity
// Mint single NFT
function mint(string memory metadataURI) external payable returns (uint256)

// Batch mint (gas efficient)
function mintBatch(string[] memory metadataURIs) external payable returns (uint256[])

// Check if wallet can mint (cooldown check)
function canMint(address wallet) external view returns (bool)

// Get time until wallet can mint again
function timeUntilMint(address wallet) external view returns (uint256)

// Get remaining supply
function remainingSupply() external view returns (uint256)
```

### Admin Functions (Owner Only)

```solidity
// Emergency pause/unpause
function pause() external onlyOwner
function unpause() external onlyOwner

// Update mint price
function setMintPrice(uint256 newPrice) external onlyOwner

// Update cooldown period
function setCooldown(uint256 newCooldown) external onlyOwner

// Update treasury address
function setTreasury(address newTreasury) external onlyOwner

// Update base URI for metadata
function setBaseURI(string memory newBaseURI) external onlyOwner

// Withdraw funds to treasury
function withdraw() external onlyOwner

// Admin mint (no payment, no cooldown)
function adminMint(address to, string memory metadataURI) external onlyOwner

// Update royalty settings
function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner
```

## Configuration

Key parameters (can be modified in constructor or via admin functions):

- **MAX_SUPPLY**: 10,000 NFTs (hardcoded in contract)
- **MINT_PRICE**: 0.001 ETH (adjustable)
- **MAX_PER_TX**: 10 NFTs per transaction (hardcoded)
- **COOLDOWN**: 60 seconds between mints per wallet (adjustable)
- **ROYALTY**: 500 basis points = 5% (adjustable)

## Security Features

1. **ReentrancyGuard**: Prevents reentrancy attacks on payment functions
2. **Pausable**: Emergency stop mechanism for critical bugs
3. **AccessControl**: Owner-only functions for configuration
4. **Rate Limiting**: Cooldown prevents bot spam
5. **Custom Errors**: Gas-efficient error handling
6. **Input Validation**: All parameters validated before execution

## Gas Optimization

- Token IDs start at 1 (saves gas vs 0)
- Packed storage variables
- Custom errors instead of require strings
- Efficient loop patterns
- Optimized for Base L2 (~100k-150k gas per mint)

## Testing

Run comprehensive test suite:

```bash
# All tests with verbosity
forge test -vv

# Gas report
forge test --gas-report

# Coverage report
forge coverage

# Test specific contract
forge test --match-contract WavesTCGNFTTest

# Fuzz testing (already included in test suite)
forge test --match-test testFuzz
```

Test coverage targets:
- ✅ Deployment and initialization
- ✅ Minting (single and batch)
- ✅ Payment handling and refunds
- ✅ Cooldown enforcement
- ✅ Access control
- ✅ Pause/unpause functionality
- ✅ Royalty calculations
- ✅ Admin functions
- ✅ Edge cases and reverts

## Deployment Checklist

Before mainnet deployment:

- [ ] Test all functions on Base Sepolia testnet
- [ ] Verify contract on Basescan
- [ ] Test minting with real wallet
- [ ] Upload all metadata to IPFS
- [ ] Update baseURI in contract
- [ ] Test OpenSea integration on testnet
- [ ] Configure treasury multisig (recommended: Gnosis Safe)
- [ ] Set up monitoring for mint events
- [ ] Prepare frontend minting interface
- [ ] Security audit (recommended for collections >$100K)
- [ ] Test emergency pause/unpause
- [ ] Document admin procedures
- [ ] Set up backup RPC providers
- [ ] Configure royalty receivers
- [ ] Test withdrawal function

## Post-Deployment

1. **Verify on Basescan**
   - Automatic with `--verify` flag
   - Manual: https://basescan.org/verifyContract

2. **Create OpenSea Collection**
   - Auto-indexed within 1-5 minutes
   - Manual: https://opensea.io/get-listed

3. **Implement contractURI**
   - Returns collection metadata
   - Shows on OpenSea collection page

4. **Monitor Events**
   ```bash
   # Watch mint events
   cast logs --address <CONTRACT_ADDRESS> \
     --rpc-url base \
     "CardMinted(address,uint256,string)"
   ```

5. **Setup Monitoring**
   - Transaction success rate
   - Gas prices
   - Treasury balance
   - Mint velocity

## Cost Breakdown (Base Mainnet)

- **Contract Deployment**: ~$2-5 (one-time)
- **Single Mint**: ~$0.015-0.02 per NFT
- **Batch Mint (10)**: ~$0.012-0.015 per NFT
- **Admin Functions**: ~$0.01-0.05 per tx
- **IPFS Storage**: $20-100/month (Pinata/Filebase)

Total cost for 10,000 NFT collection: **$150-250** including deployment and IPFS

## Troubleshooting

### "Insufficient payment" error
- Ensure `msg.value >= mintPrice`
- Check wallet has enough ETH + gas

### "Cooldown active" error  
- Wait 60 seconds between mints
- Check `timeUntilMint(address)` function

### "Max supply reached" error
- All 10,000 NFTs have been minted
- Cannot mint beyond MAX_SUPPLY

### OpenSea not showing NFT
- Wait 1-5 minutes for indexing
- Verify tokenURI returns valid JSON
- Check IPFS gateway is accessible
- Emit MetadataUpdate event to force refresh

### Contract verification failed
- Ensure exact Solidity version matches
- Include all constructor arguments
- Try `--verify` flag during deployment
- Manual verification via Basescan UI

## Support & Resources

- **Foundry Docs**: https://book.getfoundry.sh/
- **Base Docs**: https://docs.base.org/
- **OpenZeppelin**: https://docs.openzeppelin.com/
- **OpenSea Metadata**: https://docs.opensea.io/docs/metadata-standards
- **Pinata IPFS**: https://docs.pinata.cloud/

## License

GPL-3.0 (matching your pepeArtGen repository)

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Ensure all tests pass: `forge test`
5. Submit pull request

---

Built for the SURF Waves Collection 🌊
