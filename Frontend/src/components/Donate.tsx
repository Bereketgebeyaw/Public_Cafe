import { useState } from "react";
import { ethers } from "ethers";
import { abi } from "../contract/abi";
import { CONTRACT_ADDRESS } from "../contract/config";
import { useWallet } from "../hooks/useWallet";
import { notifications } from "@mantine/notifications"; // ✅ Beautiful notifications
import { IconHeart, IconCheck, IconX } from "@tabler/icons-react"; // ✅ Icons

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
  Divider,
  Badge
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

    // 1. Create a notification ID to update it later
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

      // 3. Final success state
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
      
      // 4. Update to error state
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
      {/* 🔝 NAVBAR */}
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
          <Title order={3}>☕ Public Café</Title>

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

      {/* 🌟 HERO SECTION */}
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
      <Container size="md" py={60}>
        <Stack align="center">
          <Title order={2}>Why it matters</Title>

          <Text ta="center" c="dimmed">
            There are people around us who go unseen and unsupported.
            Not because they lack potential — but because they lack opportunity.
          </Text>

          <Text ta="center">
            One donation can provide a warm space, a connection, and a new beginning.
          </Text>
        </Stack>
      </Container>

      <Divider />

      {/* ☕ MISSION */}
      <Container size="md" py={60}>
        <Stack align="center">
          <Title order={2}>Our Mission</Title>

          <Text ta="center" c="dimmed">
            To create spaces where anyone can sit, think, work, and feel human again.
          </Text>

          <Text ta="center">
            A cup of coffee. A connection to the world. A moment of peace.
          </Text>
        </Stack>
      </Container>

      <Divider />

      {/* 🔐 TRUST */}
      <Container size="md" py={60}>
        <Stack align="center">
          <Title order={2}>Built on Trust</Title>

          <Text ta="center" c="dimmed">
            Every transaction is transparent and verifiable on the blockchain.
          </Text>

          <Text ta="center">
            No middlemen. Just direct impact.
          </Text>
        </Stack>
      </Container>

      {/* 🚀 CTA */}
      <Container size="md" py={80}>
        <Stack align="center">
          <Title order={2}>Start with one small act</Title>

          <Text ta="center" c="dimmed">
            Connect your wallet. Make a contribution. Change a life.
          </Text>

          {!account && (
            <Button size="md" onClick={connectWallet}>
              Connect Wallet
            </Button>
          )}
        </Stack>
      </Container>

      {/* 🔻 FOOTER */}
      <Box py="lg" style={{ borderTop: "1px solid #eee" }}>
        <Text ta="center" size="sm" c="dimmed">
          © {new Date().getFullYear()} Public Café — Powered by community
        </Text>
      </Box>
    </Box>
  );
}
