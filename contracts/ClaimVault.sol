// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ClaimVault
 * @dev Vault for distributing free NFT claims with cooldown
 * Users can claim a random NFT every 2 hours
 */
contract ClaimVault is IERC721Receiver, Ownable, ReentrancyGuard {
    // The NFT contract we're distributing
    IERC721 public immutable nftContract;
    
    // Cooldown period: 2 hours
    uint256 public constant COOLDOWN = 2 hours;
    
    // Track deposited token IDs
    uint256[] public depositedTokenIds;
    mapping(uint256 => uint256) private tokenIdToIndex; // tokenId => index + 1 (0 means not deposited)
    
    // Track last claim time per wallet
    mapping(address => uint256) public lastClaim;
    
    // Events
    event Deposited(address indexed from, uint256 tokenId);
    event Claimed(address indexed user, uint256 tokenId);
    event Withdrawn(address indexed to, uint256 tokenId);
    
    constructor(address _nftContract) Ownable(msg.sender) {
        require(_nftContract != address(0), "Invalid NFT contract");
        nftContract = IERC721(_nftContract);
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
        require(msg.sender == address(nftContract), "Wrong NFT contract");
        
        // Add to deposited list
        depositedTokenIds.push(tokenId);
        tokenIdToIndex[tokenId] = depositedTokenIds.length; // Store index + 1
        
        emit Deposited(from, tokenId);
        
        return IERC721Receiver.onERC721Received.selector;
    }
    
    /**
     * @dev Claim a random available NFT
     * Requires 2 hour cooldown between claims
     */
    function claim() external nonReentrant {
        require(depositedTokenIds.length > 0, "No NFTs available");
        require(canClaim(msg.sender), "Cooldown not expired");
        
        // Update last claim time
        lastClaim[msg.sender] = block.timestamp;
        
        // Get pseudo-random index
        uint256 randomIndex = uint256(
            keccak256(abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                msg.sender,
                depositedTokenIds.length
            ))
        ) % depositedTokenIds.length;
        
        uint256 tokenId = depositedTokenIds[randomIndex];
        
        // Remove from deposited list (swap and pop)
        _removeTokenFromList(randomIndex);
        
        // Transfer NFT to claimer
        nftContract.safeTransferFrom(address(this), msg.sender, tokenId);
        
        emit Claimed(msg.sender, tokenId);
    }
    
    /**
     * @dev Check if address can claim (cooldown expired)
     */
    function canClaim(address user) public view returns (bool) {
        return block.timestamp >= lastClaim[user] + COOLDOWN;
    }
    
    /**
     * @dev Get seconds until user can claim again
     */
    function cooldownRemaining(address user) external view returns (uint256) {
        uint256 nextClaimTime = lastClaim[user] + COOLDOWN;
        if (block.timestamp >= nextClaimTime) {
            return 0;
        }
        return nextClaimTime - block.timestamp;
    }
    
    /**
     * @dev Get number of available NFTs
     */
    function availableCount() external view returns (uint256) {
        return depositedTokenIds.length;
    }
    
    /**
     * @dev Get all deposited token IDs
     */
    function getDepositedTokenIds() external view returns (uint256[] memory) {
        return depositedTokenIds;
    }
    
    /**
     * @dev Owner: withdraw specific NFT
     */
    function withdraw(uint256 tokenId, address to) external onlyOwner {
        require(tokenIdToIndex[tokenId] > 0, "Token not in vault");
        
        uint256 index = tokenIdToIndex[tokenId] - 1;
        _removeTokenFromList(index);
        
        nftContract.safeTransferFrom(address(this), to, tokenId);
        
        emit Withdrawn(to, tokenId);
    }
    
    /**
     * @dev Owner: batch withdraw NFTs
     */
    function batchWithdraw(uint256[] calldata tokenIds, address to) external onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            if (tokenIdToIndex[tokenId] > 0) {
                uint256 index = tokenIdToIndex[tokenId] - 1;
                _removeTokenFromList(index);
                nftContract.safeTransferFrom(address(this), to, tokenId);
                emit Withdrawn(to, tokenId);
            }
        }
    }
    
    /**
     * @dev Internal: remove token from list using swap-and-pop
     */
    function _removeTokenFromList(uint256 index) internal {
        uint256 lastIndex = depositedTokenIds.length - 1;
        uint256 tokenId = depositedTokenIds[index];
        
        if (index != lastIndex) {
            uint256 lastTokenId = depositedTokenIds[lastIndex];
            depositedTokenIds[index] = lastTokenId;
            tokenIdToIndex[lastTokenId] = index + 1;
        }
        
        depositedTokenIds.pop();
        delete tokenIdToIndex[tokenId];
    }
}
