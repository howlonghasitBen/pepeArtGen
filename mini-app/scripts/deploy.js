const hre = require("hardhat");

async function main() {
  console.log("Deploying PepeCardNFT to BASE...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // USDC on BASE mainnet
  const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  // For Base Sepolia testnet, use this mock USDC
  // const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

  // Set treasury to deployer for now (change later)
  const treasury = deployer.address;

  console.log("USDC Address:", USDC_BASE);
  console.log("Treasury:", treasury);

  const PepeCardNFT = await hre.ethers.getContractFactory("PepeCardNFT");
  const nft = await PepeCardNFT.deploy(USDC_BASE, treasury);

  await nft.waitForDeployment();

  const address = await nft.getAddress();
  console.log("✅ PepeCardNFT deployed to:", address);

  console.log("\nContract details:");
  console.log("- Name: Pepe Card NFT");
  console.log("- Symbol: PEPE");
  console.log("- Mint Fee: 1 USDC");
  console.log("- Treasury:", treasury);

  console.log("\nVerifying contract on Basescan...");
  await hre.run("verify:verify", {
    address: address,
    constructorArguments: [USDC_BASE, treasury],
  });

  console.log("\n🎉 Deployment complete!");
  console.log("\nAdd this to your .env:");
  console.log(`VITE_NFT_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
