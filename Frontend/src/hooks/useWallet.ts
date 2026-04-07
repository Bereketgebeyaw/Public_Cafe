import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { abi } from "../contract/abi";
import { CONTRACT_ADDRESS } from "../contract/config";

export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [isSigner, setIsSigner] = useState(false);

  // 🔹 Check Permissions (Owner vs Signer)
 // Inside useWallet.ts
// ... existing connection code ...

const checkPermissions = async (userAddress: string) => {
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

  const owner = await contract.owner();
  const isManager = userAddress.toLowerCase() === owner.toLowerCase();

  // Check if they are a signer (but NOT the manager)
  const isAuthorized = await contract.isAuthorizedToPropose(userAddress);
  const isSigner = isAuthorized && !isManager; 

  setIsManager(isManager);
  setIsSigner(isSigner);
};


  useEffect(() => {
    const checkConnection = async () => {
      const ethereum = (window as any).ethereum;
      if (!ethereum) return;

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length > 0) {
        const userAddr = accounts[0];
        setAccount(userAddr);
        await checkPermissions(userAddr);
      }
    };

    checkConnection();

    // Listen for account changes
    (window as any).ethereum?.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        checkPermissions(accounts[0]);
      } else {
        setAccount(null);
        setIsManager(false);
        setIsSigner(false);
      }
    });
  }, []);

  const connectWallet = async () => {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        alert("Please install MetaMask");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      await checkPermissions(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };

  return {
    account,
    connectWallet,
    isManager, // Can propose (Owner)
    isSigner,  // Can approve/deny (Signers)
    isAuthorized: isManager || isSigner // Can do both
  };
}
