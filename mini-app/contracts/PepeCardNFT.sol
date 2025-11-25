// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PepeCardNFT
 * @dev NFT contract for minting Pepe trading cards on BASE
 * Minting fee: 2.50 USDC per card
 */
contract PepeCardNFT is ERC721, ERC721URIStorage, Ownable {
    using SafeERC20 for IERC20;

    // USDC contract on BASE
    IERC20 public immutable USDC;

    // Minting fee in USDC (6 decimals)
    uint256 public constant MINT_FEE = 2_500000; // 2.50 USDC

    // Counter for token IDs
    uint256 private _nextTokenId;

    // Treasury address for collected fees
    address public treasury;

    // Events
    event CardMinted(address indexed minter, uint256 indexed tokenId, string tokenURI);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FeesWithdrawn(address indexed recipient, uint256 amount);

    /**
     * @dev Constructor
     * @param _usdcAddress USDC token address on BASE
     * @param _treasury Treasury address for collected fees
     */
    constructor(address _usdcAddress, address _treasury)
        ERC721("Pepe Card NFT", "PEPE")
        Ownable(msg.sender)
    {
        require(_usdcAddress != address(0), "Invalid USDC address");
        require(_treasury != address(0), "Invalid treasury address");

        USDC = IERC20(_usdcAddress);
        treasury = _treasury;
    }

    /**
     * @dev Mint a single card NFT
     * @param to Recipient address
     * @param metadataURI IPFS or metadata URI for the card
     */
    function mintCard(address to, string memory metadataURI) public returns (uint256) {
        require(bytes(metadataURI).length > 0, "Metadata URI required");

        // Transfer USDC fee from minter to treasury
        USDC.safeTransferFrom(msg.sender, treasury, MINT_FEE);

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        emit CardMinted(msg.sender, tokenId, metadataURI);

        return tokenId;
    }

    /**
     * @dev Batch mint multiple cards (more gas efficient)
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

        // Transfer total USDC fee
        uint256 totalFee = MINT_FEE * count;
        USDC.safeTransferFrom(msg.sender, treasury, totalFee);

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
     * @dev Update treasury address (only owner)
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @dev Get total minted cards
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev Calculate total fee for batch minting
     * @param count Number of cards to mint
     */
    function calculateBatchFee(uint256 count) external pure returns (uint256) {
        return MINT_FEE * count;
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
