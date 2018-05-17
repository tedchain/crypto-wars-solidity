# Crypto Wars
This repository holds all the smart contracts that are going to be used on the game Crypto Wars
Please check the [documentation](https://github.com/tedmorning/crypto-wars-solidity.git) for more details.

About the game
----------------
A portal just opened up and a medieval army emerged to shatter your world to almost nothing. Now it’s in your hands to rebuild your civilization - a new chance to reclaim what’s yours. Travel from realm to realm and rise from the ashes.

## Requirements

- [geth](https://github.com/ethereum/go-ethereum/wiki/Building-Ethereum)
- [metamask](https://metamask.io), [mist](https://github.com/ethereum/mist/releases) or similar web3 alternative.


## Installation

1. Install truffle and an ethereum client. For local development, try EthereumJS TestRPC.
    ```shell
    npm install -g truffle
    npm install -g ethereumjs-testrpc # or ganache-cli
    truffle version
    # Truffle v4.1.7 (core: 4.1.7)
    # Solidity v0.4.23 (solc-js)
    ```

2. Install dependencies.
    ```shell
    npm i # or yarn
    ```

3. Compile the contracts.
    ```shell
    truffle compile
    ```

4. Run the tests.
    ```shell
    npm run test
    ```

5. Compile the docs.
    ```shell
    npm run doxity init
    npm run docs
    ```

6. Run test coverage.
    ```shell
    npm run coverage
    ```

7. Run local testrpc.
    ```shell
    npm run rpc
    ```

8. Migrate the contracts.
    ```shell
    truffle migrate
    ```

9a. Run the web app locally.
  ```shell
  npm run start # to use your local RPC network
  # Open http://localhost:4200 on your favorite web3 browser
  # Remember to switch your network on Metamask to localhost 8545
  ```

9b. To run the web app with the PoA e11 (311) network.

  - Console 1:
  ```shell
  ./script/full-node.sh # this will create a local full node of the e11 Proof of Authority chain (311)
  ```

  - Console 2:
  ```shell
  npm run start:poa # this will start the angular server with the PoA environment.
  # Remember to switch your network on Metamask to http://localhost:8311
  ```

  Lastly open http://localhost:4200 and on Metamask connect to http://localhost:8311


## How to migrate new contracts into e11 (311) PoA network

  - `./scripts/full-node.sh` # Console 1

  - `geth attach http://localhost:8311` # Console 2
    - `personal.importRawKey("secret","password")`
    - `personal.unlockAccount("0xAddress", "password", 0)`

  - `truffle migrate --network=e11` # Console 3

  - Update contract addresses on `scripts/contracts.json`

  - Copy `build/contracts` folder and paste it on `src/assets/contracts`

## How to send e11 and ether to contributors

  - Duplicate the file `src/script/contributors.sample.json` and name it `contributors.json`
    - Add all the accounts you want to send to
    - Set the amount of ether and e11 you want to send

  - `./scripts/full-node.sh` # Console 1

  - `geth attach http://localhost:8311` # Console 2
    - `personal.importRawKey("secret","password")`
    - `personal.unlockAccount("0xAddress", "password", 0)`

  - `truffle exec ./scripts/send-testnet-tokens.js --network=e11` # Console 3