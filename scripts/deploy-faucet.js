import hre from "hardhat";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import dotenv from "dotenv";

dotenv.config();

// OEC Token address on Sepolia
const OEC_TOKEN = "0x2b2fb8df4ac5d394f0d5674d7a54802e42a06aba";

async function main() {
  const networkName = hre.network.name;
  console.log("Deploying OECFaucet to", networkName, "...");
  console.log("Token address:", OEC_TOKEN);

  // Get the contract artifact
  const artifact = await hre.artifacts.readArtifact("OECFaucet");

  // Create account from private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not set in .env");
  }

  const account = privateKeyToAccount(`0x${privateKey}`);
  console.log("Deploying from:", account.address);

  // Create clients
  const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpcUrl),
  });

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Account balance:", Number(balance) / 1e18, "ETH");

  if (balance === 0n) {
    throw new Error("Account has no ETH for gas. Get Sepolia ETH from a faucet.");
  }

  // Deploy the contract with OEC_TOKEN as constructor argument
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: [OEC_TOKEN],
  });

  console.log("Transaction hash:", hash);
  console.log("Waiting for confirmation...");

  // Wait for deployment
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.log("\n✓ OECFaucet deployed to:", receipt.contractAddress);
  console.log("\nNext steps:");
  console.log("1. Update FAUCET_CONTRACT in client/src/pages/faucet.tsx");
  console.log("2. Send OEC tokens to the faucet contract:", receipt.contractAddress);
  console.log("3. Export the ABI to client/src/services/abis/OECFaucet.json");

  return receipt.contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error.message || error);
    process.exit(1);
  });
