import { readFileSync } from 'fs';
import path from 'path';
import { createWalletClient, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { PinataSDK } from 'pinata';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

// Load env
dotenv.config({ path: path.join(process.env.HOME, '.env') });
dotenv.config({ path: path.join(process.env.HOME, 'pepeArtGen-fork/mini-app/.env') });

const CONTRACT_ADDRESS = '0xcc2d6ba8564541e6e51fe5522e26d4f4bbdd458b';  // Correct contract!
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

// Import the card HTML generator
import { generateCardHTML } from '../server/cardHTMLGenerator.mjs';

async function renderCardToPNG(html) {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 560 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  const buffer = await page.screenshot({ type: 'png', omitBackground: true });
  await browser.close();
  return buffer;
}

async function main() {
  console.log('🚀 Starting proper Phoenix mint...\n');
  
  const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: 'gateway.pinata.cloud' });
  
  // Load phoenix card with full theme
  const data = JSON.parse(readFileSync(
    path.join(process.env.HOME, 'pepeArtGen-fork/mini-app/public/surfworks-cards.json'), 'utf8'
  ));
  const phoenix = data.cards.find(c => c.id === 'phoenix');
  console.log('📋 Card:', phoenix.name);
  
  // Step 1: Upload raw image (use existing surf-works URL, fetch and re-upload)
  console.log('\n📤 Step 1: Uploading raw image...');
  const rawImageResp = await fetch(phoenix.image);
  const rawImageBuffer = Buffer.from(await rawImageResp.arrayBuffer());
  const rawImageBlob = new Blob([rawImageBuffer], { type: 'image/png' });
  const rawUpload = await pinata.upload.public.file(new File([rawImageBlob], 'phoenix_raw.png'));
  const rawCID = rawUpload.cid;
  console.log('✅ Raw image:', rawCID);
  
  // Step 2: Render card with theme to PNG
  console.log('\n📤 Step 2: Rendering card with theme...');
  const cardHTML = generateCardHTML({
    ...phoenix,
    imageData: `https://gateway.pinata.cloud/ipfs/${rawCID}`
  });
  const cardPngBuffer = await renderCardToPNG(cardHTML);
  const cardPngBlob = new Blob([cardPngBuffer], { type: 'image/png' });
  const cardPngUpload = await pinata.upload.public.file(new File([cardPngBlob], 'phoenix_card.png'));
  const cardPngCID = cardPngUpload.cid;
  console.log('✅ Card PNG:', cardPngCID);
  
  // Step 3: Upload HTML card
  console.log('\n📤 Step 3: Uploading HTML card...');
  const htmlBlob = new Blob([cardHTML], { type: 'text/html' });
  const htmlUpload = await pinata.upload.public.file(new File([htmlBlob], 'phoenix_card.html'));
  const htmlCID = htmlUpload.cid;
  console.log('✅ HTML card:', htmlCID);
  
  // Step 4: Create and upload metadata
  console.log('\n📤 Step 4: Creating metadata...');
  const metadata = {
    name: phoenix.name + ' ⟨Mythical⟩',
    description: phoenix.description,
    image: `https://gateway.pinata.cloud/ipfs/${cardPngCID}`,
    animation_url: `https://gateway.pinata.cloud/ipfs/${htmlCID}`,
    external_url: 'https://surf.works',
    attributes: [
      { trait_type: 'Rarity', value: '1/1' },
      { trait_type: 'Level', value: phoenix.level },
      { trait_type: 'Attack', value: phoenix.stats?.attack },
      { trait_type: 'Defense', value: phoenix.stats?.defense },
      { trait_type: 'Theme', value: 'Phoenix Fire' },
      { trait_type: 'Type', value: phoenix.type },
      { trait_type: 'Artist', value: 'SURF FINANCE STUDIOS' },
      { trait_type: 'Collection', value: 'Waves Collection' }
    ],
    image_ipfs: `ipfs://${cardPngCID}`,
    animation_url_ipfs: `ipfs://${htmlCID}`
  };
  
  const metadataUpload = await pinata.upload.public.json(metadata);
  const metadataCID = metadataUpload.cid;
  console.log('✅ Metadata:', metadataCID);
  
  // Step 5: Mint!
  console.log('\n🎴 Minting to correct contract...');
  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log('👛 Wallet:', account.address);
  
  const publicClient = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') });
  const walletClient = createWalletClient({ account, chain: base, transport: http('https://mainnet.base.org') });
  
  const metadataURI = `ipfs://${metadataCID}`;
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: NFT_ABI,
    functionName: 'mint',
    args: [metadataURI],
    value: 0n
  });
  
  console.log('📝 TX:', hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('\n🎉 MINTED! Block:', receipt.blockNumber);
  console.log('🔗 https://basescan.org/tx/' + hash);
}

main().catch(console.error);
