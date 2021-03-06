const truffleAssert = require('truffle-assertions');

const MusicNft = artifacts.require("MusicNft");
const ERC721MarketPlace = artifacts.require("ERC721MarketPlace");

contract("Marketplace contract - bid for sale", async accounts => {

    let musicNftInstance, marketPlaceInstance, nftSeller, tokenIdOfSellersNft;

    let bidder1 = accounts[2], bidder2 = accounts[3];

    it("create sale", async () => {
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

    });

    // bid with non-existent sale 
    it("fail to bid on non-existent sale", async () => {
        await truffleAssert.reverts(
            marketPlaceInstance.bidForSale(3, { from: bidder1 }),
            "Sale is not valid"
        );
    });

    // bid with ether less than minimum price
    it("fail to bid on with amount that is less than minimum price", async () => {
        await truffleAssert.reverts(
            marketPlaceInstance.bidForSale(0, { from: bidder1 }),
            "Bid should be higher than min bid price and existing highest bid"
        );
    });
    // sucessful bid
    it("successful bid ", async () => {
        let initialbalance = await web3.eth.getBalance(bidder1);

        let bidAmt = 10000001;
        await marketPlaceInstance.bidForSale(0, { from: bidder1, value: 10000001 });
        // check if highestbidder is changed
        let saleData = await marketPlaceInstance.getSale(0);
        let currentHighestBidder = saleData[4];
        let currentHighestBid = saleData[5];

        let balanceAfterBid = await web3.eth.getBalance(bidder1);

        assert.equal(currentHighestBidder, bidder1);
        assert.equal(currentHighestBid, bidAmt);
    });

    it("fail to bid if price is not higher than previous", async () => {
        await truffleAssert.reverts(
            marketPlaceInstance.bidForSale(0, { from: bidder1, value: 10000001 }),
            "Bid should be higher than min bid price and existing highest bid"
        );
    });

    it("successfull new bid should refund previous highest bidder", async () => {
        let saleData = await marketPlaceInstance.getSale(0);
        let oldHighestBidder = saleData[4];
        let oldHighestBid = saleData[5];

        let initialbalance = await web3.eth.getBalance(oldHighestBidder);

        // bidder 2 executes new bid 
        let newBidAmt = 10000000002;
        await marketPlaceInstance.bidForSale(0, { from: bidder2, value: newBidAmt });

        await marketPlaceInstance.claimBidRefund({ from: bidder1 });

        // check new balance of previous highest bidder
        let balanceAfterOutbid = await web3.eth.getBalance(oldHighestBidder);

        // let expectednewBal = (web3.utils.toBN(initialbalance).add(web3.utils.toBN(oldHighestBid))).toString();
        expect(web3.utils.toBN(balanceAfterOutbid).gt(web3.utils.toBN(initialbalance)));

        let newSaleData = await marketPlaceInstance.getSale(0);
        let newHighestBidder = newSaleData[4];
        let newHighestBid = newSaleData[5];

        assert.equal(newHighestBidder, bidder2);
        assert.equal(newHighestBid, newBidAmt);
    });

    // bid on expired sale 
    it("fail to bid if sale has already expired", async () => {

        // to ensure that the sale has indeed timed out 
        await new Promise(r => setTimeout(r, 2000));

        await truffleAssert.reverts(
            marketPlaceInstance.bidForSale(1, { from: bidder1, value: 10000003 }),
            "Auction already ended"
        );
    });

    // bid on closed sale 
    it("fail to bid if sale has ended", async () => {

        // to ensure that the sale has indeed timed out 
        await marketPlaceInstance.endSale(1, { from: nftSeller });

        await truffleAssert.reverts(
            marketPlaceInstance.bidForSale(1, { from: bidder1, value: 10000003 }),
            "Auction already ended"
        );
    });
});