const ERC721MarketPlace = artifacts.require("ERC721MarketPlace");

module.exports = function (deployer) {
  deployer.deploy(ERC721MarketPlace);
};
