# ☕ Public Café: Decentralized Donation Platform

A full-stack Web3 application designed to empower communities through transparent fundraising. This project features a robust multi-signature governance model, automated safety rails, and a role-based user interface.

---

## 📂 Project Structure

- **/backend**: Smart contracts built with Solidity and Hardhat. Manages the 2-of-3 multi-sig voting logic and safe fund storage.
- **/frontend**: A responsive React dashboard built with Mantine UI and Ethers.js for donors, managers, and signers.

---

## 🛡️ Smart Contract Governance & Safety

The core contract is engineered with three specific security layers to ensure community trust:

1. **Multi-Sig Consensus (2-of-3)**: Withdrawals must be proposed by the **Manager** and approved by at least **2 out of 3** authorized board members (Signers).
2. **The 1 ETH Reserve Rule**: The contract enforces a permanent safety net by automatically reverting any withdrawal that would leave the café's balance below **1 ETH**.
3. **3-Day Withdrawal Cooldown**: To prevent rapid depletion of funds, a **72-hour wait period** is enforced between successful withdrawals.
4. **On-Chain Transparency**: Every donation, proposal, and vote is recorded on the blockchain for 100% public auditability.

---

## 🛠️ Tech Stack

- **Contracts**: Solidity ^0.8.24, Hardhat Ignition
- **Frontend**: React (Vite), TypeScript, Mantine UI v7
- **Library**: Ethers.js v6
- **Icons**: Tabler Icons

---

## 🚀 Getting Started (Local Testing)

### 1. Setup Backend

1. Navigate to the backend folder: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file:
   ```env
   PRIVATE_KEY=your_private_key_here
   ALCHEMY_API_KEY=your_alchemy_key_here
   ```
4. compile the contract
   ```bash
      npx hardhat compile
   ```
5. Run the local node:
   ```bash
      npx hardhat node
   ```
6. Deploy the contract
   ```bash
      npx hardhat ignition deploy ./ignition/modules/PublicCafeDonation.ts --network localhost
   ```
7. Setup Frontend

   1. Navigate to the frontend folder: cd frontend
   2. Install dependencies: npm install
   3. Update the CONTRACT_ADDRESS in src/contract/config.ts with the address from the deployment step.
      Start the application: npm run dev

x# ☕ Public Café: Decentralized Donation Platform

A full-stack Web3 application designed to empower communities through transparent fundraising. This project features a robust multi-signature governance model, automated safety rails, and a role-based user interface.

---

## 📂 Project Structure

- **/backend**: Smart contracts built with Solidity and Hardhat.
- **/frontend**: React dashboard built with Mantine UI and Ethers.js.

---

## 🛡️ Smart Contract Governance & Safety

1. **Multi-Sig Consensus (2-of-3)**: Withdrawals must be proposed by the **Manager** and approved by at least **2 out of 3** authorized board members.
2. **The 1 ETH Reserve Rule**: Reverts any withdrawal that leaves the balance below **1 ETH**.
3. **3-Day Withdrawal Cooldown**: Enforces a **72-hour wait period** between successful withdrawals.

---

## 🔗 Connecting Frontend & Backend (The ABI)

For the frontend to communicate with the smart contract, you must sync the **ABI**:

1. **Compile the Backend**: In the `/backend` folder, run `npx hardhat compile`.
2. **Locate the ABI**: Find the compiled JSON file at:  
   `backend/artifacts/contracts/PublicCafeDonation.sol/PublicCafeDonation.json`
3. **Sync to Frontend**: Copy the `abi` array from that JSON file and paste it into:  
   `frontend/src/contract/abi.ts`
   ```typescript
   export const abi = [...] // Paste the array here
   ```
