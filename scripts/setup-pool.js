import hre from "hardhat";
import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import dotenv from "dotenv";

dotenv.config();

const STAKING_CONTRACT = "0x4a4da37c9a9f421efe3feb527fc16802ce756ec3";

async function main() {
  console.log("Setting up test token and staking pool...\n");

  // Get artifacts
  const tokenArtifact = await hre.artifacts.readArtifact("TestToken");
  const stakingArtifact = await hre.artifacts.readArtifact("MultiPoolStakingAPR");

  // Create account from private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not set in .env");
  }

  const account = privateKeyToAccount(`0x${privateKey}`);
  const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpcUrl),
  });

  console.log("Deployer:", account.address);

  // Deploy test token (will be used for both staking and rewards)
  console.log("\n1. Deploying TestToken (OEC)...");

  const initialSupply = parseEther("1000000"); // 1 million tokens

  const tokenHash = await walletClient.deployContract({
    abi: tokenArtifact.abi,
    bytecode: tokenArtifact.bytecode,
    args: ["Oeconomia Test Token", "OEC", initialSupply],
  });

  console.log("   TX:", tokenHash);
  const tokenReceipt = await publicClient.waitForTransactionReceipt({ hash: tokenHash });
  const tokenAddress = tokenReceipt.contractAddress;
  console.log("   ✓ TestToken deployed to:", tokenAddress);

  // Fund the staking contract with reward tokens
  console.log("\n2. Funding staking contract with reward tokens...");

  const rewardAmount = parseEther("100000"); // 100k tokens for rewards

  const transferHash = await walletClient.writeContract({
    address: tokenAddress,
    abi: tokenArtifact.abi,
    functionName: "transfer",
    args: [STAKING_CONTRACT, rewardAmount],
  });

  console.log("   TX:", transferHash);
  await publicClient.waitForTransactionReceipt({ hash: transferHash });
  console.log("   ✓ Transferred 100,000 OEC to staking contract for rewards");

  // Create staking pool
  console.log("\n3. Creating staking pool...");

  const aprBps = 1000n; // 10% APR
  const lockPeriod = 60n; // 60 seconds lock (short for testing)

  const addPoolHash = await walletClient.writeContract({
    address: STAKING_CONTRACT,
    abi: stakingArtifact.abi,
    functionName: "addPool",
    args: [tokenAddress, tokenAddress, aprBps, lockPeriod],
  });

  console.log("   TX:", addPoolHash);
  await publicClient.waitForTransactionReceipt({ hash: addPoolHash });
  console.log("   ✓ Pool created with 10% APR and 60s lock period");

  // Set early withdrawal penalty
  console.log("\n4. Setting early withdrawal penalty...");

  const penaltyBps = 1000n; // 10% penalty for early withdrawal

  const penaltyHash = await walletClient.writeContract({
    address: STAKING_CONTRACT,
    abi: stakingArtifact.abi,
    functionName: "setEarlyPenaltyBps",
    args: [0n, penaltyBps], // Pool ID 0
  });

  console.log("   TX:", penaltyHash);
  await publicClient.waitForTransactionReceipt({ hash: penaltyHash });
  console.log("   ✓ Early withdrawal penalty set to 10%");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SETUP COMPLETE!");
  console.log("=".repeat(60));
  console.log("\nTest Token (OEC):", tokenAddress);
  console.log("Staking Contract:", STAKING_CONTRACT);
  console.log("\nPool 0 Configuration:");
  console.log("  - Staking Token: OEC");
  console.log("  - Rewards Token: OEC");
  console.log("  - APR: 10%");
  console.log("  - Lock Period: 60 seconds");
  console.log("  - Early Withdrawal Penalty: 10%");
  console.log("\nYour token balance:", Number(initialSupply - rewardAmount) / 1e18, "OEC");
  console.log("\nTo test staking:");
  console.log("1. Import OEC token to MetaMask:", tokenAddress);
  console.log("2. Approve staking contract to spend your tokens");
  console.log("3. Stake tokens in Pool 0");

  return { tokenAddress, stakingContract: STAKING_CONTRACT };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Setup failed:", error.message || error);
    process.exit(1);
  });
