const truffleAssert = require('truffle-assertions');

const MusicNft = artifacts.require("MusicNft");
const ERC721MarketPlace = artifacts.require("ERC721MarketPlace");

contract("Marketplace contract - claim NFT", async accounts => {

    let musicNftInstance, marketPlaceInstance, nftSeller, tokenIdOfSellersNft;

    let bidder1 = accounts[2], bidder2 = accounts[3];

    it("Initial setup - create nfts and sales for test", async () => {
        musicNftInstance = await MusicNft.deployed();
        marketPlaceInstance = await ERC721MarketPlace.deployed();

        nftSeller = accounts[1];
        // Mint NFTs
        await musicNftInstance.mint(nftSeller);
        await musicNftInstance.mint(nftSeller);
        await musicNftInstance.mint(nftSeller);

        let sellerNftBalance = await musicNftInstance.balanceOf(nftSeller);
        assert.equal(sellerNftBalance.valueOf(), 3);

        let sellerToken = await musicNftInstance.tokenOfOwnerByIndex(nftSeller, 0);
        tokenIdOfSellersNft = sellerToken.toString();

        // approve transfer to marketplace contract 
        await musicNftInstance.approve(marketPlaceInstance.address, tokenIdOfSellersNft, { from: nftSeller });

        // create sale on marketplace
        await marketPlaceInstance.createSale(tokenIdOfSellersNft, 10000000, 120, { from: nftSeller });

        // creating this sale just so it expires really soon, tokenid=1
        await musicNftInstance.approve(marketPlaceInstance.address, 1, { from: nftSeller });
        await marketPlaceInstance.createSale(1, 10000000, 1, { from: nftSeller });

        await musicNftInstance.approve(marketPlaceInstance.address, 2, { from: nftSeller });
        await marketPlaceInstance.createSale(2, 10000000, 5, { from: nftSeller });


        let bidAmt = 10000001;
        await marketPlaceInstance.bidForSale(0, { from: bidder1, value: 10000001 });
        await marketPlaceInstance.bidForSale(2, { from: bidder1, value: 10000001 });

        // Ensure that sale expires
        await new Promise(r => setTimeout(r, 5000));

    });

    it("ClaimNft should fail for invalid sale ID", async () => {
        await truffleAssert.reverts(
            marketPlaceInstance.claimNft(10, { from: bidder1 }),
            "Sale is not valid"
        );
    });

    it("ClaimNft should fail if sale has not yet ended", async () => {
        await truffleAssert.reverts(
            marketPlaceInstance.claimNft(0, { from: bidder1 }),
            "Auction not yet ended"
        );
    });


    it("ClaimNft should fail when bids exist,  if caller is not the highest bidder", async () => {

        await truffleAssert.reverts(
            marketPlaceInstance.claimNft(2, { from: nftSeller }),
            "Caller is not the highest bidder"
        );
    });

    it("ClaimNft should fail when no bids exist,  if caller is not the sale poster", async () => {

        await truffleAssert.reverts(
            marketPlaceInstance.claimNft(1, { from: bidder1 }),
            "Caller is not the sale poster"
        );
    });

    it("Successfully call claimNft when no bids exist", async () => {

        let sellerNftBalance = await musicNftInstance.balanceOf(nftSeller);
        assert.equal(sellerNftBalance.valueOf(), 0);

        // to ensure that the sale has indeed timed out 
        let endSaleTxResult = await marketPlaceInstance.claimNft(1, { from: nftSeller });

        // status of sale should change to SALE_ENDED. Here we are directly comparing the enum value
        let saleData = await marketPlaceInstance.getSale(1);
        let saleStatus = saleData[7];
        assert.equal(saleStatus, 1);

        // verify that SALE_ENDED event is emitted. enum value is 2
        truffleAssert.eventEmitted(
            endSaleTxResult, 'NftSaleEvent', (ev) => {
                return ev.saleId == 1 && ev.eventType == 2
            });

        // verify that NFT_CLAIMED event is emitted. enum value is 3
        truffleAssert.eventEmitted(
            endSaleTxResult, 'NftSaleEvent', (ev) => {
                return ev.saleId == 1 && ev.eventType == 3
            });

        sellerNftBalance = await musicNftInstance.balanceOf(nftSeller);
        assert.equal(sellerNftBalance.valueOf(), 1);
    });

    it("Successfully call claimNft when bids exist", async () => {

        let highestBidderNftBalance = await musicNftInstance.balanceOf(bidder1);
        assert.equal(highestBidderNftBalance.valueOf(), 0);

        // to ensure that the sale has indeed timed out 
        let endSaleTxResult = await marketPlaceInstance.claimNft(2, { from: bidder1 });

        // status of sale should change to SALE_ENDED. Here we are directly comparing the enum value
        let saleData = await marketPlaceInstance.getSale(2);
        let saleStatus = saleData[7];
        assert.equal(saleStatus, 1);

        // verify that SALE_ENDED event is emitted. enum value is 2
        truffleAssert.eventEmitted(
            endSaleTxResult, 'NftSaleEvent', (ev) => {
                return ev.saleId == 2 && ev.eventType == 2
            });

        // verify that NFT_CLAIMED event is emitted. enum value is 3
        truffleAssert.eventEmitted(
            endSaleTxResult, 'NftSaleEvent', (ev) => {
                return ev.saleId == 2 && ev.eventType == 3
            });

        highestBidderNftBalance = await musicNftInstance.balanceOf(bidder1);
        assert.equal(highestBidderNftBalance.valueOf(), 1);
    });
});