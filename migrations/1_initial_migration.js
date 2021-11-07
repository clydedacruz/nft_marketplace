const ERC721MarketPlace = artifacts.require("ERC721MarketPlace");
const MusicNFT = artifacts.require("MusicNFT");

module.exports = async function (deployer) {
 await deployer.deploy(MusicNFT, "MusicNFT", "MUS","https://nft.hits.greatestmusic.com");


 let musicNftInstance =  await MusicNFT.deployed()
 let musicNftContractAddress = musicNftInstance.address;
 console.log(musicNftContractAddress);

 await deployer.deploy(ERC721MarketPlace, musicNftContractAddress);

};
