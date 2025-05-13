// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title FishingGameNFT
 * @dev Contract for minting fish NFTs in the retro fishing game
 */
contract FishingGameNFT is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    // Mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;
    
    // Mapping from token ID to fish characteristics
    mapping(uint256 => FishCharacteristics) private _fishCharacteristics;
    
    // Fish types and rarities
    enum FishType { COMMON, RARE, EPIC, LEGENDARY }
    
    struct FishCharacteristics {
        FishType fishType;
        uint256 weight;
        uint256 length;
        uint256 timestamp;
        string location;
    }
    
    // Events
    event FishCaught(address indexed player, uint256 indexed tokenId, FishType fishType, uint256 weight);
    
    constructor() ERC721("RetroFishingGame", "FISH") {}
    
    /**
     * @dev Generates a pseudo-random number using block variables
     */
    function _generateRandomNumber(address player, string memory location) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, player, location)));
    }

    /**
     * @dev Initiates a fishing attempt and immediately determines the result
     * @param location The location where the player is fishing
     */
    function startFishing(string memory location) external returns (uint256 tokenId) {
        uint256 randomNumber = _generateRandomNumber(msg.sender, location);
        
        // Determine fish type based on randomness
        uint256 fishTypeRandom = randomNumber % 100;
        FishType fishType;
        
        if (fishTypeRandom < 60) {
            fishType = FishType.COMMON;
        } else if (fishTypeRandom < 85) {
            fishType = FishType.RARE;
        } else if (fishTypeRandom < 95) {
            fishType = FishType.EPIC;
        } else {
            fishType = FishType.LEGENDARY;
        }

        // Generate weight and length based on the second part of the random number
        uint256 baseWeight = (randomNumber >> 128) % 1000;
        uint256 baseLength = (randomNumber >> 64) % 100;

        // Adjust weight and length based on fish type
        uint256 weight = baseWeight + (uint256(fishType) * 250);
        uint256 length = baseLength + (uint256(fishType) * 20);

        // Create fish characteristics
        FishCharacteristics memory fishCharacteristics = FishCharacteristics({
            fishType: fishType,
            weight: weight,
            length: length,
            timestamp: block.timestamp,
            location: location
        });

        // Mint the NFT
        _tokenIds.increment();
        tokenId = _tokenIds.current();
        _safeMint(msg.sender, tokenId);
        _fishCharacteristics[tokenId] = fishCharacteristics;
        
        emit FishCaught(msg.sender, tokenId, fishType, weight);
        
        return tokenId;
    }

    /**
     * @dev Sets the token URI for a given token
     * @param tokenId The token ID to set the URI for
     * @param _tokenURI The URI to assign
     */
    function setTokenURI(uint256 tokenId, string memory _tokenURI) external onlyOwner {
        require(_exists(tokenId), "URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    /**
     * @dev Returns the URI for a given token ID
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        
        string memory _tokenURI = _tokenURIs[tokenId];
        return _tokenURI;
    }

    /**
     * @dev Returns the fish characteristics for a given token ID
     */
    function getFishCharacteristics(uint256 tokenId) external view returns (FishCharacteristics memory) {
        require(_exists(tokenId), "Query for nonexistent token");
        return _fishCharacteristics[tokenId];
    }

    /**
     * @dev Returns all fish owned by an address
     */
    function getFishByOwner(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        
        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokenIds;
    }
}