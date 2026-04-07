import hre from "hardhat";

async function main() {

    const { ethers, networkHelpers } = await hre.network.connect();
  // 1️⃣ Get the donor accounts from Hardhat local network
  const [donor1, donor2, donor3] = await ethers.getSigners();

  console.log("Donor addresses:");
  console.log("Donor1:", donor1.address);
  console.log("Donor2:", donor2.address);
  console.log("Donor3:", donor3.address);

  // 2️⃣ Use the deployed contract address directly (no checksum function)
  const cafeAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // 3️⃣ Get the contract factory and attach to deployed contract
  const PublicCafeDonation = await ethers.getContractFactory("PublicCafeDonation");
  const cafe = await PublicCafeDonation.attach(cafeAddress);

  // 4️⃣ Simulate donations
  console.log("\nSending donations...");
  await cafe.connect(donor1).donate({ value: ethers.parseEther("1") });
  console.log("Donor1 donated 1 ETH");

  await cafe.connect(donor2).donate({ value: ethers.parseEther("0.5") });
  console.log("Donor2 donated 0.5 ETH");

  await cafe.connect(donor3).donate({ value: ethers.parseEther("0.2") });
  console.log("Donor3 donated 0.2 ETH");

  // 5️⃣ Print contract balance and individual contributions
  const totalBalance = await cafe.getContractBalance();
  console.log("\n=== Contract Summary ===");
  console.log("Total contract balance:", ethers.formatEther(totalBalance), "ETH");

  const donation1 = await cafe.donations(donor1.address);
  const donation2 = await cafe.donations(donor2.address);
  const donation3 = await cafe.donations(donor3.address);

  console.log("Donor1 contributed:", ethers.formatEther(donation1), "ETH");
  console.log("Donor2 contributed:", ethers.formatEther(donation2), "ETH");
  console.log("Donor3 contributed:", ethers.formatEther(donation3), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in simulation:", error);
    process.exit(1);
  });