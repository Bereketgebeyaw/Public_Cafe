import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.connect();

  const [deployer] = await ethers.getSigners();

  console.log("🚀 Deploying contract with:", deployer.address);

  // ✅ REAL signers (your MetaMask accounts)
  const signers = [
    "0xf338af10aF777d6aA9A2ECf4Fc6629520B7239Fa",
    "0x735252Fc8aA2753c5fa350E99B58b62fF56e96Ad"
  ];

  const factory = await ethers.getContractFactory("PublicCafeDonation");

  const contract = await factory.deploy(signers);

  await contract.waitForDeployment();

  console.log("✅ Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});