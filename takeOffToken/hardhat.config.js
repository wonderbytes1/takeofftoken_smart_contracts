require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomiclabs/hardhat-ethers");
require("solidity-coverage");
module.exports = {
 // defaultNetwork: "hardhat",


  networks: {
    hardhat: {
      forking: {
        allowUnlimitedContractSize: true,
        //url: "you need paste your API URL of alchemy or any other service provider.",
        url: "https://eth-mainnet.g.alchemy.com/v2/t2eRIIhmHv53mQLExlAEGDiF5AW2V4PG"
      }
    }
  },

  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
}