const hre = require("hardhat");

async function main() {
  const Token = await hre.ethers.getContractFactory("TESTTOKEN.sol");
  const token = await Token.deploy();

  await token.deployed();

  console.log("Token contract deployed to:", token.address);
}

const runMain = async () => {
  try{
    await main();
    process.exit(0);
  }catch(error){
    console.error(error);
    process.exit(1);
  }
}
runMain();
