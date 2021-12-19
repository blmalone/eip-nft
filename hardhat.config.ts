import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

import { HardhatUserConfig } from "hardhat/types";

import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-etherscan";
import "solidity-coverage";
import "hardhat-abi-exporter";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";

const INFURA_API_KEY = process.env.INFURA_API_KEY;

const MAINNET_PRIV = "";
const RINKEBY_PRIV = ""; 
const ROPSTEN_PRIV = "";
const POLYGON_MNEMONIC = "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

const config: HardhatUserConfig = {
  gasReporter: {
    currency: "USD",
    gasPrice: 105,
    coinmarketcap: "",
  },
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [{ version: "0.8.0", settings: {} }],
  },
  networks: {
    hardhat: {},
    localhost: {},
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [RINKEBY_PRIV]
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [ROPSTEN_PRIV],
    },
    // mainnet: {
    //   url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
    //   accounts: [MAINNET_PRIV],
    // },
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: { mnemonic: POLYGON_MNEMONIC }
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${INFURA_API_KEY}`,
      accounts: { mnemonic: POLYGON_MNEMONIC }
    },
    coverage: {
      url: "http://127.0.0.1:8555", // Coverage launches its own ganache-cli client
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ETHERSCAN_API_KEY,
  },
  abiExporter: {
    path: "./data/abi",
    clear: true,
    flat: true,
    only: [],
    spacing: 2,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
};

export default config;
