import { useState } from "react";
import { ethers } from "ethers";
import { abi } from "../contract/abi";
import { CONTRACT_ADDRESS } from "../contract/config";
import { useWallet } from "../hooks/useWallet";
import { notifications } from "@mantine/notifications"; 
import { IconHeart, IconCheck, IconX , IconCoffee} from "@tabler/icons-react"; 

import {
  Container,
  Title,
  Text,
  Button,
  TextInput,
  Card,
  Stack,
  Group,
  Box,
  Badge,
  Image,
  SimpleGrid, 
  ThemeIcon
} from "@mantine/core";


export default function Donate() {
  const { account, connectWallet } = useWallet();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const donate = async () => {
    const ethereum = (window as any).ethereum;

    if (!ethereum) {
      notifications.show({
        title: "Wallet Required",
        message: "Please install MetaMask to continue",
        color: "red",
        icon: <IconX size={18} />,
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      notifications.show({
        message: "Please enter a valid amount of ETH",
        color: "orange",
      });
      return;
    }

    setLoading(true);

    
    const notificationId = "donation-tx";

    notifications.show({
      id: notificationId,
      loading: true,
      title: "Sending Donation",
      message: "Confirm the transaction in MetaMask...",
      autoClose: false,
      withCloseButton: false,
    });

    try {
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const tx = await contract.donate({
        value: ethers.parseEther(amount),
      });

      // 2. Update same notification while waiting for block confirmation
      notifications.update({
        id: notificationId,
        loading: true,
        title: "Confirming",
        message: "Transaction sent! Waiting for blockchain confirmation...",
        autoClose: false,
      });

      await tx.wait();

      
      notifications.update({
        id: notificationId,
        color: "teal",
        title: "Success!",
        message: `Thank you! Your donation of ${amount} ETH was successful.`,
        icon: <IconCheck size={18} />,
        loading: false,
        autoClose: 5000,
      });

      setAmount("");
    } catch (error: any) {
      console.error(error);
      
     
      notifications.update({
        id: notificationId,
        color: "red",
        title: "Transaction Failed",
        message: error.reason || "The donation could not be completed.",
        icon: <IconX size={18} />,
        loading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
    
<Box
  px="md"
  py="sm"
  style={{
    borderBottom: "1px solid #eee",
    position: "sticky",
    top: 0,
    background: "white",
    zIndex: 10,
  }}
>
  <Group justify="space-between">
    
    <Group gap="xs">
      <Image 
        src="/publicCafelogo.png" 
        alt="Public Café Logo" 
        h={100} 
        w="auto" 
      />
      <Title order={3}>Public Café</Title>
    </Group>

    {!account ? (
      <Button size="sm" onClick={connectWallet}>
        Connect Wallet
      </Button>
    ) : (
      <Badge color="blue" size="lg" variant="light">
        {account.slice(0, 6)}...{account.slice(-4)}
      </Badge>
    )}
  </Group>
</Box>


    
      <Container size="md" py={80}>
        <Stack align="center" gap="md">
          <Title order={1} ta="center">
            Feed. Connect. Empower.
          </Title>

          <Text ta="center" size="lg" c="dimmed">
            Give to those in need, not out of abundance, but out of compassion.
          </Text>

          <Text ta="center">
            A simple act of kindness can become someone’s turning point.
          </Text>

          {!account && (
            <Button size="md" onClick={connectWallet} color="blue">
              Start Helping
            </Button>
          )}
        </Stack>
      </Container>

      {/* 💳 DONATION SECTION */}
      <Container size="sm" pb={60}>
        <Card shadow="xl" padding="xl" radius="lg" withBorder>
          <Stack>
            <Title order={3}>Make a Donation</Title>

            <Text c="dimmed" size="sm">
              Even a small contribution can make a big impact.
            </Text>

            <TextInput
              placeholder="Amount in ETH"
              value={amount}
              onChange={(e) => setAmount(e.currentTarget.value)}
              disabled={!account || loading}
            />

            <Button
              onClick={donate}
              loading={loading}
              disabled={!account}
              fullWidth
              size="md"
              leftSection={!loading && <IconHeart size={18} />}
            >
              Donate Now
            </Button>
          </Stack>
        </Card>
      </Container>

      {/* ❤️ WHY IT MATTERS */}
     <Container size="md" py={100}>
        <Stack gap={80}>
          
          {/* Why It Matters & Mission in a Grid */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={40}>
            <Card padding="xl" radius="lg" withBorder style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
              <ThemeIcon variant="light" size={50} radius="md" color="red" mb="md">
                <IconHeart size={30} />
              </ThemeIcon>
              <Title order={2} mb="sm">Why it matters</Title>
              <Text c="dimmed" lh={1.6}>
                There are people around us who go unseen. Not because they lack potential, 
                but because they lack opportunity. Your donation provides a warm space 
                and a new beginning.
              </Text>
            </Card>

            <Card padding="xl" radius="lg" withBorder>
              <ThemeIcon variant="light" size={50} radius="md" color="orange" mb="md">
                <IconCoffee size={30} />
              </ThemeIcon>
              <Title order={2} mb="sm">Our Mission</Title>
              <Text c="dimmed" lh={1.6}>
                To create spaces where anyone can sit, think, work, and feel human again. 
                A cup of coffee. A connection to the world. A moment of peace.
              </Text>
            </Card>
          </SimpleGrid>

          {/* Trust Banner */}
          <Card radius="lg" p={40} bg="blue.0" style={{ border: '1px dashed var(--mantine-color-blue-4)' }}>
            <Group justify="space-between" align="center">
              <Stack gap={4}>
                <Title order={2} c="blue.9">Built on Trust</Title>
                <Text size="lg" c="blue.7">
                  Every transaction is transparent and verifiable on the blockchain.
                </Text>
              </Stack>
              <Badge size="xl" variant="filled" color="blue" py={20}>
                No Middlemen. Direct Impact.
              </Badge>
            </Group>
          </Card>

          {/* Final CTA Section */}
          <Stack align="center" py={40} gap="xl">
            <Box style={{ textAlign: 'center' }}>
              <Title order={1} size={42} fw={900}>Start with one small act</Title>
              <Text c="dimmed" size="xl" mt="md">
                Connect your wallet. Make a contribution. Change a life.
              </Text>
            </Box>

            {!account && (
              <Button size="xl" radius="xl" onClick={connectWallet} px={40} 
                style={{ boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                Connect Wallet
              </Button>
            )}
          </Stack>
        </Stack>
      </Container>

      {/* 🔻 FOOTER */}
      <Box py="xl" mt={100} style={{ borderTop: "1px solid #eee", background: '#f9f9f9' }}>
        <Container size="md">
          <Group justify="space-between">
            <Group gap="xs">
              <Image src="/publicCafelogo.png" h={30} w="auto" style={{ filter: 'grayscale(1)' }} />
              <Text fw={700} c="dimmed">Public Café</Text>
            </Group>
            <Text ta="center" size="sm" c="dimmed">
              © {new Date().getFullYear()} — Powered by community
            </Text>
          </Group>
        </Container>
    </Box>
    </Box> 
  );
}