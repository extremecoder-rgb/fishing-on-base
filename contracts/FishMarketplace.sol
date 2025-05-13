// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract FishMarketplace is ReentrancyGuard, Ownable {
   
    uint256 public feePercentage = 250;
    
   
    address public nftAddress;
    
    
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }
    
    
    mapping(uint256 => Listing) public listings;
    
    
    event FishListed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event FishSold(address indexed seller, address indexed buyer, uint256 indexed tokenId, uint256 price);
    event FishListingCancelled(address indexed seller, uint256 indexed tokenId);
    event FeePercentageUpdated(uint256 oldFeePercentage, uint256 newFeePercentage);
    
    constructor(address _nftAddress) {
        nftAddress = _nftAddress;
    }
    

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
    
    
    function buyFish(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Fish not listed for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        
        
        uint256 fee = (listing.price * feePercentage) / 10000;
        uint256 sellerProceeds = listing.price - fee;
        
        
        listings[tokenId].active = false;
        
       
        IERC721Enumerable(nftAddress).safeTransferFrom(listing.seller, msg.sender, tokenId);
        
       
        (bool success, ) = payable(listing.seller).call{value: sellerProceeds}("");
        require(success, "Transfer to seller failed");
        
        
        if (msg.value > listing.price) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit FishSold(listing.seller, msg.sender, tokenId, listing.price);
    }
    
    
    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Fish not listed for sale");
        require(listing.seller == msg.sender, "Not the seller");
        
        listings[tokenId].active = false;
        
        emit FishListingCancelled(msg.sender, tokenId);
    }
    
    
    function updateFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee too high"); // Max 10%
        uint256 oldFeePercentage = feePercentage;
        feePercentage = _feePercentage;
        
        emit FeePercentageUpdated(oldFeePercentage, _feePercentage);
    }
    
   
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
   
    function getActiveListings() external view returns (uint256[] memory, uint256[] memory) {
        
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= IERC721Enumerable(nftAddress).totalSupply(); i++) {
            if (listings[i].active) {
                activeCount++;
            }
        }
        
        
        uint256[] memory tokenIds = new uint256[](activeCount);
        uint256[] memory prices = new uint256[](activeCount);
        
       
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