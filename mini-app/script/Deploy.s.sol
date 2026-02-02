// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/WavesTCGNFT.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        WavesTCGNFT nft = new WavesTCGNFT(
            "SURF Waves Cards",
            "SURF",
            "https://howlonghasitben.github.io/surf-works/metadata/",
            0x93709D98F406904845b44e5d8D47C9A7E6A250Ea,  // treasury
            0x93709D98F406904845b44e5d8D47C9A7E6A250Ea,  // royalty receiver
            500  // 5% royalty
        );
        
        console.log("Contract deployed to:", address(nft));
        
        vm.stopBroadcast();
    }
}
