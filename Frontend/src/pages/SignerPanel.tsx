import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { abi } from "../contract/abi";
import { CONTRACT_ADDRESS } from "../contract/config";
import { useWallet } from "../hooks/useWallet";
import { notifications } from "@mantine/notifications";
import { IconAlertTriangle, IconGavel } from "@tabler/icons-react";
import { Container, Title, Table, Button, Badge, Card, Group, Text, Stack, Box } from "@mantine/core";

export default function SignerPanel() {
  const { account, isSigner, isManager } = useWallet();
  const [requests, setRequests] = useState<any[]>([]);

  const fetchRequests = async () => {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
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
    fetchRequests();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      const tx = await contract.approveRequest(id);
      
      notifications.show({ title: "Voting", message: "Sending your approval...", loading: true });
      await tx.wait();
      
      notifications.clean();
      notifications.show({ title: "Approved", message: "Vote counted!", color: "green" });
      fetchRequests();
    } catch (error: any) {
      notifications.show({ title: "Voting Failed", message: "Check if you already voted or if rules prevent execution.", color: "red" });
    }
  };

  const handleDeny = async (id: number) => {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      const tx = await contract.denyRequest(id);
      
      notifications.show({ title: "Processing", message: "Cancelling request...", loading: true });
      await tx.wait();
      
      notifications.clean();
      notifications.show({ title: "Denied", message: "Request has been closed.", color: "red" });
      fetchRequests();
    } catch (error) {
      notifications.show({ title: "Error", message: "Only signers can deny requests.", color: "red" });
    }
  };

  return (
    <Container size="md" py={40}>
      <Group justify="space-between" mb="xl">
        <Title order={2}><IconGavel style={{ marginRight: 8 }} /> Signer Decision Center</Title>
        <Group>
          {isManager && <Badge color="gold">Manager View</Badge>}
          {isSigner && <Badge color="grape">Active Signer</Badge>}
        </Group>
      </Group>

      <Card withBorder radius="md" p={0}>
        <Table verticalSpacing="md" horizontalSpacing="lg">
          <Table.Thead bg="gray.0">
            <Table.Tr>
              <Table.Th w={80}>ID</Table.Th>
              <Table.Th>Reason</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
              <Table.Th>Receipt</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {requests.map((req) => (
              <Table.Tr key={req.id}>
                <Table.Td>#{req.id}</Table.Td>
                <Table.Td><Text fw={500}>{req.reason}</Text></Table.Td>
                <Table.Td><Text c="blue" fw={700}>{req.amount} ETH</Text></Table.Td>
                <Table.Td>
                  {req.executed ? (
                    <Badge color="gray" variant="light">Closed / Executed</Badge>
                  ) : (
                    <Badge color="blue" variant="filled">{req.approvals} / 2 Approved</Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  {!req.executed && (
                    isSigner ? (
                      <Group gap="xs">
                        <Button color="green" size="xs" onClick={() => handleApprove(req.id)}>Approve</Button>
                        <Button color="red" variant="outline" size="xs" onClick={() => handleDeny(req.id)}>Deny</Button>
                      </Group>
                    ) : (
                      <Text size="xs" c="dimmed" fs="italic">Read Only (Signers Only)</Text>

                    )
                  )}
                </Table.Td>
                <Table.Td>
             {req.receipt ? (
             <a href={req.receipt} target="_blank" rel="noopener noreferrer">
             <Button size="xs" variant="light">
               View Receipt
             </Button>
           </a>
      ) : req.executed ? (
    <Text size="xs" c="orange">
      Waiting for receipt
    </Text>
  ) : (
    <Text size="xs" c="dimmed">
      Not available
    </Text>
  )}
</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {!isSigner && account && (
          <Box p="md" bg="orange.0">
            <Group gap="xs">
              <IconAlertTriangle size={18} color="orange" />
              <Text size="sm" c="orange.9" fw={500}>
                Your wallet is connected but you are not an authorized Board Member. You cannot vote.
              </Text>
            </Group>
          </Box>
        )}

        {requests.length === 0 && (
          <Stack align="center" py={60}>
            <Text c="dimmed">No withdrawal requests found.</Text>
          </Stack>
        )}
      </Card>
    </Container>
  );
}
