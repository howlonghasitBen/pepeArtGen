#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const execAsync = promisify(exec);

const CONTRACT = "0x765Fe6515094d28f0db61c8211b7c524380Be47e";
const PRIVATE_KEY = "0xf4f575950eae97b546b2b9d59066aede2921835d8c22124efa9ff51aabae376d";
const RECIPIENT = "0x93709D98F406904845b44e5d8D47C9A7E6A250Ea";
const RPC = "https://mainnet.base.org";
const CAST = `${process.env.HOME}/.foundry/bin/cast`;
const BASE_URI = "https://howlonghasitben.github.io/surf-works/metadata/";
const PROGRESS_FILE = "/tmp/mint_progress.json";

// Get card list from GitHub API
async function getCardList() {
  const resp = await fetch("https://api.github.com/repos/howlonghasitben/surf-works/git/trees/main?recursive=1");
  const data = await resp.json();
  return data.tree
    .map(f => f.path)
    .filter(p => p.includes("1of1.json"))
    .map(p => p.replace("public/metadata/", ""));
}

// Load progress
function loadProgress() {
  if (existsSync(PROGRESS_FILE)) {
    return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { minted: [], failed: [] };
}

// Save progress
function saveProgress(progress) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Mint a single card
async function mintCard(metadataFile) {
  const uri = `${BASE_URI}${metadataFile}`;
  const cmd = `${CAST} send ${CONTRACT} "adminMint(address,string)" ${RECIPIENT} "${uri}" --private-key ${PRIVATE_KEY} --rpc-url ${RPC} --json`;
  
  try {
    const { stdout } = await execAsync(cmd, { timeout: 60000 });
    const result = JSON.parse(stdout);
    return { success: true, txHash: result.transactionHash };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log("🏄 SURF Waves Cards Batch Minter");
  console.log(`Contract: ${CONTRACT}`);
  console.log(`Recipient: ${RECIPIENT}\n`);

  const cards = await getCardList();
  console.log(`Found ${cards.length} cards to mint\n`);

  const progress = loadProgress();
  console.log(`Already minted: ${progress.minted.length}`);
  console.log(`Previously failed: ${progress.failed.length}\n`);

  // Filter out already minted
  const toMint = cards.filter(c => !progress.minted.includes(c));
  console.log(`Remaining to mint: ${toMint.length}\n`);

  if (toMint.length === 0) {
    console.log("✅ All cards already minted!");
    return;
  }

  // Mint in batches
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < toMint.length; i++) {
    const card = toMint[i];
    console.log(`[${i + 1}/${toMint.length}] Minting: ${card}`);
    
    const result = await mintCard(card);
    
    if (result.success) {
      console.log(`  ✅ TX: ${result.txHash}`);
      progress.minted.push(card);
      successCount++;
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
      if (!progress.failed.includes(card)) {
        progress.failed.push(card);
      }
      failCount++;
    }
    
    // Save progress every 5 cards
    if ((i + 1) % 5 === 0) {
      saveProgress(progress);
      console.log(`  📝 Progress saved\n`);
    }

    // Small delay between mints
    await new Promise(r => setTimeout(r, 500));
  }

  saveProgress(progress);
  console.log(`\n🎉 Done! Minted: ${successCount}, Failed: ${failCount}`);
  console.log(`Total minted: ${progress.minted.length}/${cards.length}`);
}

main().catch(console.error);
