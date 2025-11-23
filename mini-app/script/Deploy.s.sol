// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/PepeArtGenNFT.sol";

/**
 * @title DeployPepeArtGen
 * @notice Deployment script for PepeArtGenNFT contract
 * @dev Run with: forge script script/Deploy.s.sol:DeployPepeArtGen --rpc-url <network> --broadcast --verify
 */
contract DeployPepeArtGen is Script {
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address royaltyReceiver = vm.envAddress("ROYALTY_RECEIVER");
        
        // Configuration
        string memory name = "SURF Waves Cards";
        string memory symbol = "SURF";
        string memory baseURI = "ipfs://YOUR_IPFS_HASH/"; // Update after metadata upload
        uint96 royaltyBasisPoints = 500; // 5%
        
        console.log("Deploying PepeArtGenNFT...");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Treasury:", treasury);
        console.log("Royalty Receiver:", royaltyReceiver);
        console.log("Base URI:", baseURI);
        
        vm.startBroadcast(deployerPrivateKey);
        
        PepeArtGenNFT nft = new PepeArtGenNFT(
            name,
            symbol,
            baseURI,
            treasury,
            royaltyReceiver,
            royaltyBasisPoints
        );
        
        vm.stopBroadcast();
        
        console.log("PepeArtGenNFT deployed at:", address(nft));
        console.log("Max Supply:", nft.MAX_SUPPLY());
        console.log("Mint Price:", nft.mintPrice());
        console.log("Owner:", nft.owner());
        
        console.log("\n=== NEXT STEPS ===");
        console.log("1. Verify contract on Basescan (automatically done with --verify flag)");
        console.log("2. Update baseURI after uploading metadata to IPFS");
        console.log("3. Test minting on testnet before mainnet");
        console.log("4. Set up OpenSea collection page");
    }
}
