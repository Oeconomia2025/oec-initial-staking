import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Settings,
  Plus,
  Pause,
  Play,
  Wallet,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { OECLoader } from "@/components/oec-loader";
import { useToast } from "@/hooks/use-toast";
import { useAccount, usePublicClient, useWalletClient, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { parseEther, formatEther } from "viem";
import MultiPoolStakingAPRABI from "@/services/abis/MultiPoolStakingAPR.json";
import ERC20ABI from "@/services/abis/ERC20.json";

// Contract addresses on Sepolia
const STAKING_CONTRACT = "0x4a4da37c9a9f421efe3feb527fc16802ce756ec3";
const OEC_TOKEN = "0x2b2fb8df4ac5d394f0d5674d7a54802e42a06aba";

interface PoolInfo {
  id: number;
  stakingToken: string;
  rewardsToken: string;
  aprBps: bigint;
  lockPeriod: bigint;
  totalSupply: bigint;
  earlyPenaltyBps: bigint;
}

export default function Admin() {
  const { isConnected, address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();

  const isCorrectNetwork = Boolean(chain && chain.id === sepolia.id);

  const [loading, setLoading] = useState(true);
  const [txPending, setTxPending] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [owner, setOwner] = useState<string>("");
  const [paused, setPaused] = useState(false);
  const [penaltyRecipient, setPenaltyRecipient] = useState<string>("");
  const [pools, setPools] = useState<PoolInfo[]>([]);

  // Form states
  const [newPoolForm, setNewPoolForm] = useState({
    stakingToken: OEC_TOKEN,
    rewardsToken: OEC_TOKEN,
    aprBps: "",
    lockPeriod: "",
  });
  const [updateAprForm, setUpdateAprForm] = useState({ poolId: "", aprBps: "" });
  const [updateLockForm, setUpdateLockForm] = useState({ poolId: "", lockPeriod: "" });
  const [updatePenaltyBpsForm, setUpdatePenaltyBpsForm] = useState({ poolId: "", bps: "" });
  const [newPenaltyRecipient, setNewPenaltyRecipient] = useState("");
  const [recoverForm, setRecoverForm] = useState({ tokenAddress: "", amount: "" });

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!publicClient) return;

      try {
        setLoading(true);

        // Get owner
        const ownerAddress = await publicClient.readContract({
          address: STAKING_CONTRACT,
          abi: MultiPoolStakingAPRABI,
          functionName: "owner",
        }) as string;
        setOwner(ownerAddress);
        setIsOwner(address?.toLowerCase() === ownerAddress?.toLowerCase());

        // Get paused status
        const isPaused = await publicClient.readContract({
          address: STAKING_CONTRACT,
          abi: MultiPoolStakingAPRABI,
          functionName: "paused",
        }) as boolean;
        setPaused(isPaused);

        // Get penalty recipient
        const recipient = await publicClient.readContract({
          address: STAKING_CONTRACT,
          abi: MultiPoolStakingAPRABI,
          functionName: "penaltyRecipient",
        }) as string;
        setPenaltyRecipient(recipient);

        // Get pool count and info
        const poolCount = await publicClient.readContract({
          address: STAKING_CONTRACT,
          abi: MultiPoolStakingAPRABI,
          functionName: "poolCount",
        }) as bigint;

        const poolsData: PoolInfo[] = [];
        for (let i = 0; i < Number(poolCount); i++) {
          const poolInfo = await publicClient.readContract({
            address: STAKING_CONTRACT,
            abi: MultiPoolStakingAPRABI,
            functionName: "getPoolInfo",
            args: [BigInt(i)],
          }) as [string, string, bigint, bigint, bigint, bigint, bigint];

          const penaltyBps = await publicClient.readContract({
            address: STAKING_CONTRACT,
            abi: MultiPoolStakingAPRABI,
            functionName: "earlyPenaltyBps",
            args: [BigInt(i)],
          }) as bigint;

          poolsData.push({
            id: i,
            stakingToken: poolInfo[0],
            rewardsToken: poolInfo[1],
            aprBps: poolInfo[2],
            lockPeriod: poolInfo[3],
            totalSupply: poolInfo[4],
            earlyPenaltyBps: penaltyBps,
          });
        }
        setPools(poolsData);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [publicClient, address]);

  const formatNumber = (num: bigint, decimals = 2) => {
    const n = Number(formatEther(num));
    return n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const formatLockPeriod = (seconds: bigint) => {
    const s = Number(seconds);
    if (s === 0) return "Flexible";
    if (s < 3600) return `${s} seconds`;
    if (s < 86400) return `${Math.floor(s / 3600)} hours`;
    return `${Math.floor(s / 86400)} days`;
  };

  const handleAddPool = async () => {
    if (!walletClient || !isOwner) return;

    try {
      setTxPending(true);
      toast({ title: "Adding pool...", description: "Please confirm in your wallet" });

      const hash = await walletClient.writeContract({
        address: STAKING_CONTRACT,
        abi: MultiPoolStakingAPRABI,
        functionName: "addPool",
        args: [
          newPoolForm.stakingToken as `0x${string}`,
          newPoolForm.rewardsToken as `0x${string}`,
          BigInt(Number(newPoolForm.aprBps) * 100), // Convert % to bps
          BigInt(newPoolForm.lockPeriod),
        ],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      toast({ title: "Pool added!", description: "New staking pool has been created" });
      window.location.reload();
    } catch (error) {
      console.error("Add pool failed:", error);
      toast({ title: "Failed to add pool", variant: "destructive" });
    } finally {
      setTxPending(false);
    }
  };

  const handleUpdateApr = async () => {
    if (!walletClient || !isOwner) return;

    try {
      setTxPending(true);
      toast({ title: "Updating APR...", description: "Please confirm in your wallet" });

      const hash = await walletClient.writeContract({
        address: STAKING_CONTRACT,
        abi: MultiPoolStakingAPRABI,
        functionName: "setAprBps",
        args: [BigInt(updateAprForm.poolId), BigInt(Number(updateAprForm.aprBps) * 100)],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      toast({ title: "APR updated!", description: `Pool ${updateAprForm.poolId} APR set to ${updateAprForm.aprBps}%` });
      window.location.reload();
    } catch (error) {
      console.error("Update APR failed:", error);
      toast({ title: "Failed to update APR", variant: "destructive" });
    } finally {
      setTxPending(false);
    }
  };

  const handleUpdateLockPeriod = async () => {
    if (!walletClient || !isOwner) return;

    try {
      setTxPending(true);
      toast({ title: "Updating lock period...", description: "Please confirm in your wallet" });

      const hash = await walletClient.writeContract({
        address: STAKING_CONTRACT,
        abi: MultiPoolStakingAPRABI,
        functionName: "setLockPeriod",
        args: [BigInt(updateLockForm.poolId), BigInt(updateLockForm.lockPeriod)],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      toast({ title: "Lock period updated!", description: `Pool ${updateLockForm.poolId} lock period updated` });
      window.location.reload();
    } catch (error) {
      console.error("Update lock period failed:", error);
      toast({ title: "Failed to update lock period", variant: "destructive" });
    } finally {
      setTxPending(false);
    }
  };

  const handleUpdatePenaltyBps = async () => {
    if (!walletClient || !isOwner) return;

    try {
      setTxPending(true);
      toast({ title: "Updating penalty...", description: "Please confirm in your wallet" });

      const hash = await walletClient.writeContract({
        address: STAKING_CONTRACT,
        abi: MultiPoolStakingAPRABI,
        functionName: "setEarlyPenaltyBps",
        args: [BigInt(updatePenaltyBpsForm.poolId), BigInt(Number(updatePenaltyBpsForm.bps) * 100)],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      toast({ title: "Penalty updated!", description: `Pool ${updatePenaltyBpsForm.poolId} penalty set to ${updatePenaltyBpsForm.bps}%` });
      window.location.reload();
    } catch (error) {
      console.error("Update penalty failed:", error);
      toast({ title: "Failed to update penalty", variant: "destructive" });
    } finally {
      setTxPending(false);
    }
  };

  const handleSetPenaltyRecipient = async () => {
    if (!walletClient || !isOwner) return;

    try {
      setTxPending(true);
      toast({ title: "Setting penalty recipient...", description: "Please confirm in your wallet" });

      const hash = await walletClient.writeContract({
        address: STAKING_CONTRACT,
        abi: MultiPoolStakingAPRABI,
        functionName: "setPenaltyRecipient",
        args: [newPenaltyRecipient as `0x${string}`],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      toast({ title: "Penalty recipient updated!" });
      window.location.reload();
    } catch (error) {
      console.error("Set penalty recipient failed:", error);
      toast({ title: "Failed to update penalty recipient", variant: "destructive" });
    } finally {
      setTxPending(false);
    }
  };

  const handlePauseToggle = async () => {
    if (!walletClient || !isOwner) return;

    try {
      setTxPending(true);
      const action = paused ? "unpause" : "pause";
      toast({ title: `${paused ? "Unpausing" : "Pausing"} contract...`, description: "Please confirm in your wallet" });

      const hash = await walletClient.writeContract({
        address: STAKING_CONTRACT,
        abi: MultiPoolStakingAPRABI,
        functionName: action,
        args: [],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      toast({ title: `Contract ${paused ? "unpaused" : "paused"}!` });
      window.location.reload();
    } catch (error) {
      console.error("Pause toggle failed:", error);
      toast({ title: "Failed to toggle pause state", variant: "destructive" });
    } finally {
      setTxPending(false);
    }
  };

  const handleRecoverTokens = async () => {
    if (!walletClient || !isOwner) return;

    try {
      setTxPending(true);
      toast({ title: "Recovering tokens...", description: "Please confirm in your wallet" });

      const hash = await walletClient.writeContract({
        address: STAKING_CONTRACT,
        abi: MultiPoolStakingAPRABI,
        functionName: "recoverERC20",
        args: [recoverForm.tokenAddress as `0x${string}`, parseEther(recoverForm.amount)],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      toast({ title: "Tokens recovered!", description: `${recoverForm.amount} tokens sent to owner` });
      window.location.reload();
    } catch (error) {
      console.error("Recover tokens failed:", error);
      toast({ title: "Failed to recover tokens", variant: "destructive" });
    } finally {
      setTxPending(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <OECLoader size="lg" text="Loading admin panel..." />
        </div>
      </Layout>
    );
  }

  if (!isConnected) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <Card className="crypto-card p-6 text-center">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Connect Wallet</h2>
            <p className="text-gray-400">Please connect your wallet to access the admin panel.</p>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <Card className="crypto-card p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
            <h2 className="text-xl font-semibold mb-2">Wrong Network</h2>
            <p className="text-gray-400 mb-4">Please switch to Sepolia to access the admin panel.</p>
            <Button onClick={() => switchChain({ chainId: sepolia.id })}>
              Switch to Sepolia
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!isOwner) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <Card className="crypto-card p-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-4">Only the contract owner can access this panel.</p>
            <p className="text-xs text-gray-500 font-mono">Owner: {owner}</p>
            <p className="text-xs text-gray-500 font-mono">Your address: {address}</p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <Badge className={paused ? "bg-red-500" : "bg-green-500"}>
            {paused ? "Contract Paused" : "Contract Active"}
          </Badge>
        </div>

        {/* Contract Info */}
        <Card className="crypto-card p-4 bg-gray-900/80">
          <h3 className="text-sm font-semibold mb-3 flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Contract Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Owner:</span>
              <p className="font-mono text-xs break-all">{owner}</p>
            </div>
            <div>
              <span className="text-gray-400">Penalty Recipient:</span>
              <p className="font-mono text-xs break-all">{penaltyRecipient || "Not set"}</p>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <p className={paused ? "text-red-400" : "text-green-400"}>{paused ? "Paused" : "Active"}</p>
            </div>
            <div>
              <span className="text-gray-400">Total Pools:</span>
              <p>{pools.length}</p>
            </div>
          </div>
        </Card>

        {/* Existing Pools */}
        <Card className="crypto-card p-4 bg-gray-900/80">
          <h3 className="text-sm font-semibold mb-3">Existing Pools</h3>
          <div className="space-y-2">
            {pools.map((pool) => (
              <div key={pool.id} className="bg-black/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Pool #{pool.id}</span>
                  <Badge className="bg-cyan-500/20 text-cyan-400">{Number(pool.aprBps) / 100}% APR</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Lock:</span>
                    <p>{formatLockPeriod(pool.lockPeriod)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Staked:</span>
                    <p>{formatNumber(pool.totalSupply)} OEC</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Early Penalty:</span>
                    <p>{Number(pool.earlyPenaltyBps) / 100}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Add Pool */}
          <Card className="crypto-card p-4 bg-gray-900/80">
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add New Pool
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400">APR (%)</label>
                <input
                  type="number"
                  value={newPoolForm.aprBps}
                  onChange={(e) => setNewPoolForm(prev => ({ ...prev, aprBps: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded-md p-2 text-sm"
                  placeholder="e.g., 12"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Lock Period (seconds)</label>
                <input
                  type="number"
                  value={newPoolForm.lockPeriod}
                  onChange={(e) => setNewPoolForm(prev => ({ ...prev, lockPeriod: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded-md p-2 text-sm"
                  placeholder="e.g., 2592000 (30 days)"
                />
              </div>
              <Button
                onClick={handleAddPool}
                disabled={txPending || !newPoolForm.aprBps || !newPoolForm.lockPeriod}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {txPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Add Pool
              </Button>
            </div>
          </Card>

          {/* Update APR */}
          <Card className="crypto-card p-4 bg-gray-900/80">
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Pool APR
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400">Pool ID</label>
                <input
                  type="number"
                  value={updateAprForm.poolId}
                  onChange={(e) => setUpdateAprForm(prev => ({ ...prev, poolId: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded-md p-2 text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">New APR (%)</label>
                <input
                  type="number"
                  value={updateAprForm.aprBps}
                  onChange={(e) => setUpdateAprForm(prev => ({ ...prev, aprBps: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded-md p-2 text-sm"
                  placeholder="e.g., 15"
                />
              </div>
              <Button
                onClick={handleUpdateApr}
                disabled={txPending || !updateAprForm.poolId || !updateAprForm.aprBps}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {txPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update APR
              </Button>
            </div>
          </Card>

          {/* Update Lock Period */}
          <Card className="crypto-card p-4 bg-gray-900/80">
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Lock Period
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400">Pool ID</label>
                <input
                  type="number"
                  value={updateLockForm.poolId}
                  onChange={(e) => setUpdateLockForm(prev => ({ ...prev, poolId: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded-md p-2 text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">New Lock Period (seconds)</label>
                <input
                  type="number"
                  value={updateLockForm.lockPeriod}
                  onChange={(e) => setUpdateLockForm(prev => ({ ...prev, lockPeriod: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded-md p-2 text-sm"
                  placeholder="e.g., 604800 (7 days)"
                />
              </div>
              <Button
                onClick={handleUpdateLockPeriod}
                disabled={txPending || !updateLockForm.poolId || !updateLockForm.lockPeriod}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {txPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update Lock Period
              </Button>
            </div>
          </Card>

          {/* Update Early Penalty */}
          <Card className="crypto-card p-4 bg-gray-900/80">
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Early Penalty
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400">Pool ID</label>
                <input
                  type="number"
                  value={updatePenaltyBpsForm.poolId}
                  onChange={(e) => setUpdatePenaltyBpsForm(prev => ({ ...prev, poolId: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded-md p-2 text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Penalty (%)</label>
                <input
                  type="number"
                  value={updatePenaltyBpsForm.bps}
                  onChange={(e) => setUpdatePenaltyBpsForm(prev => ({ ...prev, bps: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded-md p-2 text-sm"
                  placeholder="e.g., 10"
                />
              </div>
              <Button
                onClick={handleUpdatePenaltyBps}
                disabled={txPending || !updatePenaltyBpsForm.poolId || !updatePenaltyBpsForm.bps}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {txPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update Penalty
              </Button>
            </div>
          </Card>

          {/* Set Penalty Recipient */}
          <Card className="crypto-card p-4 bg-gray-900/80">
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              <Wallet className="w-4 h-4 mr-2" />
              Set Penalty Recipient
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400">Recipient Address</label>
                <input
                  type="text"
                  value={newPenaltyRecipient}
                  onChange={(e) => setNewPenaltyRecipient(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-md p-2 text-sm font-mono"
                  placeholder="0x..."
                />
              </div>
              <Button
                onClick={handleSetPenaltyRecipient}
                disabled={txPending || !newPenaltyRecipient}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {txPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Set Recipient
              </Button>
            </div>
          </Card>

          {/* Pause/Unpause */}
          <Card className="crypto-card p-4 bg-gray-900/80">
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              {paused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
              Contract Controls
            </h3>
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                {paused
                  ? "Contract is paused. Users cannot stake or withdraw."
                  : "Contract is active. Users can stake and withdraw normally."}
              </p>
              <Button
                onClick={handlePauseToggle}
                disabled={txPending}
                className={`w-full ${paused ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
              >
                {txPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {paused ? "Unpause Contract" : "Pause Contract"}
              </Button>
            </div>
          </Card>

          {/* Recover Tokens */}
          <Card className="crypto-card p-4 bg-gray-900/80">
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-yellow-400" />
              Recover Accidentally Sent Tokens
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400">Token Address</label>
                <input
                  type="text"
                  value={recoverForm.tokenAddress}
                  onChange={(e) => setRecoverForm(prev => ({ ...prev, tokenAddress: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded-md p-2 text-sm font-mono"
                  placeholder="0x..."
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Amount</label>
                <input
                  type="text"
                  value={recoverForm.amount}
                  onChange={(e) => setRecoverForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded-md p-2 text-sm"
                  placeholder="100"
                />
              </div>
              <Button
                onClick={handleRecoverTokens}
                disabled={txPending || !recoverForm.tokenAddress || !recoverForm.amount}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                {txPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Recover Tokens
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
