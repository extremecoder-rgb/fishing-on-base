// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract FishingGameNFT is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => FishCharacteristics) private _fishCharacteristics;
    
   
    enum FishType { COMMON, RARE, EPIC, LEGENDARY }
    
    struct FishCharacteristics {
        FishType fishType;
        uint256 weight;
        uint256 length;
        uint256 timestamp;
        string location;
    }
    
    
    event FishCaught(address indexed player, uint256 indexed tokenId, FishType fishType, uint256 weight);
    
    constructor() ERC721("RetroFishingGame", "FISH") {}
    
    
    function _generateRandomNumber(address player, string memory location) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, player, location)));
    }

    function startFishing(string memory location) external returns (uint256 tokenId) {
        uint256 randomNumber = _generateRandomNumber(msg.sender, location);
        
        
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

        
        uint256 baseWeight = (randomNumber >> 128) % 1000;
        uint256 baseLength = (randomNumber >> 64) % 100;

       
        uint256 weight = baseWeight + (uint256(fishType) * 250);
        uint256 length = baseLength + (uint256(fishType) * 20);

       
        FishCharacteristics memory fishCharacteristics = FishCharacteristics({
            fishType: fishType,
            weight: weight,
            length: length,
            timestamp: block.timestamp,
            location: location
        });

        
        _tokenIds.increment();
        tokenId = _tokenIds.current();
        _safeMint(msg.sender, tokenId);
        _fishCharacteristics[tokenId] = fishCharacteristics;
        
        emit FishCaught(msg.sender, tokenId, fishType, weight);
        
        return tokenId;
    }


    function setTokenURI(uint256 tokenId, string memory _tokenURI) external onlyOwner {
        require(_exists(tokenId), "URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

   
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        
        string memory _tokenURI = _tokenURIs[tokenId];
        return _tokenURI;
    }

    
    function getFishCharacteristics(uint256 tokenId) external view returns (FishCharacteristics memory) {
        require(_exists(tokenId), "Query for nonexistent token");
        return _fishCharacteristics[tokenId];
    }

    
    function getFishByOwner(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        
        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokenIds;
    }
}