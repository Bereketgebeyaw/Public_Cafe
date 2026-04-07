import hre from "hardhat";

const { ethers } = await hre.network.connect();

async function main() {
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // Use getContractAt for an existing deployment
  const contract = await ethers.getContractAt("PublicCafeDonation", CONTRACT_ADDRESS);

  // Call the Solidity view function
  const balance = await contract.getContractBalance();

  console.log("-----------------------------------------");
  console.log("Contract Address:", CONTRACT_ADDRESS);
  console.log("Contract Balance:", ethers.formatEther(balance), "ETH");
  console.log("-----------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
