require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomiclabs/hardhat-ethers");
module.exports = {
 // defaultNetwork: "hardhat",


  networks: {
    hardhat: {
      forking: {
        allowUnlimitedContractSize: true,
        //url: "you need paste your API URL of alchemy or any other service provider.",
      }
    }
  },

  solidity: {
    version: "0.8.9",
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