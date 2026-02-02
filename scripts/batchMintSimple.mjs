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
const PROGRESS_FILE = "/tmp/mint_simple.json";

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
  const cmd = `${CAST} send ${CONTRACT} "adminMint(address,string)" ${RECIPIENT} "${uri}" --private-key ${PRIVATE_KEY} --rpc-url ${RPC} --json`;
  const { stdout } = await execAsync(cmd, { timeout: 120000 });
  return JSON.parse(stdout);
}

async function main() {
  const cards = await getCardList();
  const progress = loadProgress();
  const toMint = cards.filter(c => !progress.minted.includes(c));
  
  console.log(`🏄 Minting ${toMint.length} remaining cards...`);

  for (let i = 0; i < toMint.length; i++) {
    const card = toMint[i];
    try {
      const result = await mint(card);
      if (result.status === "0x1") {
        console.log(`[${i + 1}/${toMint.length}] ✅ ${card.slice(0, 30)}`);
        progress.minted.push(card);
      } else {
        console.log(`[${i + 1}/${toMint.length}] ⚠️ ${card.slice(0, 30)} - reverted`);
      }
    } catch (e) {
      console.log(`[${i + 1}/${toMint.length}] ❌ ${card.slice(0, 30)} - ${e.message.slice(0, 50)}`);
    }
    
    if ((i + 1) % 10 === 0) saveProgress(progress);
    
    // Wait for tx to settle
    await new Promise(r => setTimeout(r, 2000));
  }
  
  saveProgress(progress);
  console.log(`\n✅ Done! Minted: ${progress.minted.length}/${cards.length}`);
}

main().catch(console.error);
