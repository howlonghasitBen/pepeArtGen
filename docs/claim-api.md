# WavesTCG Claim API Documentation

## Overview

The ClaimVault contract allows anyone to claim a free SURF Waves Card NFT every 2 hours. This document covers how bots and agents can interact with the contract programmatically.

## Contract Details

| Property | Value |
|----------|-------|
| **Contract Address** | `TBD - Update after deployment` |
| **Network** | Base Mainnet (Chain ID: 8453) |
| **NFT Contract** | `0xcc2d6ba8564541e6e51fe5522e26d4f4bbdd458b` |
| **Cooldown** | 2 hours (7200 seconds) |

## ABI

```json
[
  {
    "inputs": [],
    "name": "availableCount",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "canClaim",
    "outputs": [{"type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "cooldownRemaining",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "address"}],
    "name": "lastClaim",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "user", "type": "address"},
      {"indexed": false, "name": "tokenId", "type": "uint256"}
    ],
    "name": "Claimed",
    "type": "event"
  }
]
```

## Cooldown Logic

A wallet can claim if:

```
block.timestamp >= lastClaim[wallet] + 7200
```

Or simplified: `canClaim(wallet)` returns `true`.

## Using cast (Foundry)

### Check if you can claim

```bash
export VAULT=0x... # ClaimVault address
export RPC=https://mainnet.base.org

# Check available cards
cast call $VAULT "availableCount()" --rpc-url $RPC

# Check if you can claim
cast call $VAULT "canClaim(address)" YOUR_ADDRESS --rpc-url $RPC

# Get cooldown remaining (in seconds)
cast call $VAULT "cooldownRemaining(address)" YOUR_ADDRESS --rpc-url $RPC
```

### Claim a card

```bash
export PRIVATE_KEY=0x...

cast send $VAULT "claim()" \
  --rpc-url $RPC \
  --private-key $PRIVATE_KEY
```

## Using ethers.js v6

```javascript
import { ethers } from 'ethers';

const VAULT_ADDRESS = '0x...'; // ClaimVault address
const RPC_URL = 'https://mainnet.base.org';

const ABI = [
  'function availableCount() view returns (uint256)',
  'function canClaim(address) view returns (bool)',
  'function cooldownRemaining(address) view returns (uint256)',
  'function claim()',
  'event Claimed(address indexed user, uint256 tokenId)'
];

async function claimCard(privateKey) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  const vault = new ethers.Contract(VAULT_ADDRESS, ABI, wallet);

  // Check eligibility
  const canClaim = await vault.canClaim(wallet.address);
  if (!canClaim) {
    const remaining = await vault.cooldownRemaining(wallet.address);
    console.log(`Cannot claim yet. Wait ${remaining} seconds.`);
    return null;
  }

  const available = await vault.availableCount();
  if (available === 0n) {
    console.log('No cards available');
    return null;
  }

  // Claim!
  console.log('Claiming card...');
  const tx = await vault.claim();
  const receipt = await tx.wait();

  // Parse Claimed event
  const claimedEvent = receipt.logs.find(
    log => log.fragment?.name === 'Claimed'
  );
  if (claimedEvent) {
    const tokenId = claimedEvent.args[1];
    console.log(`Claimed token #${tokenId}!`);
    return tokenId;
  }

  return null;
}

// Usage
claimCard(process.env.PRIVATE_KEY).catch(console.error);
```

## Using viem

```typescript
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const VAULT_ADDRESS = '0x...' as const;

const abi = parseAbi([
  'function availableCount() view returns (uint256)',
  'function canClaim(address) view returns (bool)',
  'function cooldownRemaining(address) view returns (uint256)',
  'function claim()',
  'event Claimed(address indexed user, uint256 tokenId)'
]);

async function claimCard(privateKey: `0x${string}`) {
  const account = privateKeyToAccount(privateKey);
  
  const publicClient = createPublicClient({
    chain: base,
    transport: http()
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http()
  });

  // Check eligibility
  const canClaim = await publicClient.readContract({
    address: VAULT_ADDRESS,
    abi,
    functionName: 'canClaim',
    args: [account.address]
  });

  if (!canClaim) {
    const remaining = await publicClient.readContract({
      address: VAULT_ADDRESS,
      abi,
      functionName: 'cooldownRemaining',
      args: [account.address]
    });
    console.log(`Wait ${remaining} seconds`);
    return;
  }

  // Claim
  const hash = await walletClient.writeContract({
    address: VAULT_ADDRESS,
    abi,
    functionName: 'claim'
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('Claimed!', receipt);
}
```

## Checking Your Collection

After claiming, you can view your cards:

- **OpenSea**: https://opensea.io/collection/surf-waves-cards
- **BaseScan**: https://basescan.org/token/0xcc2d6ba8564541e6e51fe5522e26d4f4bbdd458b

## Error Handling

Common revert reasons:

| Error | Meaning |
|-------|---------|
| `No NFTs available` | Vault is empty, wait for refill |
| `Cooldown not expired` | Wait for 2 hour cooldown |
| `execution reverted` | Generic - check gas/balance |

## Gas Estimates

- `claim()`: ~80,000-120,000 gas
- At 0.001 gwei base fee: ~0.00008-0.00012 ETH

## Events

Subscribe to `Claimed(address indexed user, uint256 tokenId)` to track claims:

```javascript
vault.on('Claimed', (user, tokenId, event) => {
  console.log(`${user} claimed token #${tokenId}`);
});
```

## Links

- **Mini-App**: https://wavestcg.xyz
- **OpenSea Collection**: https://opensea.io/collection/surf-waves-cards
- **NFT Contract**: https://basescan.org/address/0xcc2d6ba8564541e6e51fe5522e26d4f4bbdd458b
