// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./IERC721.sol";

/// @title An ERC721 token marketplace
/// @author Clyde D'Cruz
/// @notice You can use this contract as an NFT auction marketplace for any ERC721 complaint token.
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
        address highestBidder;
        uint256 highestBid;
        NftSaleStatus status; // Active, Ended
        bool isValid;
    }

    mapping(address => uint256) private pendingRefunds;

    mapping(uint256 => NftSale) private sales;

    /// Given saleId returns the sale if it exists
    function getSale(uint256 saleId) public view returns (NftSale memory) {
        return validateSale(saleId);
    }

    uint256 private saleCounter;

    /// @notice Creates a limited time auction for a specified NFT
    /// @dev The caller must approve transfer of this NFT to this contract address before calling this function
    /// @param listedNftIdentifier The uint256 ID of the NFT that is to be sold
    /// @param minBidPrice The minimum bid pice in ether
    /// @param saleTimePeriod Time in seconds after which this sale will end. Time is considered from current block time
    function createSale(
        uint256 listedNftIdentifier,
        uint256 minBidPrice,
        uint256 saleTimePeriod
    ) public {
        // validate sale end time
        // validate min bid price

        // transfer ownership of NFT to this contract address
        nftTokenContract.transferFrom(
            msg.sender,
            address(this),
            listedNftIdentifier
        );

        // construct sale
        sales[saleCounter] = NftSale(
            msg.sender,
            listedNftIdentifier,
            minBidPrice,
            block.timestamp + saleTimePeriod,
            address(0),
            0,
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
        NftSale memory previousBidData;
        // check if sale is proper
        NftSale memory sale = validateSale(saleId);
        previousBidData = sale;
        // Revert the call if the auction period is over.
        require(block.timestamp <= sale.saleEndTime, "Auction already ended.");

        // check price
        require(
            msg.value > sale.highestBid && msg.value >= sale.minBidPrice,
            "Bid should be higher than min bid price and existing highest bid"
        );

        sale.highestBid = msg.value;
        sale.highestBidder = msg.sender;
        sales[saleId] = sale;

        // refund ether of previous bidder
        if (previousBidData.highestBid > 0) {
            pendingRefunds[previousBidData.highestBidder] = previousBidData
                .highestBid;
        }
        emit NftSaleEvent(saleId, NftSaleEventType.BID_CREATED);
    }

    function claimBidRefund() public {
        uint256 amount = pendingRefunds[msg.sender];
        pendingRefunds[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
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
        // TODO if highest bid is 0, then highestbidder will be the 0 address. The NFT will need to be transferred back to the sale poster.
        nftTokenContract.transferFrom(address(this), msg.sender, sale.item);

        emit NftSaleEvent(saleId, NftSaleEventType.NFT_CLAIMED);
    }

    function endSale(uint256 saleId) public {
        // check if sale is proper
        NftSale memory sale = validateSale(saleId);

        // Sale should be in active state when this call is made
        require(sale.status == NftSaleStatus.ACTIVE, "Sale not active");

        // Revert the call if the auction period is not over.
        require(block.timestamp > sale.saleEndTime, "Auction not yet ended");

        // only sale poster should be allowed to call this
        require(sale.poster == msg.sender, "Caller is not the sale poster");

        // close sale
        sale.status = NftSaleStatus.ENDED;

        sales[saleId] = sale;
        emit NftSaleEvent(saleId, NftSaleEventType.SALE_ENDED);
    }
}
