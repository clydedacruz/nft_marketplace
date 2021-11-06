const truffleAssert = require('truffle-assertions');

const MusicNft = artifacts.require("MusicNft");
const ERC721MarketPlace = artifacts.require("ERC721MarketPlace");


contract("Marketplace contract - Sale creation", async accounts => {

    let musicNftInstance, marketPlaceInstance, nftSeller, tokenIdOfSellersNft;

    it("create required NFTs", async () => {
        musicNftInstance = await MusicNft.deployed();
        marketPlaceInstance = await ERC721MarketPlace.deployed();

        nftSeller = accounts[1];
        // Mint a music NFT
        let resp = await musicNftInstance.mint(nftSeller);


        let sellerNftBalance = await musicNftInstance.balanceOf(nftSeller);
        assert.equal(sellerNftBalance.valueOf(), 1);

        let sellerToken = await musicNftInstance.tokenOfOwnerByIndex(nftSeller, 0);
        tokenIdOfSellersNft = sellerToken.toString();
      });

    it("fail to create sale if transfer of NFT is not pre-approved to marketplace contract address", async () => {

        // approve transfer to marketplace contract 
        // await musicNftInstance.approve(marketPlaceInstance.address, tokenIdOfSellersNft, { from: nftSeller });

        await truffleAssert.reverts(
            // create sale on marketplace with incorrect token ID
            marketPlaceInstance.createSale(tokenIdOfSellersNft, 10000000, 120, { from: nftSeller }),
            "transfer caller is not owner nor approved"
        )
    });

    it("fail to create sale if token ID in sale creation transaction is incorrect", async () => {

        // approve transfer to marketplace contract 
        await musicNftInstance.approve(marketPlaceInstance.address, tokenIdOfSellersNft, { from: nftSeller });

        await truffleAssert.reverts(
            // create sale on marketplace with incorrect token ID
            marketPlaceInstance.createSale(12, 10000000, 120, { from: nftSeller }),
            "operator query for nonexistent token"
        )
    });

    it("fail to create sale if seller does not own the NFT", async () => {

        // token transfer is already approved in a test that executes before this 

        await truffleAssert.reverts(
            // create sale on marketplace with an account that doesnt own the NFT
            marketPlaceInstance.createSale(tokenIdOfSellersNft, 10000000, 120),
            "transfer of token that is not own"
        )
    });

    it("fail to show sale before it is created", async () => {
        await truffleAssert.reverts(
            marketPlaceInstance.getSale(0)
        );
    });

    it("successfully create sale", async () => {
        // create sale on marketplace
        await marketPlaceInstance.createSale(tokenIdOfSellersNft, 10000000, 120, { from: nftSeller });
    });

    it("succesfully show created sale", async () => {
        let createdSales = await marketPlaceInstance.getSale(0);
    });



    // test with bad sale end time 
    // test with bad bid price 
});
