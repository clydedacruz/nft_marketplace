const truffleAssert = require('truffle-assertions');

const MusicNft = artifacts.require("MusicNft");
const ERC721MarketPlace = artifacts.require("ERC721MarketPlace");

contract("Marketplace contract - end sale", async accounts => {

    let musicNftInstance, marketPlaceInstance, nftSeller, tokenIdOfSellersNft;

    let bidder1 = accounts[2], bidder2 = accounts[3];

    it("Initial setup - create nfts and sales for test", async () => {
        musicNftInstance = await MusicNft.deployed();
        marketPlaceInstance = await ERC721MarketPlace.deployed();

        nftSeller = accounts[1];
        // Mint NFTs
        await musicNftInstance.mint(nftSeller);
        await musicNftInstance.mint(nftSeller);

        let sellerNftBalance = await musicNftInstance.balanceOf(nftSeller);
        assert.equal(sellerNftBalance.valueOf(), 2);

        let sellerToken = await musicNftInstance.tokenOfOwnerByIndex(nftSeller, 0);
        tokenIdOfSellersNft = sellerToken.toString();

        // approve transfer to marketplace contract 
        await musicNftInstance.approve(marketPlaceInstance.address, tokenIdOfSellersNft, { from: nftSeller });

        // create sale on marketplace
        await marketPlaceInstance.createSale(tokenIdOfSellersNft, 10000000, 120, { from: nftSeller });

        // creating this sale just so it expires really soon, tokenid=1
        await musicNftInstance.approve(marketPlaceInstance.address, 1, { from: nftSeller });
        await marketPlaceInstance.createSale(1, 10000000, 1, { from: nftSeller });

        // Ensure that sale expires
        await new Promise(r => setTimeout(r, 2000));

        let bidAmt = 10000001;
        await marketPlaceInstance.bidForSale(0, { from: bidder1, value: 10000001 });

    });

    it("ClaimNft should fail if sale has not yet ended", async () => {
    });

    it("Endsale should fail if caller is not the sale poster", async () => {

        await truffleAssert.reverts(
            marketPlaceInstance.endSale(1, { from: bidder1 }),
            "Caller is not the sale poster"
        );
    });

    it("Successfully call endsale", async () => {

        // to ensure that the sale has indeed timed out 
        let endSaleTxResult = await marketPlaceInstance.endSale(1, { from: nftSeller });

        // status of sale should change to SALE_ENDED. Here we are directly comparing the enum value
        let saleData = await marketPlaceInstance.getSale(1);
        let saleStatus = saleData[7];
        assert.equal(saleStatus, 1);

        // verify that SALE_ENDED event is emitted. enum value is 2
        truffleAssert.eventEmitted(
            endSaleTxResult, 'NftSaleEvent', (ev) => {
                return ev.saleId == 1 && ev.eventType == 2
            });
    });

    it("ClaimNft success should close sale and transfer NFT", async () => {
    });


    it("Endsale should fail if sale has already ended", async () => {

        await truffleAssert.reverts(
            marketPlaceInstance.endSale(1, { from: nftSeller }),
            "Sale not active"
        );
    });

    it("Endsale should fail if required time has not yet elapsed", async () => {

        await truffleAssert.reverts(
            marketPlaceInstance.endSale(0, { from: nftSeller }),
            "Auction not yet ended"
        );
    });
});

