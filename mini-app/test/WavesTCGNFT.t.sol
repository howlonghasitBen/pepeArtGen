// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/WavesTCGNFT.sol";

contract WavesTCGNFTTest is Test {
    WavesTCGNFT public nft;
    
    address public owner = address(1);
    address public treasury = address(2);
    address public royaltyReceiver = address(3);
    address public user1 = address(4);
    address public user2 = address(5);
    
    string constant NAME = "SURF Waves Cards";
    string constant SYMBOL = "SURF";
    string constant BASE_URI = "ipfs://QmTestHash/";
    uint96 constant ROYALTY_BPS = 500; // 5%
    uint256 constant MINT_PRICE = 0.001 ether;
    
    event CardMinted(address indexed minter, uint256 indexed tokenId, string tokenURI);
    
    function setUp() public {
        vm.startPrank(owner);
        nft = new WavesTCGNFT(
            NAME,
            SYMBOL,
            BASE_URI,
            treasury,
            royaltyReceiver,
            ROYALTY_BPS
        );
        vm.stopPrank();
        
        // Fund test users
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }
    
    /*//////////////////////////////////////////////////////////////
                        DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_Deployment() public {
        assertEq(nft.name(), NAME);
        assertEq(nft.symbol(), SYMBOL);
        assertEq(nft.owner(), owner);
        assertEq(nft.treasury(), treasury);
        assertEq(nft.mintPrice(), MINT_PRICE);
        assertEq(nft.MAX_SUPPLY(), 10000);
        assertEq(nft.totalSupply(), 0);
    }
    
    function test_RoyaltyInfo() public {
        (address receiver, uint256 amount) = nft.royaltyInfo(1, 1 ether);
        assertEq(receiver, royaltyReceiver);
        assertEq(amount, 0.05 ether); // 5% of 1 ETH
    }
    
    /*//////////////////////////////////////////////////////////////
                        MINTING TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_Mint_Success() public {
        vm.startPrank(user1);
        
        vm.expectEmit(true, true, false, true);
        emit CardMinted(user1, 1, "1.json");
        
        uint256 tokenId = nft.mint{value: MINT_PRICE}("1.json");
        
        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), user1);
        assertEq(nft.totalSupply(), 1);
        assertEq(nft.walletMintCount(user1), 1);
        assertEq(nft.tokenURI(1), string.concat(BASE_URI, "1.json"));
        
        vm.stopPrank();
    }
    
    function test_Mint_RefundsExcessPayment() public {
        vm.startPrank(user1);
        
        uint256 balanceBefore = user1.balance;
        nft.mint{value: MINT_PRICE + 0.5 ether}("1.json");
        uint256 balanceAfter = user1.balance;
        
        assertEq(balanceBefore - balanceAfter, MINT_PRICE);
        
        vm.stopPrank();
    }
    
    function test_Mint_RevertsInsufficientPayment() public {
        vm.startPrank(user1);
        
        vm.expectRevert(WavesTCGNFT.InsufficientPayment.selector);
        nft.mint{value: MINT_PRICE - 1}("1.json");
        
        vm.stopPrank();
    }
    
    function test_Mint_RevertsCooldown() public {
        vm.startPrank(user1);
        
        // First mint succeeds
        nft.mint{value: MINT_PRICE}("1.json");
        
        // Second mint within cooldown fails
        vm.expectRevert(WavesTCGNFT.CooldownActive.selector);
        nft.mint{value: MINT_PRICE}("2.json");
        
        // Wait for cooldown
        vm.warp(block.timestamp + 61);
        
        // Third mint succeeds
        nft.mint{value: MINT_PRICE}("2.json");
        assertEq(nft.totalSupply(), 2);
        
        vm.stopPrank();
    }
    
    function test_Mint_RevertsWhenPaused() public {
        vm.prank(owner);
        nft.pause();
        
        vm.startPrank(user1);
        vm.expectRevert();
        nft.mint{value: MINT_PRICE}("1.json");
        vm.stopPrank();
    }
    
    function test_Mint_RevertsMaxSupply() public {
        vm.startPrank(owner);
        
        // Mint MAX_SUPPLY tokens
        for (uint256 i = 1; i <= nft.MAX_SUPPLY(); i++) {
            nft.adminMint(user1, string(abi.encodePacked(vm.toString(i), ".json")));
        }
        
        vm.stopPrank();
        
        // Next mint should fail
        vm.startPrank(user1);
        vm.expectRevert(WavesTCGNFT.MaxSupplyReached.selector);
        nft.mint{value: MINT_PRICE}("10001.json");
        vm.stopPrank();
    }
    
    /*//////////////////////////////////////////////////////////////
                        BATCH MINTING TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_MintBatch_Success() public {
        vm.startPrank(user1);
        
        string[] memory uris = new string[](3);
        uris[0] = "1.json";
        uris[1] = "2.json";
        uris[2] = "3.json";
        
        uint256[] memory tokenIds = nft.mintBatch{value: MINT_PRICE * 3}(uris);
        
        assertEq(tokenIds.length, 3);
        assertEq(tokenIds[0], 1);
        assertEq(tokenIds[1], 2);
        assertEq(tokenIds[2], 3);
        assertEq(nft.totalSupply(), 3);
        assertEq(nft.walletMintCount(user1), 3);
        
        vm.stopPrank();
    }
    
    function test_MintBatch_RevertsExceedsMaxPerTx() public {
        vm.startPrank(user1);
        
        string[] memory uris = new string[](11);
        for (uint256 i = 0; i < 11; i++) {
            uris[i] = string(abi.encodePacked(vm.toString(i + 1), ".json"));
        }
        
        vm.expectRevert(WavesTCGNFT.ExceedsMaxPerTransaction.selector);
        nft.mintBatch{value: MINT_PRICE * 11}(uris);
        
        vm.stopPrank();
    }
    
    /*//////////////////////////////////////////////////////////////
                        ADMIN MINT TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_AdminMint_Success() public {
        vm.startPrank(owner);
        
        uint256 tokenId = nft.adminMint(user1, "1.json");
        
        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), user1);
        assertEq(nft.totalSupply(), 1);
        
        vm.stopPrank();
    }
    
    function test_AdminMint_RevertsNonOwner() public {
        vm.startPrank(user1);
        
        vm.expectRevert();
        nft.adminMint(user2, "1.json");
        
        vm.stopPrank();
    }
    
    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_SetMintPrice() public {
        vm.startPrank(owner);
        
        nft.setMintPrice(0.002 ether);
        assertEq(nft.mintPrice(), 0.002 ether);
        
        vm.stopPrank();
    }
    
    function test_SetCooldown() public {
        vm.startPrank(owner);
        
        nft.setCooldown(120);
        assertEq(nft.mintCooldown(), 120);
        
        vm.stopPrank();
    }
    
    function test_SetTreasury() public {
        vm.startPrank(owner);
        
        address newTreasury = address(99);
        nft.setTreasury(newTreasury);
        assertEq(nft.treasury(), newTreasury);
        
        vm.stopPrank();
    }
    
    function test_SetBaseURI() public {
        vm.startPrank(owner);
        
        string memory newURI = "ipfs://QmNewHash/";
        nft.setBaseURI(newURI);
        
        vm.stopPrank();
        
        // Mint and check URI
        vm.startPrank(user1);
        nft.mint{value: MINT_PRICE}("1.json");
        assertEq(nft.tokenURI(1), string.concat(newURI, "1.json"));
        vm.stopPrank();
    }
    
    function test_Pause_Unpause() public {
        vm.startPrank(owner);
        
        nft.pause();
        vm.stopPrank();
        
        // Minting fails when paused
        vm.startPrank(user1);
        vm.expectRevert();
        nft.mint{value: MINT_PRICE}("1.json");
        vm.stopPrank();
        
        // Unpause
        vm.startPrank(owner);
        nft.unpause();
        vm.stopPrank();
        
        // Minting succeeds after unpause
        vm.startPrank(user1);
        nft.mint{value: MINT_PRICE}("1.json");
        assertEq(nft.totalSupply(), 1);
        vm.stopPrank();
    }
    
    function test_Withdraw() public {
        // Mint some NFTs to fund contract
        vm.startPrank(user1);
        nft.mint{value: MINT_PRICE}("1.json");
        vm.stopPrank();
        
        uint256 contractBalance = address(nft).balance;
        uint256 treasuryBalanceBefore = treasury.balance;
        
        // Withdraw
        vm.prank(owner);
        nft.withdraw();
        
        assertEq(address(nft).balance, 0);
        assertEq(treasury.balance, treasuryBalanceBefore + contractBalance);
    }
    
    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_RemainingSupply() public {
        assertEq(nft.remainingSupply(), nft.MAX_SUPPLY());
        
        vm.prank(user1);
        nft.mint{value: MINT_PRICE}("1.json");
        
        assertEq(nft.remainingSupply(), nft.MAX_SUPPLY() - 1);
    }
    
    function test_CanMint() public {
        // User can mint initially
        assertTrue(nft.canMint(user1));
        
        // Mint
        vm.prank(user1);
        nft.mint{value: MINT_PRICE}("1.json");
        
        // Cannot mint during cooldown
        assertFalse(nft.canMint(user1));
        
        // Wait for cooldown
        vm.warp(block.timestamp + 61);
        
        // Can mint again
        assertTrue(nft.canMint(user1));
    }
    
    function test_TimeUntilMint() public {
        // Initially 0
        assertEq(nft.timeUntilMint(user1), 0);
        
        // Mint
        vm.prank(user1);
        nft.mint{value: MINT_PRICE}("1.json");
        
        // Should be approximately cooldown period
        assertEq(nft.timeUntilMint(user1), 60);
        
        // Wait 30 seconds
        vm.warp(block.timestamp + 30);
        assertEq(nft.timeUntilMint(user1), 30);
        
        // Wait full cooldown
        vm.warp(block.timestamp + 31);
        assertEq(nft.timeUntilMint(user1), 0);
    }
    
    /*//////////////////////////////////////////////////////////////
                        ROYALTY TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_SetDefaultRoyalty() public {
        vm.startPrank(owner);
        
        address newReceiver = address(88);
        nft.setDefaultRoyalty(newReceiver, 750); // 7.5%
        
        (address receiver, uint256 amount) = nft.royaltyInfo(1, 1 ether);
        assertEq(receiver, newReceiver);
        assertEq(amount, 0.075 ether);
        
        vm.stopPrank();
    }
    
    function test_SetTokenRoyalty() public {
        vm.startPrank(owner);
        
        // Mint a token first
        nft.adminMint(user1, "1.json");
        
        // Set specific royalty for token 1
        address specificReceiver = address(77);
        nft.setTokenRoyalty(1, specificReceiver, 1000); // 10%
        
        (address receiver, uint256 amount) = nft.royaltyInfo(1, 1 ether);
        assertEq(receiver, specificReceiver);
        assertEq(amount, 0.1 ether);
        
        vm.stopPrank();
    }
    
    /*//////////////////////////////////////////////////////////////
                        GAS OPTIMIZATION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_Gas_SingleMint() public {
        vm.startPrank(user1);
        uint256 gasBefore = gasleft();
        nft.mint{value: MINT_PRICE}("1.json");
        uint256 gasUsed = gasBefore - gasleft();
        vm.stopPrank();
        
        // Log gas used (should be ~100k-150k on Base L2)
        emit log_named_uint("Gas used for single mint", gasUsed);
    }
    
    function test_Gas_BatchMint() public {
        vm.startPrank(user1);
        
        string[] memory uris = new string[](5);
        for (uint256 i = 0; i < 5; i++) {
            uris[i] = string(abi.encodePacked(vm.toString(i + 1), ".json"));
        }
        
        uint256 gasBefore = gasleft();
        nft.mintBatch{value: MINT_PRICE * 5}(uris);
        uint256 gasUsed = gasBefore - gasleft();
        
        vm.stopPrank();
        
        emit log_named_uint("Gas used for batch mint (5 NFTs)", gasUsed);
        emit log_named_uint("Gas per NFT in batch", gasUsed / 5);
    }
    
    /*//////////////////////////////////////////////////////////////
                        INTERFACE SUPPORT TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_SupportsInterface() public {
        // ERC-721
        assertTrue(nft.supportsInterface(0x80ac58cd));
        // ERC-2981 (Royalties)
        assertTrue(nft.supportsInterface(0x2a55205a));
    }
}
