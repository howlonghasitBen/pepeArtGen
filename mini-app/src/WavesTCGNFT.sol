// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "openzeppelin/token/ERC721/ERC721.sol";
import "openzeppelin/token/ERC721/extensions/ERC721URIStorage.sol";
import "openzeppelin/token/common/ERC2981.sol";
import "openzeppelin/access/Ownable.sol";
import "openzeppelin/security/ReentrancyGuard.sol";
import "openzeppelin/security/Pausable.sol";
import "openzeppelin/utils/Counters.sol";

contract WavesTCGNFT is
    ERC721,
    ERC721URIStorage,
    ERC2981,
    Ownable,
    ReentrancyGuard,
    Pausable 
{
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;
    
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public mintPrice = 0.001 ether;
    uint256 public constant MAX_PER_TX = 10;
    uint256 public mintCooldown = 60;
    
    string private _baseTokenURI;
    address public treasury;
    
    mapping(address => uint256) public lastMintTime;
    mapping(address => uint256) public walletMintCount;

    event CardMinted(address indexed minter, uint256 indexed tokenId, string tokenURI);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event CooldownUpdated(uint256 oldCooldown, uint256 newCooldown);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event BaseURIUpdated(string oldURI, string newURI);
    event FundsWithdrawn(address indexed to, uint256 amount);

    error MaxSupplyReached();
    error InsufficientPayment();
    error ExceedsMaxPerTransaction();
    error CooldownActive();
    error WithdrawalFailed();
    error InvalidAddress();
    error InvalidPrice();

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initialBaseURI,
        address _treasury,
        address _royaltyReceiver,
        uint96 _royaltyBasisPoints
    ) ERC721(_name, _symbol) {
        require(_treasury != address(0) && _royaltyReceiver != address(0), "Invalid address");
        
        _baseTokenURI = _initialBaseURI;
        treasury = _treasury;
        _setDefaultRoyalty(_royaltyReceiver, _royaltyBasisPoints);
        _tokenIds.increment();
    }

    function mint(string memory metadataURI) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        returns (uint256) 
    {
        return _mintInternal(msg.sender, metadataURI);
    }

    function mintBatch(string[] memory metadataURIs)
        external
        payable
        nonReentrant
        whenNotPaused
        returns (uint256[] memory)
    {
        uint256 quantity = metadataURIs.length;
        if (quantity > MAX_PER_TX) revert ExceedsMaxPerTransaction();
        if (msg.value < mintPrice * quantity) revert InsufficientPayment();
        if (lastMintTime[msg.sender] != 0 && block.timestamp < lastMintTime[msg.sender] + mintCooldown) revert CooldownActive();

        uint256[] memory tokenIds = new uint256[](quantity);
        for (uint256 i = 0; i < quantity; i++) {
            tokenIds[i] = _mintSingle(msg.sender, metadataURIs[i]);
        }

        lastMintTime[msg.sender] = block.timestamp;

        uint256 refund = msg.value - (mintPrice * quantity);
        if (refund > 0) {
            (bool success, ) = msg.sender.call{value: refund}("");
            if (!success) revert WithdrawalFailed();
        }

        return tokenIds;
    }

    function adminMint(address to, string memory metadataURI) external onlyOwner returns (uint256) {
        if (to == address(0)) revert InvalidAddress();
        return _mintSingle(to, metadataURI);
    }

    function _mintInternal(address to, string memory metadataURI) internal returns (uint256) {
        if (msg.value < mintPrice) revert InsufficientPayment();
        if (lastMintTime[to] != 0 && block.timestamp < lastMintTime[to] + mintCooldown) revert CooldownActive();

        uint256 tokenId = _mintSingle(to, metadataURI);
        lastMintTime[to] = block.timestamp;

        uint256 refund = msg.value - mintPrice;
        if (refund > 0) {
            (bool success, ) = to.call{value: refund}("");
            if (!success) revert WithdrawalFailed();
        }

        return tokenId;
    }

    function _mintSingle(address to, string memory metadataURI) internal returns (uint256) {
        uint256 currentId = _tokenIds.current();
        if (currentId > MAX_SUPPLY) revert MaxSupplyReached();

        uint256 tokenId = currentId;
        _tokenIds.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        walletMintCount[to]++;

        emit CardMinted(to, tokenId, metadataURI);
        return tokenId;
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        if (newPrice == 0) revert InvalidPrice();
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }

    function setCooldown(uint256 newCooldown) external onlyOwner {
        uint256 oldCooldown = mintCooldown;
        mintCooldown = newCooldown;
        emit CooldownUpdated(oldCooldown, newCooldown);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidAddress();
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        string memory oldURI = _baseTokenURI;
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(oldURI, newBaseURI);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        (bool success, ) = treasury.call{value: balance}("");
        if (!success) revert WithdrawalFailed();
        emit FundsWithdrawn(treasury, balance);
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIds.current() - 1;
    }

    function remainingSupply() external view returns (uint256) {
        uint256 currentId = _tokenIds.current();
        if (currentId > MAX_SUPPLY) return 0;
        return MAX_SUPPLY - currentId + 1;
    }

    function canMint(address wallet) external view returns (bool) {
        if (lastMintTime[wallet] == 0) return true;
        return block.timestamp >= lastMintTime[wallet] + mintCooldown;
    }

    function timeUntilMint(address wallet) external view returns (uint256) {
        if (lastMintTime[wallet] == 0) return 0;
        uint256 nextMintTime = lastMintTime[wallet] + mintCooldown;
        if (block.timestamp >= nextMintTime) return 0;
        return nextMintTime - block.timestamp;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        if (receiver == address(0)) revert InvalidAddress();
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) external onlyOwner {
        if (receiver == address(0)) revert InvalidAddress();
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        _resetTokenRoyalty(tokenId);
    }
}