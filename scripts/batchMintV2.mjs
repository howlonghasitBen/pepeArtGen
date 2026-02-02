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
const PROGRESS_FILE = "/tmp/mint_progress_v2.json";

async function getCardList() {
  const resp = await fetch("https://api.github.com/repos/howlonghasitben/surf-works/git/trees/main?recursive=1");
  const data = await resp.json();
  return data.tree
    .map(f => f.path)
    .filter(p => p.includes("1of1.json"))
    .map(p => p.replace("public/metadata/", ""));
}

async function getCurrentNonce() {
  const { stdout } = await execAsync(`${CAST} nonce ${RECIPIENT} --rpc-url ${RPC}`);
  return parseInt(stdout.trim());
}

async function getTotalSupply() {
  const { stdout } = await execAsync(`${CAST} call ${CONTRACT} "totalSupply()" --rpc-url ${RPC}`);
  return parseInt(stdout.trim(), 16);
}

function loadProgress() {
  if (existsSync(PROGRESS_FILE)) {
    return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { minted: [], failed: [], lastNonce: 0 };
}

function saveProgress(progress) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function mintCard(metadataFile, nonce) {
  const uri = `${BASE_URI}${metadataFile}`;
  const cmd = `${CAST} send ${CONTRACT} "adminMint(address,string)" ${RECIPIENT} "${uri}" --private-key ${PRIVATE_KEY} --rpc-url ${RPC} --nonce ${nonce} --json`;
  
  try {
    const { stdout } = await execAsync(cmd, { timeout: 90000 });
    const result = JSON.parse(stdout);
    if (result.status === "0x1") {
      return { success: true, txHash: result.transactionHash };
    }
    return { success: false, error: "TX reverted" };
  } catch (error) {
    return { success: false, error: error.message.slice(0, 100) };
  }
}

async function main() {
  console.log("🏄 SURF Waves Cards Batch Minter V2");
  console.log(`Contract: ${CONTRACT}\n`);

  const cards = await getCardList();
  const totalSupply = await getTotalSupply();
  let nonce = await getCurrentNonce();
  
  console.log(`Total cards: ${cards.length}`);
  console.log(`Already minted on-chain: ${totalSupply}`);
  console.log(`Current nonce: ${nonce}\n`);

  const progress = loadProgress();
  const toMint = cards.filter(c => !progress.minted.includes(c));
  
  console.log(`Tracked as minted: ${progress.minted.length}`);
  console.log(`Remaining: ${toMint.length}\n`);

  if (toMint.length === 0) {
    console.log("✅ All done!");
    return;
  }

  let success = 0, fail = 0;

  for (let i = 0; i < toMint.length; i++) {
    const card = toMint[i];
    process.stdout.write(`[${i + 1}/${toMint.length}] ${card.slice(0, 25).padEnd(25)} `);
    
    const result = await mintCard(card, nonce);
    
    if (result.success) {
      console.log(`✅ ${result.txHash.slice(0, 18)}...`);
      progress.minted.push(card);
      nonce++;
      success++;
    } else {
      console.log(`❌ ${result.error.slice(0, 40)}`);
      progress.failed.push({ card, error: result.error, nonce });
      // Still increment nonce if it was a revert (tx might have gone through)
      if (result.error.includes("reverted")) {
        nonce++;
      }
      fail++;
    }
    
    progress.lastNonce = nonce;
    if ((i + 1) % 10 === 0) {
      saveProgress(progress);
      console.log(`  [saved progress]\n`);
    }

    // Delay between mints
    await new Promise(r => setTimeout(r, 800));
  }

  saveProgress(progress);
  console.log(`\n🎉 Done! Success: ${success}, Failed: ${fail}`);
}

main().catch(console.error);
