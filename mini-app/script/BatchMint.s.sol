// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface IWavesTCGNFT {
    function adminMint(address to, string memory metadataURI) external returns (uint256);
}

contract BatchMint is Script {
    function run(string[] memory metadataURIs) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address contractAddr = vm.envAddress("CONTRACT_ADDRESS");
        address recipient = vm.envAddress("RECIPIENT");
        
        IWavesTCGNFT nft = IWavesTCGNFT(contractAddr);
        
        vm.startBroadcast(deployerPrivateKey);
        
        for (uint i = 0; i < metadataURIs.length; i++) {
            uint256 tokenId = nft.adminMint(recipient, metadataURIs[i]);
            console.log("Minted token", tokenId);
        }
        
        vm.stopBroadcast();
    }
}
