// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PepeCardNFT.sol";

/**
 * @title DeployPepeCardNFT
 * @notice Deployment script for PepeCardNFT contract (FREE minting)
 * @dev Run with: forge script script/DeployPepeCardNFT.s.sol:DeployPepeCardNFT --rpc-url base --broadcast --verify
 */
contract DeployPepeCardNFT is Script {
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        console.log("=== Deploying PepeCardNFT ===");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Mint Fee: FREE (only gas costs)");

        vm.startBroadcast(deployerPrivateKey);

        PepeCardNFT nft = new PepeCardNFT();

        vm.stopBroadcast();

        console.log("\n=== DEPLOYMENT SUCCESSFUL ===");
        console.log("PepeCardNFT deployed at:", address(nft));
        console.log("Owner:", nft.owner());
        console.log("Total Minted:", nft.totalMinted());

        console.log("\n=== CONTRACT ABI ===");
        console.log("Save this address to your .env file:");
        console.log("VITE_NFT_CONTRACT_ADDRESS=", address(nft));

        console.log("\n=== NEXT STEPS ===");
        console.log("1. Contract is verified automatically with --verify flag");
        console.log("2. Update .env with VITE_NFT_CONTRACT_ADDRESS");
        console.log("3. Test minting flow: generate card -> mint NFT");
        console.log("4. Set up OpenSea collection page");

        console.log("\n=== PAYMENT MODEL ===");
        console.log("Users pay 2.50 USDC to backend for card generation");
        console.log("Minting is FREE - only gas fees (~$0.01 on Base)");
        console.log("Payment happens before generation to prevent spam");
    }
}
