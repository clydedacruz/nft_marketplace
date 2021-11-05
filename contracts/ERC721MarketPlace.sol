// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./IERC721.sol";

contract ERC721MarketPlace {
    enum NftSaleStatus {
        ACTIVE,
        ENDED
    }
    enum NftSaleEventType {
        SALE_CREATED,
        BID_CREATED,
        SALE_ENDED,
        NFT_CLAIMED
    }

    event NftSaleEvent(uint256 saleId, NftSaleEventType eventType);

    IERC721 nftTokenContract;

    constructor(address _nftContractAddress) {
        nftTokenContract = IERC721(_nftContractAddress);
    }

    struct NftSale {
        address poster;
        uint256 item;
        uint256 minBidPrice;
        uint256 saleEndTime;
        // Current state of the auction.
        address highestBidder;
        uint256 highestBid;
        NftSaleStatus status; // Active, Ended
        bool isValid;
    }

    mapping(uint256 => NftSale) public sales;
    uint256 saleCounter;

    /**
     * Caller must approve transfer of the NFT mentioned in the sale.
     */
    function createSale(
        uint256 listedNftIdentifier,
        uint256 minBidPrice,
        uint256 saleTimePeriod
    ) public {
        // check if nft is valid
        // check if sender is current owner of NFT
        // validate sale end time
        // validate min bid price

        // transfer ownership of NFT to this contract address
        nftTokenContract.transferFrom(
            msg.sender,
            address(this),
            listedNftIdentifier
        );

        // create sale

        sales[saleCounter] = NftSale(
            msg.sender,
            listedNftIdentifier,
            minBidPrice,
            block.timestamp + saleTimePeriod, // this should be some function of blocktime
            address(0),
            minBidPrice,
            NftSaleStatus.ACTIVE,
            true
        );
        saleCounter += 1;

        // emit event for created sale
        emit NftSaleEvent(saleCounter - 1, NftSaleEventType.SALE_CREATED);
    }

    function validateSale(uint256 saleId)
        internal
        view
        returns (NftSale memory)
    {
        NftSale memory sale = sales[saleId];
        require(sale.isValid, "Sale is not valid");
        return sale;
    }

    // Bid for sale
    // ether passed in the transaction istreated as bid value
    function bidForSale(uint256 saleId) public payable {
        // check if sale is proper
        NftSale memory sale = validateSale(saleId);

        // Revert the call if the auction period is over.
        require(block.timestamp <= sale.saleEndTime, "Auction already ended.");

        // check price
        require(
            msg.value > sale.highestBid,
            "Bid should be higher than existing highest bid"
        );

        sale.highestBid = msg.value;
        sale.highestBidder = msg.sender;

        // refund ether of previous bidder

        emit NftSaleEvent(saleId, NftSaleEventType.BID_CREATED);
    }

    ///
    function claimNft(uint256 saleId) public {
        // check if sale is proper
        NftSale memory sale = validateSale(saleId);

        // Revert the call if the auction period is not over.
        require(block.timestamp > sale.saleEndTime, "Auction not yet ended");

        // only highest bidder should be allowed to call this
        require(
            sale.highestBidder == msg.sender,
            "Caller is not the highest bidder"
        );

        // close sale
        sale.status = NftSaleStatus.ENDED;
        emit NftSaleEvent(saleId, NftSaleEventType.SALE_ENDED);

        // transfer Nft to highest bidder
        nftTokenContract.transferFrom(address(this), msg.sender, sale.item);
        emit NftSaleEvent(saleId, NftSaleEventType.NFT_CLAIMED);
    }

    function endSale(uint256 saleId) public {
        // check if sale is proper
        NftSale memory sale = validateSale(saleId);

        // Revert the call if the auction period is not over.
        require(block.timestamp > sale.saleEndTime, "Auction not yet ended");

        // only sale poster should be allowed to call this
        require(sale.poster == msg.sender, "Caller is not the sale poster");

        // close sale
        sale.status = NftSaleStatus.ENDED;
        emit NftSaleEvent(saleId, NftSaleEventType.SALE_ENDED);

        // transfer Nft to highest bidder
        nftTokenContract.transferFrom(
            address(this),
            sale.highestBidder,
            sale.item
        );
        emit NftSaleEvent(saleId, NftSaleEventType.NFT_CLAIMED);
    }
}
