import hre from "hardhat";
import { expect } from "chai";
import type { PublicCafeDonation } from "../../types/ethers-contracts/PublicCafeDonation.js";
import type { Signer } from "ethers";

const { ethers} = await hre.network.connect();

describe("PublicCafeDonation - Unit Test", function () {
  let contract: PublicCafeDonation;
  let owner: Signer;
  let signer1: Signer;
  let signer2: Signer;
  let donor: Signer;

  before(async function () {
    const accounts = await ethers.getSigners();

    owner = accounts[0];
    signer1 = accounts[1];
    signer2 = accounts[2];
    donor = accounts[3];

    const factory = await ethers.getContractFactory("PublicCafeDonation");
    contract = await factory.deploy([
      await signer1.getAddress(),
      await signer2.getAddress(),
    ]);

    await contract.waitForDeployment();
  });

  it("Should accept donations", async function () {
    await contract.connect(donor).donate({
      value: ethers.parseEther("2.0"), // ✅ enough funds for withdrawal rule
    });

    const balance = await contract.getContractBalance();
    expect(balance).to.be.gt(0n);
  });

  it("Should create withdrawal request", async function () {
    await contract
      .connect(owner)
      .createRequest(ethers.parseEther("0.1"), "Buy Coffee");

    const count = await contract.requestCount();
    expect(count).to.equal(1n);
  });

  it("Should approve and execute request", async function () {
    const requestId = 0n;

    await contract.connect(signer1).approveRequest(requestId);
    await contract.connect(signer2).approveRequest(requestId);

    const req = await contract.getRequest(requestId);

    expect(req.executed).to.equal(true);
  });

  it("Should lock after withdrawal", async function () {
    expect(await contract.needsReceipt()).to.equal(true);
  });

  it("Should upload receipt and unlock", async function () {
    const id = await contract.pendingReceiptRequestId();

    await contract
      .connect(owner)
      .uploadReceipt(id, "ipfs://receipt-hash");

    expect(await contract.needsReceipt()).to.equal(false);
  });
});