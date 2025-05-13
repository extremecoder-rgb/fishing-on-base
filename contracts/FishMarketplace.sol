// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FishMarketplace
 * @dev Contract for trading fish NFTs in the retro fishing game
 */
contract FishMarketplace is ReentrancyGuard, Ownable {
    // Fee percentage (in basis points, 100 = 1%)
    uint256 public feePercentage = 250; // 2.5% fee
    
    // NFT contract address
    address public nftAddress;
    
    // Listing structure
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }
    
    // Mapping from token ID to listing
    mapping(uint256 => Listing) public listings;
    
    // Events
    event FishListed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event FishSold(address indexed seller, address indexed buyer, uint256 indexed tokenId, uint256 price);
    event FishListingCancelled(address indexed seller, uint256 indexed tokenId);
    event FeePercentageUpdated(uint256 oldFeePercentage, uint256 newFeePercentage);
    
    constructor(address _nftAddress) {
        nftAddress = _nftAddress;
    }
    
    /**
     * @dev Lists a fish NFT for sale
     * @param tokenId The ID of the token to list
     * @param price The price in wei
     */
    function listFish(uint256 tokenId, uint256 price) external {
        IERC721Enumerable nftContract = IERC721Enumerable(nftAddress);
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be greater than zero");
        require(nftContract.getApproved(tokenId) == address(this) || 
                nftContract.isApprovedForAll(msg.sender, address(this)), 
                "Marketplace not approved");
        
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });
        
        emit FishListed(msg.sender, tokenId, price);
    }
    
    /**
     * @dev Buys a listed fish NFT
     * @param tokenId The ID of the token to buy
     */
    function buyFish(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Fish not listed for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        
        // Calculate fee
        uint256 fee = (listing.price * feePercentage) / 10000;
        uint256 sellerProceeds = listing.price - fee;
        
        // Mark listing as inactive
        listings[tokenId].active = false;
        
        // Transfer NFT to buyer
        IERC721Enumerable(nftAddress).safeTransferFrom(listing.seller, msg.sender, tokenId);
        
        // Transfer funds to seller
        (bool success, ) = payable(listing.seller).call{value: sellerProceeds}("");
        require(success, "Transfer to seller failed");
        
        // Refund excess payment
        if (msg.value > listing.price) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit FishSold(listing.seller, msg.sender, tokenId, listing.price);
    }
    
    /**
     * @dev Cancels a fish listing
     * @param tokenId The ID of the token to cancel listing
     */
    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Fish not listed for sale");
        require(listing.seller == msg.sender, "Not the seller");
        
        listings[tokenId].active = false;
        
        emit FishListingCancelled(msg.sender, tokenId);
    }
    
    /**
     * @dev Updates the fee percentage
     * @param _feePercentage The new fee percentage in basis points
     */
    function updateFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee too high"); // Max 10%
        uint256 oldFeePercentage = feePercentage;
        feePercentage = _feePercentage;
        
        emit FeePercentageUpdated(oldFeePercentage, _feePercentage);
    }
    
    /**
     * @dev Withdraws accumulated fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Gets all active listings
     */
    function getActiveListings() external view returns (uint256[] memory, uint256[] memory) {
        // Count active listings
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= IERC721Enumerable(nftAddress).totalSupply(); i++) {
            if (listings[i].active) {
                activeCount++;
            }
        }
        
        // Create arrays for token IDs and prices
        uint256[] memory tokenIds = new uint256[](activeCount);
        uint256[] memory prices = new uint256[](activeCount);
        
        // Fill arrays
        uint256 index = 0;
        for (uint256 i = 1; i <= IERC721Enumerable(nftAddress).totalSupply(); i++) {
            if (listings[i].active) {
                tokenIds[index] = i;
                prices[index] = listings[i].price;
                index++;
            }
        }
        
        return (tokenIds, prices);
    }
}