#!/usr/bin/env node
/**
 * Deploy ClaimVault contract to Base mainnet
 * Usage: node deploy-claim-vault.mjs [--dry-run]
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const DEPLOYMENTS_DIR = join(ROOT_DIR, 'deployments');

// Config
const NFT_CONTRACT = '0xcc2d6ba8564541e6e51fe5522e26d4f4bbdd458b'; // SURF Waves Cards
const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const isDryRun = process.argv.includes('--dry-run');
const isVerify = process.argv.includes('--verify');

async function main() {
  console.log('🌊 Deploying ClaimVault for SURF Waves Cards');
  console.log(`   NFT Contract: ${NFT_CONTRACT}`);
  console.log(`   Network: Base Mainnet`);
  console.log(`   Dry Run: ${isDryRun}`);
  console.log('');

  if (!PRIVATE_KEY && !isDryRun) {
    console.error('❌ PRIVATE_KEY environment variable required');
    console.log('   Set it in .env or export PRIVATE_KEY=0x...');
    process.exit(1);
  }

  // Ensure deployments directory exists
  if (!existsSync(DEPLOYMENTS_DIR)) {
    mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
  }

  // Compile contract
  console.log('📦 Compiling contracts...');
  try {
    execSync('forge build', { cwd: ROOT_DIR, stdio: 'inherit' });
  } catch (e) {
    console.error('❌ Compilation failed');
    process.exit(1);
  }

  if (isDryRun) {
    console.log('\n✅ Dry run complete - contract compiles successfully');
    console.log('   Run without --dry-run to deploy');
    return;
  }

  // Deploy
  console.log('\n🚀 Deploying ClaimVault...');
  
  const deployCmd = [
    'forge create',
    '--rpc-url', RPC_URL,
    '--private-key', PRIVATE_KEY,
    '--broadcast',
    'contracts/ClaimVault.sol:ClaimVault',
    '--constructor-args', NFT_CONTRACT,
  ];

  if (isVerify) {
    deployCmd.push('--verify');
    deployCmd.push('--etherscan-api-key', process.env.BASESCAN_API_KEY || '');
  }

  try {
    const output = execSync(deployCmd.join(' '), { 
      cwd: ROOT_DIR, 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'inherit']
    });
    
    // Parse deployed address from output
    const addressMatch = output.match(/Deployed to: (0x[a-fA-F0-9]{40})/);
    if (!addressMatch) {
      console.log(output);
      throw new Error('Could not parse deployed address');
    }
    
    const deployedAddress = addressMatch[1];
    console.log(`\n✅ ClaimVault deployed to: ${deployedAddress}`);
    
    // Save deployment info
    const deployment = {
      address: deployedAddress,
      nftContract: NFT_CONTRACT,
      network: 'base',
      chainId: 8453,
      deployedAt: new Date().toISOString(),
      deployer: execSync(`cast wallet address --private-key ${PRIVATE_KEY}`, { encoding: 'utf-8' }).trim(),
      cooldown: 7200, // 2 hours in seconds
    };
    
    const deploymentPath = join(DEPLOYMENTS_DIR, 'claim-vault.json');
    writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    console.log(`📄 Deployment saved to: ${deploymentPath}`);
    
    // Generate ABI
    const abiPath = join(DEPLOYMENTS_DIR, 'ClaimVault.abi.json');
    const outPath = join(ROOT_DIR, 'out', 'ClaimVault.sol', 'ClaimVault.json');
    if (existsSync(outPath)) {
      const artifact = JSON.parse(readFileSync(outPath, 'utf-8'));
      writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
      console.log(`📄 ABI saved to: ${abiPath}`);
    }
    
    console.log('\n📋 Next steps:');
    console.log('   1. Transfer NFTs to the vault using safeTransferFrom');
    console.log('   2. Update mini-app with contract address');
    console.log(`   3. Users can call claim() every 2 hours`);
    
  } catch (e) {
    console.error('❌ Deployment failed:', e.message);
    process.exit(1);
  }
}

main().catch(console.error);
