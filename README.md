# NFT Marketplace Smart Contract 
This project contains an Ethereum smart contract written in Solidity, which can serve as an auction marketplace for any ERC-721 token. 
-  An implementation of an ERC721 from Openzeppelin is included in the codebase for the purpose of testing the marketplace contract 
- Ether is used as currency for bids. 
- All bid amounts are specified in wei.

**Contract source files**    
The following solidity files are included as part of this distribution
- `contracts\ERC721MarketPlace.sol` - The ERC721 market place solidity smart contract. 
- `contracts\IERC721.sol` - ERC721 Interface spec as per https://eips.ethereum.org/EIPS/eip-721 
- `contracts\MusicNFT.sol` - Example ERC721 implementation used for testing and demonstrating functionality of ERC721MarketPlace. 
## 1. Pre-requisites
Dependenecy versions mentioned here are only for guidance. 
These are the versions I used while building this.

- Node v16.13.0
- Ganache 
- Truffle v5.4.17 

## 2. Installation
1. Unzip the given code bundle 
2. install dependencies 
```
cd nft_marketplace
npm install
```

## 3. Compiling contracts 
```
cd nft_marketplace
truffle compile
```

## 4. Run tests 
```
cd nft_marketplace
truffle test 
```
**Expected output**
```
Using network 'test'.


Compiling your contracts...
===========================
> Compiling .\contracts\ERC721MarketPlace.sol
> Compiling .\contracts\ERC721MarketPlace.sol
> Compiling .\contracts\IERC721.sol
> Compiling .\contracts\MusicNFT.sol
> Compiling .\contracts\MusicNFT.sol
> Artifacts written to C:\Users\username\AppData\Local\Temp\test--18204-jhU2JKJWXqg3
> Compiled successfully using:
   - solc: 0.8.9+commit.e5eed63a.Emscripten.clang

0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0


    √ Initial setup - create nfts and sales for test (18245ms)
    √ ClaimNft should fail for invalid sale ID (724ms)
    √ ClaimNft should fail if sale has not yet ended (204ms)
    √ ClaimNft should fail when bids exist,  if caller is not the highest bidder (254ms)
    √ ClaimNft should fail when no bids exist,  if caller is not the sale poster (276ms)
    √ Successfully call claimNft when no bids exist (1452ms)
    √ Successfully call claimNft when bids exist (2380ms)

  Contract: Marketplace contract - bid for sale
    √ create sale (6319ms)
    √ fail to bid on non-existent sale (194ms)
    √ fail to bid on with amount that is less than minimum price (212ms)
    √ successful bid  (2376ms)
    √ fail to bid if price is not higher than previous (363ms)
    √ successfull new bid should refund previous highest bidder (1789ms)
    √ fail to bid if sale has already expired (2298ms)
    √ fail to bid if sale has ended (1879ms)

  Contract: Marketplace contract - Sale creation
    √ create required NFTs (897ms)
    √ fail to create sale if transfer of NFT is not pre-approved to marketplace contract address (256ms)
    √ fail to create sale if token ID in sale creation transaction is incorrect (617ms)
    √ fail to create sale if seller does not own the NFT (191ms)
    √ fail to show sale before it is created (62ms)
    √ successfully create sale (855ms)
    √ succesfully show created sale (78ms)
  Contract: Marketplace contract - end sale
    √ Initial setup - create nfts and sales for test (10172ms)
    √ ClaimNft should fail if sale has not yet ended
    √ Endsale should fail if caller is not the sale poster (193ms)
    √ Successfully call endsale (902ms)
    √ ClaimNft success should close sale and transfer NFT
    √ Endsale should fail if sale has already ended (250ms)
    √ Endsale should fail if required time has not yet elapsed (554ms)


  29 passing (56s)

```

## 5. Run migrations
**1. Start Ganache**    
Truffle will attempt to connect to local ethereum client with following connection parameters. Please make sure Ganache is up and running before you try running the migration command below.
```
 - host       > 127.0.0.1
 - port       > 7545
 - network_id > 5777
```
**2. Run migration**     
```
cd nft_marketplace
truffle migrate 
```
**Expected output**    
```
Starting migrations...
======================
> Network name:    'ganache'
> Network id:      5777
> Block gas limit: 6721975 (0x6691b7)


1_initial_migration.js
======================

   Replacing 'MusicNFT'
   --------------------
   > transaction hash:    0x15fa1a5566bb6d0a22b0dd5def2c01405821501d9d1c904d5fdfa7c0791e5a2f
   > Blocks: 0            Seconds: 0
   > contract address:    0x706fF9a266D18C72F72C2dB46C907B0B4377547f
   > block number:        1
   > block timestamp:     1636266406
   > account:             0x26395fA99cb4666697d13DB76690cB34Fe284D82
   > balance:             99.91170788
   > gas used:            4414606 (0x435c8e)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.08829212 ETH

0x706fF9a266D18C72F72C2dB46C907B0B4377547f

   Replacing 'ERC721MarketPlace'
   -----------------------------
   > transaction hash:    0xdc8539a67458023bcd4dfcaebb2c5779fe29fbec551d1f33557f5e11f430915a
   > Blocks: 0            Seconds: 0
   > contract address:    0x49829A227cA7f2f9F21829080c509D67E41769A6
   > block number:        2
   > block timestamp:     1636266408
   > account:             0x26395fA99cb4666697d13DB76690cB34Fe284D82
   > balance:             99.8809661
   > gas used:            1537089 (0x177441)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.03074178 ETH

   > Saving artifacts
   -------------------------------------
   > Total cost:           0.1190339 ETH


Summary
=======
> Total deployments:   2
> Final cost:          0.1190339 ETH
```


## 6. Additional Notes 
**Patterns used in marketplace contract**    
Withdrawal pattern - This puts the onus of dev=livery (and expense of gas) on the recipient of the asset. Hence in our contract the beneficairy needs to call a `claimBidRefund` or `claimNft` function to claim assets that are due to them. They are not directly sent to the beneficairy as part of some other transaction. 

Checks-effects-Interaction - This pattern is used in the contract for ensuring no re-entrancy vulnerabilities exist. 

**Contract documentation**    
The ERC721 marketplace contract has been documented with NATSPEC style comments as per the specificiations in Solidity docs 
https://docs.soliditylang.org/en/develop/natspec-format.html

**Code structure**  
The style guide mentioned in solidity doc has been adhered to for code structure, naming and documentation. 

https://docs.soliditylang.org/en/v0.8.9/style-guide.html


**2. Warnings seen during compilation**    
During compilation you may see a warning that duplicate contract names are found like below 
```
> Duplicate contract names found for ERC165.
> This can cause errors and unknown behavior. Please rename one of your contracts.

> Duplicate contract names found for IERC721.
> This can cause errors and unknown behavior. Please rename one of your contracts.
```

This is because the IERC721 interface spec included in this bundle has the same names as that used in Openzeppelin (which exists as a dependency) codebase. This presently does not cause any issues, but they can be renamed in our contract as a future step, OR we can directly use the available interface specs from Openzeppelin. 

