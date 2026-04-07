import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { abi } from "../contract/abi";
import { CONTRACT_ADDRESS } from "../contract/config";
import { useWallet } from "../hooks/useWallet";
import { notifications } from "@mantine/notifications"; 
import {  IconX, IconUsers, IconPlus, IconLock, IconGavel } from "@tabler/icons-react"; 

import {
  Container, Title, Text, Button, TextInput, Card, Stack, Group, Box, Badge, Table, Divider, ScrollArea
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

  const fetchData = async () => {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) return;
      const provider = new ethers.BrowserProvider(ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
      
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
          executed: r[4]
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
      notifications.update({ id, color: "teal", title: "Created!", message: "Proposal is now live for voting", icon: <IconPlus />, loading: false, autoClose: 4000 });
      
      setAmount(""); setReason("");
      fetchData();
    } catch (error: any) {
      notifications.show({ title: "Error", message: "Only Manager can propose", color: "red", icon: <IconX /> });
    } finally { setLoading(false); }
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
          {/* LEFT: PROPOSE WITHDRAWAL (MANAGER ONLY) */}
          <Card shadow="md" p="xl" radius="lg" withBorder>
            {isManager ? (
              <Stack>
                <Title order={4}><IconPlus size={20} /> Propose Withdrawal</Title>
                <Text size="sm" c="dimmed">Create a new request for the Signers to review.</Text>
                
                <TextInput label="Amount (ETH)" placeholder="0.5" value={amount} onChange={(e)=>setAmount(e.target.value)} />
                <TextInput label="Reason" placeholder="Buying Supplies" value={reason} onChange={(e)=>setReason(e.target.value)} />
                
                <Button onClick={handleCreateRequest} loading={loading} fullWidth color="blue" mt="md">
                  Create Proposal
                </Button>
              </Stack>
            ) : isSigner ? (
              /* 🛡️ SIGNER VIEW: REDIRECTS TO SIGNER PANEL */
              <Stack align="center" py="xl">
                <IconGavel size={40} color="grape" />
                <Text fw={700}>Signer Mode Active</Text>
                <Text size="sm" c="dimmed" ta="center">You cannot propose withdrawals. Please use the Signer Panel to vote.</Text>
                <Button variant="light" color="grape" onClick={() => navigate("/signer")}>Go to Signer Panel</Button>
              </Stack>
            ) : (
              /* 🔒 REGULAR USER VIEW */
              <Stack align="center" py="xl">
                <IconLock size={40} color="gray" />
                <Text fw={700}>Access Restricted</Text>
                <Text size="sm" c="dimmed" ta="center">Only the Cafe Manager can create withdrawal proposals.</Text>
              </Stack>
            )}
          </Card>

          {/* RIGHT: LIVE BALANCE */}
          <Card shadow="md" p="xl" radius="lg" withBorder style={{flex: 0.4}}>
            <Stack align="center" gap={4}>
              <Text size="xs" fw={700} c="dimmed">CURRENT CAFE FUNDS</Text>
              <Title order={1} c="blue">{contractBalance} ETH</Title>
              <Divider my="sm" w="100%" />
              <Stack gap={4} w="100%">
                <Text size="xs" c="dimmed">• Rule: Keep 1 ETH Reserve</Text>
                <Text size="xs" c="dimmed">• Rule: 3-Day Cooldown</Text>
              </Stack>
            </Stack>
          </Card>
        </Group>

        {/* BOTTOM: PROPOSALS LIST (READ ONLY ON THIS PAGE) */}
        <Title order={3} mb="md"><IconUsers size={24} style={{verticalAlign: 'bottom', marginRight: 8}}/> Recent Proposals</Title>
        <Card shadow="sm" radius="md" withBorder p={0}>
          <ScrollArea>
            <Table verticalSpacing="md" horizontalSpacing="lg">
              <Table.Thead bg="gray.0">
                <Table.Tr>
                  <Table.Th>Reason</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Approvals</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Info</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {requests.map((req) => (
                  <Table.Tr key={req.id}>
                    <Table.Td><Text fw={600}>{req.reason}</Text></Table.Td>
                    <Table.Td><Text c="blue" fw={700}>{req.amount} ETH</Text></Table.Td>
                    <Table.Td><Badge color="gray" variant="outline">{req.approvals} / 2</Badge></Table.Td>
                    <Table.Td>
                      {req.executed ? <Badge color="teal" variant="filled">Paid</Badge> : <Badge color="orange">Pending</Badge>}
                    </Table.Td>
                    <Table.Td>
                      {isSigner && !req.executed ? (
                         <Button size="xs" color="grape" variant="subtle" onClick={() => navigate("/signer")}>Vote in Panel</Button>
                      ) : (
                         <Text size="xs" c="dimmed">Details only</Text>
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
