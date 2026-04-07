import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PublicCafeDonationModule", (m) => {
  
  // ✅ Use the PUBLIC ADDRESSES (starts with 0x...)
  // These are the first 3 accounts from the 'npx hardhat node' list
  const signers = [
    "0x70997970c51812dc3a010c7d01b50e0d17dc79c8", // Account #0 (The one you use for connection)
    "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc", // Account #1
    "0x90f79bf6eb2c4f870365e785982e1f101e93b906"  // Account #2
  ];

  // Pass the array inside another array (because it's the 1st constructor argument)
  const contract = m.contract("PublicCafeDonation", [signers]);

  return { contract };
});
