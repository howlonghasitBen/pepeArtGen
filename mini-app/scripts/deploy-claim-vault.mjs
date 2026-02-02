#!/usr/bin/env node
/**
 * Deploy ClaimVault contract to Base mainnet
 * Usage: node scripts/deploy-claim-vault.mjs
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MINI_APP_DIR = join(__dirname, '..');

// Config
const NFT_CONTRACT = '0xcc2d6ba8564541e6e51fe5522e26d4f4bbdd458b'; // SURF Waves Cards
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

if (!DEPLOYER_PRIVATE_KEY) {
  // Try to load from clawtasks credentials
  try {
    const creds = JSON.parse(readFileSync(
      join(process.env.HOME, '.config/clawtasks/credentials.json'), 
      'utf-8'
    ));
    process.env.PRIVATE_KEY = creds.private_key;
  } catch {
    console.error('❌ Set PRIVATE_KEY env or have ~/.config/clawtasks/credentials.json');
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Deploying ClaimVault to Base mainnet...');
  console.log(`   NFT Contract: ${NFT_CONTRACT}`);
  console.log(`   RPC: ${RPC_URL}`);
  
  // Build contract
  console.log('\n📦 Building contract...');
  execSync('forge build', { cwd: MINI_APP_DIR, stdio: 'inherit' });
  
  // Deploy
  console.log('\n🔨 Deploying...');
  const deployCmd = `forge create \
    --rpc-url "${RPC_URL}" \
    --private-key "${process.env.PRIVATE_KEY}" \
    --broadcast \
    --verify \
    contracts/ClaimVault.sol:ClaimVault \
    --constructor-args "${NFT_CONTRACT}"`;
  
  const result = execSync(deployCmd, { 
    cwd: MINI_APP_DIR, 
    encoding: 'utf-8',
    env: { ...process.env, ETHERSCAN_API_KEY: process.env.BASESCAN_API_KEY }
  });
  
  // Parse deployed address
  const addressMatch = result.match(/Deployed to: (0x[a-fA-F0-9]{40})/);
  if (!addressMatch) {
    console.error('❌ Could not find deployed address in output');
    console.log(result);
    process.exit(1);
  }
  
  const deployedAddress = addressMatch[1];
  console.log(`\n✅ ClaimVault deployed to: ${deployedAddress}`);
  
  // Save deployment info
  const deploymentInfo = {
    contract: 'ClaimVault',
    address: deployedAddress,
    nftContract: NFT_CONTRACT,
    network: 'base',
    chainId: 8453,
    deployedAt: new Date().toISOString(),
    cooldownSeconds: 7200, // 2 hours
  };
  
  const deploymentsPath = join(MINI_APP_DIR, 'deployments', 'claim-vault.json');
  writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📝 Saved to: ${deploymentsPath}`);
  
  console.log('\n📋 Next steps:');
  console.log('1. Transfer NFTs to vault: nftContract.safeTransferFrom(yourWallet, claimVault, tokenId)');
  console.log('2. Or batch: loop through tokenIds and transfer each');
  console.log('3. Update mini-app with new contract address');
  
  return deployedAddress;
}

main().catch(console.error);
