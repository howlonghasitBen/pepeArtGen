#!/usr/bin/env node
/**
 * Transfer SURF Waves Card NFT to another wallet
 * Usage: node transferNFT.mjs <tokenId> <toAddress>
 */

import { createWalletClient, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const CONTRACT = '0xcc2d6ba8564541e6e51fe5522e26d4f4bbdd458b';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MY_WALLET = '0x93709D98F406904845b44e5d8D47C9A7E6A250Ea';

const ABI = [{
  inputs: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'tokenId', type: 'uint256' }
  ],
  name: 'transferFrom',
  outputs: [],
  stateMutability: 'nonpayable',
  type: 'function'
}];

async function main() {
  const tokenId = process.argv[2];
  const toAddress = process.argv[3];

  if (!tokenId || !toAddress) {
    console.error('Usage: node transferNFT.mjs <tokenId> <toAddress>');
    process.exit(1);
  }

  console.log(`🎴 Transferring token #${tokenId} to ${toAddress}...`);

  const account = privateKeyToAccount(PRIVATE_KEY);
  const publicClient = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') });
  const walletClient = createWalletClient({ account, chain: base, transport: http('https://mainnet.base.org') });

  const hash = await walletClient.writeContract({
    address: CONTRACT,
    abi: ABI,
    functionName: 'transferFrom',
    args: [MY_WALLET, toAddress, BigInt(tokenId)]
  });

  console.log(`📝 TX: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`✅ Transferred! Block: ${receipt.blockNumber}`);
  console.log(`🔗 https://basescan.org/tx/${hash}`);
}

main().catch(console.error);
