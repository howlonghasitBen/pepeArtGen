// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ClaimVault
 * @dev Holds SURF Waves Cards NFTs and allows free claims with 2hr cooldown
 * One claim per wallet per 2 hours
 */
contract ClaimVault is IERC721Receiver, Ownable, ReentrancyGuard {
    // The NFT contract we're distributing
    IERC721 public immutable nftContract;
    
    // Cooldown period (2 hours)
    uint256 public constant COOLDOWN = 2 hours;
    
    // Track last claim time per wallet
    mapping(address => uint256) public lastClaim;
    
    // Array of token IDs held in vault
    uint256[] public heldTokenIds;
    
    // Quick lookup for token position in array
    mapping(uint256 => uint256) private tokenIndex;
    
    // Events
    event Claimed(address indexed user, uint256 indexed tokenId);
    event Deposited(address indexed from, uint256 indexed tokenId);
    event Withdrawn(address indexed to, uint256 indexed tokenId);
    
    /**
     * @dev Constructor
     * @param _nftContract Address of the SURF Waves Cards NFT contract
     */
    constructor(address _nftContract) Ownable(msg.sender) {
        require(_nftContract != address(0), "Invalid NFT contract");
        nftContract = IERC721(_nftContract);
    }
    
    /**
     * @dev Check if user can claim (cooldown passed)
     */
    function canClaim(address user) public view returns (bool) {
        return block.timestamp >= lastClaim[user] + COOLDOWN;
    }
    
    /**
     * @dev Get time until user can claim again (0 if ready)
     */
    function timeUntilClaim(address user) public view returns (uint256) {
        uint256 nextClaimTime = lastClaim[user] + COOLDOWN;
        if (block.timestamp >= nextClaimTime) {
            return 0;
        }
        return nextClaimTime - block.timestamp;
    }
    
    /**
     * @dev Get number of NFTs available to claim
     */
    function availableCount() public view returns (uint256) {
        return heldTokenIds.length;
    }
    
    /**
     * @dev Claim a random NFT (2hr cooldown per wallet)
     */
    function claim() external nonReentrant returns (uint256) {
        require(canClaim(msg.sender), "Cooldown not passed");
        require(heldTokenIds.length > 0, "No NFTs available");
        
        // Update last claim time
        lastClaim[msg.sender] = block.timestamp;
        
        // Pick pseudo-random index based on block data
        uint256 randomIndex = uint256(
            keccak256(abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                msg.sender,
                heldTokenIds.length
            ))
        ) % heldTokenIds.length;
        
        // Get token ID
        uint256 tokenId = heldTokenIds[randomIndex];
        
        // Remove from array (swap with last, then pop)
        _removeTokenFromArray(randomIndex);
        
        // Transfer NFT to claimer
        nftContract.safeTransferFrom(address(this), msg.sender, tokenId);
        
        emit Claimed(msg.sender, tokenId);
        return tokenId;
    }
    
    /**
     * @dev Receive NFTs via safeTransferFrom
     */
    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes calldata
    ) external override returns (bytes4) {
        require(msg.sender == address(nftContract), "Only accept target NFT");
        
        // Add to held tokens
        tokenIndex[tokenId] = heldTokenIds.length;
        heldTokenIds.push(tokenId);
        
        emit Deposited(from, tokenId);
        return this.onERC721Received.selector;
    }
    
    /**
     * @dev Owner can withdraw specific NFT
     */
    function withdrawNFT(uint256 tokenId, address to) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        
        // Find token in array
        uint256 index = tokenIndex[tokenId];
        require(index < heldTokenIds.length && heldTokenIds[index] == tokenId, "Token not in vault");
        
        // Remove from array
        _removeTokenFromArray(index);
        
        // Transfer
        nftContract.safeTransferFrom(address(this), to, tokenId);
        
        emit Withdrawn(to, tokenId);
    }
    
    /**
     * @dev Owner can batch withdraw NFTs
     */
    function batchWithdrawNFTs(uint256[] calldata tokenIds, address to) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            uint256 index = tokenIndex[tokenId];
            require(index < heldTokenIds.length && heldTokenIds[index] == tokenId, "Token not in vault");
            
            _removeTokenFromArray(index);
            nftContract.safeTransferFrom(address(this), to, tokenId);
            
            emit Withdrawn(to, tokenId);
        }
    }
    
    /**
     * @dev Get all held token IDs (for frontend)
     */
    function getHeldTokenIds() external view returns (uint256[] memory) {
        return heldTokenIds;
    }
    
    /**
     * @dev Internal: remove token from array by swapping with last
     */
    function _removeTokenFromArray(uint256 index) internal {
        uint256 lastIndex = heldTokenIds.length - 1;
        
        if (index != lastIndex) {
            uint256 lastTokenId = heldTokenIds[lastIndex];
            heldTokenIds[index] = lastTokenId;
            tokenIndex[lastTokenId] = index;
        }
        
        delete tokenIndex[heldTokenIds[lastIndex]];
        heldTokenIds.pop();
    }
}
