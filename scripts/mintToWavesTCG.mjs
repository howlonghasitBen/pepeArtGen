#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const execAsync = promisify(exec);

// Official WavesTCG contract
const CONTRACT = "0xcc2d6ba8564541e6e51fe5522e26d4f4bbdd458b";
const PRIVATE_KEY = "0xf4f575950eae97b546b2b9d59066aede2921835d8c22124efa9ff51aabae376d";
const RPC = "https://mainnet.base.org";
const CAST = `${process.env.HOME}/.foundry/bin/cast`;
const BASE_URI = "https://howlonghasitben.github.io/surf-works/metadata/";
const PROGRESS_FILE = "/tmp/wavestcg_mint.json";

async function getCardList() {
  const resp = await fetch("https://api.github.com/repos/howlonghasitben/surf-works/git/trees/main?recursive=1");
  const data = await resp.json();
  return data.tree
    .map(f => f.path)
    .filter(p => p.includes("1of1.json"))
    .map(p => p.replace("public/metadata/", ""));
}

function loadProgress() {
  if (existsSync(PROGRESS_FILE)) return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
  return { minted: [] };
}

function saveProgress(p) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}

async function mint(card) {
  const uri = `${BASE_URI}${card}`;
  // Using public mint(string) function - no payment needed
  const cmd = `${CAST} send ${CONTRACT} "mint(string)" "${uri}" --private-key ${PRIVATE_KEY} --rpc-url ${RPC} --json`;
  const { stdout } = await execAsync(cmd, { timeout: 120000 });
  return JSON.parse(stdout);
}

async function main() {
  const cards = await getCardList();
  const progress = loadProgress();
  const toMint = cards.filter(c => !progress.minted.includes(c));
  
  console.log(`🏄 Minting ${toMint.length} SURF WORKS cards to WavesTCG...`);
  console.log(`Contract: ${CONTRACT}\n`);

  let success = 0, fail = 0;

  for (let i = 0; i < toMint.length; i++) {
    const card = toMint[i];
    try {
      const result = await mint(card);
      if (result.status === "0x1") {
        console.log(`[${i + 1}/${toMint.length}] ✅ ${card.slice(0, 35)}`);
        progress.minted.push(card);
        success++;
      } else {
        console.log(`[${i + 1}/${toMint.length}] ⚠️ ${card.slice(0, 35)} - reverted`);
        fail++;
      }
    } catch (e) {
      console.log(`[${i + 1}/${toMint.length}] ❌ ${card.slice(0, 35)} - error`);
      fail++;
    }
    
    if ((i + 1) % 10 === 0) {
      saveProgress(progress);
      console.log(`  [saved - ${progress.minted.length} minted]\n`);
    }
    
    // Wait between mints
    await new Promise(r => setTimeout(r, 2500));
  }
  
  saveProgress(progress);
  console.log(`\n🎉 Done! Success: ${success}, Failed: ${fail}`);
  console.log(`Total in collection: ${progress.minted.length + 81}`);
}

main().catch(console.error);
