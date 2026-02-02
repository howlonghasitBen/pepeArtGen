import { readFileSync } from 'fs';
import path from 'path';
import { createWalletClient, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { PinataSDK } from 'pinata';
import dotenv from 'dotenv';

// Load env from both locations
dotenv.config({ path: path.join(process.env.HOME, '.env') });
dotenv.config({ path: path.join(process.env.HOME, 'pepeArtGen-fork/mini-app/.env') });

const CONTRACT_ADDRESS = '0x765fe6515094d28f0db61c8211b7c524380be47e';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PINATA_JWT = process.env.PINATA_JWT;

const NFT_ABI = [
  {
    inputs: [{ internalType: 'string', name: 'metadataURI', type: 'string' }],
    name: 'mint',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function'
  }
];

async function main() {
  console.log('🚀 Starting Phoenix mint...\n');
  
  // Load phoenix card
  const data = JSON.parse(readFileSync(
    path.join(process.env.HOME, 'pepeArtGen-fork/mini-app/public/surfworks-cards.json'),
    'utf8'
  ));
  const phoenix = data.cards.find(c => c.id === 'phoenix');
  console.log('📋 Card:', phoenix.name);
  console.log('🎨 Has theme:', !!phoenix.theme?.background);
  
  // Setup Pinata
  console.log('\n📤 Uploading to IPFS...');
  const pinata = new PinataSDK({
    pinataJwt: PINATA_JWT,
    pinataGateway: 'gateway.pinata.cloud'
  });
  
  // Create metadata
  const metadata = {
    name: phoenix.name,
    description: phoenix.description,
    image: phoenix.image,
    attributes: [
      { trait_type: 'Type', value: phoenix.type },
      { trait_type: 'Level', value: phoenix.level },
      { trait_type: 'Attack', value: phoenix.stats?.attack },
      { trait_type: 'Defense', value: phoenix.stats?.defense },
      { trait_type: 'Rarity', value: phoenix.rarity },
      { trait_type: 'Theme', value: 'phoenixFire' }
    ],
    theme: phoenix.theme
  };
  
  // Upload to IPFS
  const metadataUpload = await pinata.upload.public.json(metadata, {
    metadata: { name: `${phoenix.id}-metadata.json` }
  });
  
  const metadataURI = `ipfs://${metadataUpload.cid || metadataUpload.IpfsHash}`;
  console.log('✅ Metadata uploaded:', metadataURI);
  
  // Setup wallet
  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log('\n👛 Wallet:', account.address);
  
  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org')
  });
  
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http('https://mainnet.base.org')
  });
  
  const balance = await publicClient.getBalance({ address: account.address });
  console.log('💰 Balance:', (Number(balance) / 1e18).toFixed(4), 'ETH');
  
  // Mint!
  console.log('\n🎴 Minting NFT...');
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: NFT_ABI,
    functionName: 'mint',
    args: [metadataURI],
    value: 0n
  });
  
  console.log('📝 Transaction:', hash);
  console.log('⏳ Waiting for confirmation...');
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('\n🎉 MINTED! Block:', receipt.blockNumber);
  console.log('🔗 https://basescan.org/tx/' + hash);
}

main().catch(console.error);
