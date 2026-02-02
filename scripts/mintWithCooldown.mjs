#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const execAsync = promisify(exec);

const CONTRACT = "0xcc2d6ba8564541e6e51fe5522e26d4f4bbdd458b";
const PRIVATE_KEY = "0xf4f575950eae97b546b2b9d59066aede2921835d8c22124efa9ff51aabae376d";
const RPC = "https://mainnet.base.org";
const CAST = `${process.env.HOME}/.foundry/bin/cast`;
const BASE_URI = "https://howlonghasitben.github.io/surf-works/metadata/";
const PROGRESS_FILE = "/tmp/wavestcg_cooldown.json";
const COOLDOWN_SEC = 65; // 60s cooldown + 5s buffer

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
  return { minted: [], lastMintTime: 0 };
}

function saveProgress(p) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}

async function mint(card) {
  const uri = `${BASE_URI}${card}`;
  const cmd = `${CAST} send ${CONTRACT} "mint(string)" "${uri}" --private-key ${PRIVATE_KEY} --rpc-url ${RPC} --json`;
  const { stdout } = await execAsync(cmd, { timeout: 120000 });
  return JSON.parse(stdout);
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

async function main() {
  const cards = await getCardList();
  const progress = loadProgress();
  const toMint = cards.filter(c => !progress.minted.includes(c));
  
  const eta = toMint.length * COOLDOWN_SEC;
  console.log(`🏄 SURF WORKS → WavesTCG Minter (with cooldown)`);
  console.log(`Contract: ${CONTRACT}`);
  console.log(`Cards remaining: ${toMint.length}`);
  console.log(`ETA: ${formatTime(eta)}\n`);

  for (let i = 0; i < toMint.length; i++) {
    const card = toMint[i];
    const remaining = (toMint.length - i) * COOLDOWN_SEC;
    
    // Wait for cooldown
    const elapsed = (Date.now() - progress.lastMintTime) / 1000;
    if (elapsed < COOLDOWN_SEC && progress.lastMintTime > 0) {
      const wait = Math.ceil(COOLDOWN_SEC - elapsed);
      console.log(`⏳ Waiting ${wait}s for cooldown...`);
      await new Promise(r => setTimeout(r, wait * 1000));
    }
    
    console.log(`[${i + 1}/${toMint.length}] Minting: ${card.slice(0, 30).padEnd(30)} (ETA: ${formatTime(remaining)})`);
    
    try {
      const result = await mint(card);
      progress.lastMintTime = Date.now();
      
      if (result.status === "0x1") {
        console.log(`  ✅ TX: ${result.transactionHash.slice(0, 22)}...`);
        progress.minted.push(card);
        saveProgress(progress);
      } else {
        console.log(`  ⚠️ Reverted`);
      }
    } catch (e) {
      console.log(`  ❌ Error: ${e.message.slice(0, 60)}`);
      // Might be cooldown, wait and continue
      progress.lastMintTime = Date.now();
    }
  }
  
  console.log(`\n🎉 Done! Minted: ${progress.minted.length}/${cards.length}`);
}

main().catch(console.error);
