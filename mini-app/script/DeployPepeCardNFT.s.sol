// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PepeCardNFT.sol";

/**
 * @title DeployPepeCardNFT
 * @notice Deployment script for PepeCardNFT contract (USDC-based)
 * @dev Run with: forge script script/DeployPepeCardNFT.s.sol:DeployPepeCardNFT --rpc-url base --broadcast --verify
 */
contract DeployPepeCardNFT is Script {
    // USDC addresses
    address constant USDC_BASE_MAINNET = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address treasury = vm.envAddress("TREASURY_ADDRESS");

        // Determine which USDC address to use based on chain ID
        address usdcAddress;
        if (block.chainid == 8453) {
            // Base mainnet
            usdcAddress = USDC_BASE_MAINNET;
        } else if (block.chainid == 84532) {
            // Base Sepolia testnet
            usdcAddress = USDC_BASE_SEPOLIA;
        } else {
            revert("Unsupported chain. Deploy on Base mainnet (8453) or Base Sepolia (84532)");
        }

        console.log("=== Deploying PepeCardNFT ===");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Treasury:", treasury);
        console.log("USDC Address:", usdcAddress);
        console.log("Mint Fee: 2.50 USDC");

        vm.startBroadcast(deployerPrivateKey);

        PepeCardNFT nft = new PepeCardNFT(usdcAddress, treasury);

        vm.stopBroadcast();

        console.log("\n=== DEPLOYMENT SUCCESSFUL ===");
        console.log("PepeCardNFT deployed at:", address(nft));
        console.log("Owner:", nft.owner());
        console.log("Treasury:", nft.treasury());
        console.log("Mint Fee:", nft.MINT_FEE(), "USDC (with 6 decimals = 2.50 USDC)");
        console.log("Total Minted:", nft.totalMinted());

        console.log("\n=== CONTRACT ABI ===");
        console.log("Save this address to your .env file:");
        console.log("VITE_NFT_CONTRACT_ADDRESS=", address(nft));

        console.log("\n=== NEXT STEPS ===");
        console.log("1. Contract is verified automatically with --verify flag");
        console.log("2. Update .env with VITE_NFT_CONTRACT_ADDRESS");
        console.log("3. Users must approve USDC spending before minting");
        console.log("4. Test minting flow: approve USDC -> mint card");
        console.log("5. Set up OpenSea collection page");

        console.log("\n=== IMPORTANT ===");
        console.log("Minting requires users to:");
        console.log("1. Pay 2.50 USDC for card generation (to backend/treasury)");
        console.log("2. Approve USDC for minting");
        console.log("3. Call mintCard() to mint NFT");
    }
}
