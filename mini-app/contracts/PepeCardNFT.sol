// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PepeCardNFT
 * @dev NFT contract for minting Pepe trading cards on BASE
 * Minting is FREE - users already paid for generation service off-chain
 * Only gas fees apply
 */
contract PepeCardNFT is ERC721, ERC721URIStorage, Ownable {
    // Counter for token IDs
    uint256 private _nextTokenId;

    // Events
    event CardMinted(address indexed minter, uint256 indexed tokenId, string tokenURI);

    /**
     * @dev Constructor
     */
    constructor()
        ERC721("Pepe Card NFT", "PEPE")
        Ownable(msg.sender)
    {
    }

    /**
     * @dev Mint a single card NFT - FREE (only gas)
     * @param to Recipient address
     * @param metadataURI IPFS or metadata URI for the card
     */
    function mintCard(address to, string memory metadataURI) public returns (uint256) {
        require(bytes(metadataURI).length > 0, "Metadata URI required");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        emit CardMinted(msg.sender, tokenId, metadataURI);

        return tokenId;
    }

    /**
     * @dev Batch mint multiple cards (more gas efficient) - FREE (only gas)
     * @param to Recipient address
     * @param metadataURIs Array of metadata URIs
     */
    function batchMintCards(address to, string[] memory metadataURIs)
        public
        returns (uint256[] memory)
    {
        uint256 count = metadataURIs.length;
        require(count > 0, "No URIs provided");
        require(count <= 20, "Max 20 cards per batch");

        uint256[] memory tokenIds = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            require(bytes(metadataURIs[i]).length > 0, "Empty metadata URI");

            uint256 tokenId = _nextTokenId++;
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, metadataURIs[i]);

            tokenIds[i] = tokenId;

            emit CardMinted(msg.sender, tokenId, metadataURIs[i]);
        }

        return tokenIds;
    }

    /**
     * @dev Get total minted cards
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    // Required overrides
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
