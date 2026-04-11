import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { abi } from "../contract/abi";
import { CONTRACT_ADDRESS } from "../contract/config";
import { useWallet } from "../hooks/useWallet";
import { notifications } from "@mantine/notifications"; 
import { PinataSDK } from "pinata";
import { 
  IconX, IconUsers, IconPlus, IconLock, IconGavel, 
  IconReceipt, IconExternalLink, IconCheck 
} from "@tabler/icons-react"; 

import {
  Container, Title, Text, Button, TextInput, FileInput, Card, 
  Stack, Group, Box, Badge, Table, Divider, ScrollArea, Anchor
} from "@mantine/core";
import { useNavigate } from "react-router-dom";

export default function Withdraw() {
  const { account, connectWallet, isManager, isSigner } = useWallet();
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [contractBalance, setContractBalance] = useState("0");
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // ✅ Accounting Lock States
  const [isLocked, setIsLocked] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) return;
      const provider = new ethers.BrowserProvider(ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
      
      // ✅ Fetch Lock Status from Contract
      const locked = await contract.needsReceipt();
      const pId = await contract.pendingReceiptRequestId();
      setIsLocked(locked);
      setPendingId(Number(pId));

      const balanceWei = await contract.getContractBalance();
      setContractBalance(ethers.formatEther(balanceWei));

      const count = await contract.requestCount();
      const items = [];
      for (let i = 0; i < Number(count); i++) {
        const r = await contract.getRequest(i);
        items.push({
          id: i,
          amount: ethers.formatEther(r[0]),
          recipient: r[1],
          reason: r[2],
          approvals: r[3].toString(),
          executed: r[4],
          receipt: r[5] 
        });
      }
      setRequests(items.reverse());
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    if (account) fetchData();
  }, [account]);

  const handleCreateRequest = async () => {
    if (!amount || !reason) {
      notifications.show({ title: "Required", message: "Enter amount and reason", color: "orange" });
      return;
    }
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const tx = await contract.createRequest(ethers.parseEther(amount), reason);
      const id = notifications.show({ loading: true, title: "Creating Request", message: "Confirming...", autoClose: false });
      
      await tx.wait();
      notifications.update({ id, color: "teal", title: "Created!", message: "Proposal is now live", icon: <IconPlus />, loading: false, autoClose: 4000 });
      
      setAmount(""); setReason("");
      fetchData();
    } catch (error: any) {
      notifications.show({ title: "Error", message: "Check if you have a pending receipt", color: "red", icon: <IconX /> });
    } finally { setLoading(false); }
  };

    const handleUploadReceipt = async () => {
  if (!selectedFile) {
    notifications.show({ message: "Please select an image file", color: "orange" });
    return;
  }

  setLoading(true);

  try {
    const formData = new FormData();
    formData.append("file", selectedFile);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
      },
      body: formData,
    });

    const data = await res.json();

    // ✅ FIXED LINK
    const ipfsLink = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;

    // 🔗 Send to smart contract
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

    const tx = await contract.uploadReceipt(pendingId, ipfsLink);

    const id = notifications.show({
      loading: true,
      title: "Saving Receipt",
      message: "Waiting for blockchain confirmation...",
      autoClose: false,
    });

    await tx.wait();

    notifications.update({
      id,
      color: "green",
      title: "Success",
      message: "Receipt uploaded & contract unlocked",
      loading: false,
    });

    setSelectedFile(null);
    fetchData();

  } catch (error) {
    console.error(error);
    notifications.show({
      title: "Upload Failed",
      message: "Something went wrong",
      color: "red",
    });
  } finally {
    setLoading(false);
  }
};


  return (
    <Box pb={80}>
      <Box px="md" py="sm" style={{ borderBottom: "1px solid #eee", background: "white" }}>
        <Group justify="space-between">
          <Title order={3}>💼 Cafe Management Portal</Title>
          {!account ? (
            <Button size="sm" onClick={connectWallet}>Connect Wallet</Button>
          ) : (
            <Group>
               {isManager && <Badge color="gold" variant="filled">Manager</Badge>}
               {isSigner && <Badge color="grape" variant="filled">Signer</Badge>}
               <Badge color="blue" size="lg" variant="light">{account.slice(0, 6)}...{account.slice(-4)}</Badge>
            </Group>
          )}
        </Group>
      </Box>

      <Container size="md" py={60}>
        <Group grow align="start" mb={40}>
          <Card shadow="md" p="xl" radius="lg" withBorder>
            {isManager ? (
              isLocked ? (
                <Stack>
                  <Group justify="space-between">
                    <Title order={4} c="red"><IconReceipt size={20} /> Receipt Required</Title>
                    <Badge color="red">Locked</Badge>
                  </Group>
                  <Text size="sm">You withdrew funds for Request <b>#{pendingId}</b>. Please upload the receipt image to unlock.</Text>
                  
                  <FileInput 
                    label="Select Receipt Image" 
                    placeholder="Click to browse (JPG/PNG)" 
                    accept="image/*"
                    value={selectedFile}
                    onChange={setSelectedFile}
                    required
                  />
                  
                  <Button onClick={handleUploadReceipt} loading={loading} fullWidth color="orange" mt="md" disabled={!selectedFile}>
                    Upload to IPFS & Unlock
                  </Button>
                </Stack>
              ) : (
                <Stack>
                  <Title order={4}><IconPlus size={20} /> Propose Withdrawal</Title>
                  <Text size="sm" c="dimmed">Create a new request for the Signers to review.</Text>
                  
                  <TextInput label="Amount (ETH)" placeholder="0.5" value={amount} onChange={(e)=>setAmount(e.target.value)} />
                  <TextInput label="Reason" placeholder="Buying Supplies" value={reason} onChange={(e)=>setReason(e.target.value)} />
                  
                  <Button onClick={handleCreateRequest} loading={loading} fullWidth color="blue" mt="md">
                    Create Proposal
                  </Button>
                </Stack>
              )
            ) : isSigner ? (
              <Stack align="center" py="xl">
                <IconGavel size={40} color="grape" />
                <Text fw={700}>Signer Mode Active</Text>
                <Text size="sm" c="dimmed" ta="center">Signers review and vote on the Signer Panel.</Text>
                <Button variant="light" color="grape" onClick={() => navigate("/signer")}>Go to Signer Panel</Button>
              </Stack>
            ) : (
              <Stack align="center" py="xl">
                <IconLock size={40} color="gray" />
                <Text fw={700}>Access Restricted</Text>
                <Text size="sm" c="dimmed" ta="center">Only the Cafe Manager can create withdrawal proposals.</Text>
              </Stack>
            )}
          </Card>

          <Card shadow="md" p="xl" radius="lg" withBorder style={{flex: 0.4}}>
            <Stack align="center" gap={4}>
              <Text size="xs" fw={700} c="dimmed">CURRENT CAFE FUNDS</Text>
              <Title order={1} c="blue">{contractBalance} ETH</Title>
              <Divider my="sm" w="100%" />
              <Stack gap={4} w="100%">
                <Text size="xs" c="dimmed">• Rule: Keep 1 ETH Reserve</Text>
                <Text size="xs" c="dimmed">• Rule: 3-Day Cooldown</Text>
                <Text size="xs" c={isLocked ? "red" : "dimmed"} fw={isLocked ? 700 : 400}>
                  • {isLocked ? "⚠️ Missing Receipt Found" : "✅ All Receipts Cleared"}
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Group>

        <Title order={3} mb="md"><IconUsers size={24} style={{verticalAlign: 'bottom', marginRight: 8}}/> Recent Proposals</Title>
        <Card shadow="sm" radius="md" withBorder p={0}>
          <ScrollArea>
            <Table verticalSpacing="md" horizontalSpacing="lg">
              <Table.Thead bg="gray.0">
                <Table.Tr>
                  <Table.Th>Reason</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Proof (IPFS)</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {requests.map((req) => (
                  <Table.Tr key={req.id}>
                    <Table.Td><Text fw={600}>{req.reason}</Text></Table.Td>
                    <Table.Td><Text c="blue" fw={700}>{req.amount} ETH</Text></Table.Td>
                    <Table.Td>
                      {req.executed ? <Badge color="teal" variant="filled">Paid</Badge> : <Badge color="orange">Pending</Badge>}
                    </Table.Td>
                    <Table.Td>
                      {req.receipt ? (
                        <Anchor href={req.receipt} target="_blank" size="xs">
                          View Receipt <IconExternalLink size={12} />
                        </Anchor>
                      ) : (
                        <Text size="xs" c="dimmed">{req.executed ? "Receipt Pending" : "In Voting"}</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {isSigner && !req.executed ? (
                         <Button size="xs" color="grape" variant="subtle" onClick={() => navigate("/signer")}>Vote in Panel</Button>
                      ) : (
                         <Text size="xs" c="dimmed">#ID-{req.id}</Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {requests.length === 0 && (
              <Text ta="center" py={40} c="dimmed">No active proposals found.</Text>
            )}
          </ScrollArea>
        </Card>
      </Container>
    </Box>
  );
}
