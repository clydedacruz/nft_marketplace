// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// import "@openzeppelin/contracts/utils/Counters.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";

contract MusicNFT is ERC721PresetMinterPauserAutoId {
    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) ERC721PresetMinterPauserAutoId(name, symbol, baseTokenURI) {}
}

// contract MusicNFT is ERC721URIStorage, Ownable {
//     using Counters for Counters.Counter;
//     Counters.Counter private _tokenIds;

//     constructor() ERC721("MusicNFT", "MUS") {}

//     function mintNft(address receiver, string memory tokenURI) external onlyOwner returns (uint256) {
//         _tokenIds.increment();

//         uint256 newNftTokenId = _tokenIds.current();
//         _mint(receiver, newNftTokenId);
//         _setTokenURI(newNftTokenId, tokenURI);

//         return newNftTokenId;
//     }
// }
