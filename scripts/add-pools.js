import hre from "hardhat";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import dotenv from "dotenv";

dotenv.config();

const STAKING_CONTRACT = "0x4a4da37c9a9f421efe3feb527fc16802ce756ec3";
const OEC_TOKEN = "0x2b2fb8df4ac5d394f0d5674d7a54802e42a06aba";

async function main() {
  console.log("Adding new staking pools...\n");

  const stakingArtifact = await hre.artifacts.readArtifact("MultiPoolStakingAPR");

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

  console.log("Owner:", account.address);

  // Pool configurations
  // Note: Contract has 50% APR cap (5000 bps max)
  const pools = [
    { name: "30-Day Lock", aprBps: 2500n, lockDays: 30, penaltyBps: 1500n },  // 25% APR, 15% penalty
    { name: "60-Day Lock", aprBps: 4000n, lockDays: 60, penaltyBps: 2000n },  // 40% APR, 20% penalty
    { name: "90-Day Lock", aprBps: 5000n, lockDays: 90, penaltyBps: 2500n },  // 50% APR (max), 25% penalty
  ];

  for (const pool of pools) {
    const lockPeriod = BigInt(pool.lockDays * 24 * 60 * 60); // Convert days to seconds

    console.log(`\nCreating ${pool.name} pool...`);
    console.log(`  APR: ${Number(pool.aprBps) / 100}%`);
    console.log(`  Lock: ${pool.lockDays} days (${lockPeriod} seconds)`);
    console.log(`  Early withdrawal penalty: ${Number(pool.penaltyBps) / 100}%`);

    // Add pool
    const addPoolHash = await walletClient.writeContract({
      address: STAKING_CONTRACT,
      abi: stakingArtifact.abi,
      functionName: "addPool",
      args: [OEC_TOKEN, OEC_TOKEN, pool.aprBps, lockPeriod],
    });

    console.log(`  TX: ${addPoolHash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: addPoolHash });

    // Get the pool ID from the event or by checking pool count
    const poolCount = await publicClient.readContract({
      address: STAKING_CONTRACT,
      abi: stakingArtifact.abi,
      functionName: "poolCount",
    });
    const poolId = Number(poolCount) - 1;

    console.log(`  ✓ Pool ${poolId} created`);

    // Set early withdrawal penalty
    const penaltyHash = await walletClient.writeContract({
      address: STAKING_CONTRACT,
      abi: stakingArtifact.abi,
      functionName: "setEarlyPenaltyBps",
      args: [BigInt(poolId), pool.penaltyBps],
    });

    await publicClient.waitForTransactionReceipt({ hash: penaltyHash });
    console.log(`  ✓ Penalty set to ${Number(pool.penaltyBps) / 100}%`);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("ALL POOLS CREATED!");
  console.log("=".repeat(60));

  const finalPoolCount = await publicClient.readContract({
    address: STAKING_CONTRACT,
    abi: stakingArtifact.abi,
    functionName: "poolCount",
  });

  console.log(`\nTotal pools: ${finalPoolCount}`);
  console.log("\nPool Summary:");
  console.log("  Pool 0: 60 seconds lock, 10% APR (test pool)");
  console.log("  Pool 1: 30 days lock, 25% APR");
  console.log("  Pool 2: 60 days lock, 40% APR");
  console.log("  Pool 3: 90 days lock, 50% APR (max allowed)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed:", error.message || error);
    process.exit(1);
  });
