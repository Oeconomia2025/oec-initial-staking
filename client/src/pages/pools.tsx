import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Clock,
  TrendingUp,
  Wallet,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";
import { WalletConnect } from "@/components/wallet-connect";
import { OECLoader } from "@/components/oec-loader";
import { EarlyWithdrawModal } from "@/components/early-withdraw-modal";
import { useToast } from "@/hooks/use-toast";
import { useAccount, usePublicClient, useWalletClient, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { parseEther, formatEther, parseAbiItem } from "viem";
import MultiPoolStakingAPRABI from "@/services/abis/MultiPoolStakingAPR.json";
import ERC20ABI from "@/services/abis/ERC20.json";

// Contract addresses on Sepolia
const STAKING_CONTRACT = "0x4a4da37c9a9f421efe3feb527fc16802ce756ec3";
const OEC_TOKEN = "0x2b2fb8df4ac5d394f0d5674d7a54802e42a06aba";

interface PoolData {
  id: number;
  name: string;
  stakingToken: string;
  rewardsToken: string;
  aprBps: bigint;
  lockPeriod: bigint;
  totalSupply: bigint;
  userBalance: bigint;
  userEarned: bigint;
  gradient: string;
}

export default function Pools() {
  const { isConnected, address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();

  // Check if on correct network - must be defined AND be sepolia
  const isCorrectNetwork = Boolean(chain && chain.id === sepolia.id);

  const [expandedPool, setExpandedPool] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<{ [key: number]: string }>({});
  const [stakeAmount, setStakeAmount] = useState<{ [key: number]: string }>({});
  const [pools, setPools] = useState<PoolData[]>([]);
  const [poolCount, setPoolCount] = useState(0);
  const [userTokenBalance, setUserTokenBalance] = useState<bigint>(0n);
  const [allowance, setAllowance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(true);
  const [txPending, setTxPending] = useState(false);
  const [depositTimestamps, setDepositTimestamps] = useState<{ [poolId: number]: bigint }>({});
  const [earlyPenaltyBps, setEarlyPenaltyBps] = useState<{ [poolId: number]: bigint }>({});
  const [earlyWithdrawModal, setEarlyWithdrawModal] = useState<{
    isOpen: boolean;
    poolId: number | null;
    poolName: string;
    amount: bigint;
    penaltyBps: bigint;
  }>({ isOpen: false, poolId: null, poolName: "", amount: 0n, penaltyBps: 1000n });

  // Fetch pool count and data
  useEffect(() => {
    const fetchPools = async () => {
      if (!publicClient) return;

      try {
        setLoading(true);

        // Get pool count
        const count = await publicClient.readContract({
          address: STAKING_CONTRACT,
          abi: MultiPoolStakingAPRABI,
          functionName: "poolCount",
        }) as bigint;

        setPoolCount(Number(count));

        // Fetch each pool's data
        const poolsData: PoolData[] = [];
        const gradients = [
          "from-cyan-500 to-blue-600",
          "from-purple-500 to-pink-600",
          "from-green-500 to-teal-600",
          "from-orange-500 to-red-600",
        ];

        for (let i = 0; i < Number(count); i++) {
          const poolInfo = await publicClient.readContract({
            address: STAKING_CONTRACT,
            abi: MultiPoolStakingAPRABI,
            functionName: "getPoolInfo",
            args: [BigInt(i)],
          }) as [string, string, bigint, bigint, bigint, bigint, bigint];

          let userBalance = 0n;
          let userEarned = 0n;

          if (address) {
            userBalance = await publicClient.readContract({
              address: STAKING_CONTRACT,
              abi: MultiPoolStakingAPRABI,
              functionName: "balanceOf",
              args: [BigInt(i), address],
            }) as bigint;

            userEarned = await publicClient.readContract({
              address: STAKING_CONTRACT,
              abi: MultiPoolStakingAPRABI,
              functionName: "earned",
              args: [BigInt(i), address],
            }) as bigint;
          }

          // Generate pool name based on lock period
          const lockSeconds = Number(poolInfo[3]);
          let poolName = "OEC Flexible Staking";
          if (lockSeconds >= 86400) {
            const days = Math.floor(lockSeconds / 86400);
            poolName = `OEC ${days}-Day Lock`;
          } else if (lockSeconds > 0) {
            poolName = `OEC ${lockSeconds}s Lock (Test)`;
          }

          poolsData.push({
            id: i,
            name: poolName,
            stakingToken: poolInfo[0],
            rewardsToken: poolInfo[1],
            aprBps: poolInfo[2],
            lockPeriod: poolInfo[3],
            totalSupply: poolInfo[4],
            userBalance,
            userEarned,
            gradient: gradients[i % gradients.length],
          });
        }

        setPools(poolsData);

        // Fetch user token balance and allowance
        if (address) {
          const balance = await publicClient.readContract({
            address: OEC_TOKEN,
            abi: ERC20ABI,
            functionName: "balanceOf",
            args: [address],
          }) as bigint;
          setUserTokenBalance(balance);

          const allow = await publicClient.readContract({
            address: OEC_TOKEN,
            abi: ERC20ABI,
            functionName: "allowance",
            args: [address, STAKING_CONTRACT],
          }) as bigint;
          setAllowance(allow);
        }

        // Fetch early penalty BPS for each pool
        const penaltyBpsData: { [poolId: number]: bigint } = {};
        for (let i = 0; i < Number(count); i++) {
          try {
            const penaltyBps = await publicClient.readContract({
              address: STAKING_CONTRACT,
              abi: MultiPoolStakingAPRABI,
              functionName: "earlyPenaltyBps",
              args: [BigInt(i)],
            }) as bigint;
            penaltyBpsData[i] = penaltyBps;
          } catch {
            penaltyBpsData[i] = 1000n; // Default 10%
          }
        }
        setEarlyPenaltyBps(penaltyBpsData);

        // Fetch deposit timestamps from Staked events
        if (address) {
          try {
            const logs = await publicClient.getLogs({
              address: STAKING_CONTRACT,
              event: parseAbiItem('event Staked(uint256 indexed poolId, address indexed user, uint256 creditedAmount)'),
              args: { user: address },
              fromBlock: 0n,
              toBlock: 'latest'
            });

            // Get the most recent stake timestamp for each pool
            const timestamps: { [poolId: number]: bigint } = {};
            for (const log of logs) {
              const poolId = Number(log.args.poolId);
              // Get the block to retrieve timestamp
              const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
              timestamps[poolId] = block.timestamp;
            }
            setDepositTimestamps(timestamps);
          } catch (error) {
            console.error("Error fetching stake events:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching pools:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
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

  const getUnlockStatus = (poolId: number, lockPeriod: bigint) => {
    const lockSeconds = Number(lockPeriod);
    if (lockSeconds === 0) return { unlocked: true, text: "Flexible", color: "text-green-400" };

    const depositTime = depositTimestamps[poolId];
    if (!depositTime) return { unlocked: true, text: "No deposit", color: "text-gray-400" };

    const unlockTime = Number(depositTime) + lockSeconds;
    const now = Math.floor(Date.now() / 1000);
    const remaining = unlockTime - now;

    if (remaining <= 0) {
      return { unlocked: true, text: "Unlocked", color: "text-green-400" };
    }

    // Format remaining time
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    let text = "Unlocks in ";
    if (days > 0) text += `${days}d `;
    if (hours > 0) text += `${hours}h `;
    if (days === 0 && minutes > 0) text += `${minutes}m`;

    return { unlocked: false, text: text.trim(), color: "text-yellow-400" };
  };

  const toggleExpand = (poolId: number) => {
    setExpandedPool(expandedPool === poolId ? null : poolId);
    if (!activeTab[poolId]) {
      setActiveTab(prev => ({ ...prev, [poolId]: 'Stake' }));
    }
  };

  const setTab = (poolId: number, tab: string) => {
    setActiveTab(prev => ({ ...prev, [poolId]: tab }));
  };

  const handleStakeAmountChange = (poolId: number, value: string) => {
    setStakeAmount(prev => ({ ...prev, [poolId]: value }));
  };

  const handleApprove = async () => {
    if (!walletClient || !address) return;

    try {
      setTxPending(true);
      toast({ title: "Approving OEC...", description: "Please confirm in your wallet" });

      const hash = await walletClient.writeContract({
        address: OEC_TOKEN,
        abi: ERC20ABI,
        functionName: "approve",
        args: [STAKING_CONTRACT, parseEther("1000000000")], // Approve max
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      setAllowance(parseEther("1000000000"));
      toast({ title: "OEC Approved!", description: "You can now stake your tokens" });
    } catch (error) {
      console.error("Approval failed:", error);
      toast({ title: "Approval failed", description: "Transaction was rejected or failed", variant: "destructive" });
    } finally {
      setTxPending(false);
    }
  };

  const handleStake = async (poolId: number) => {
    if (!walletClient || !address || !stakeAmount[poolId]) return;

    try {
      setTxPending(true);
      const amount = parseEther(stakeAmount[poolId]);
      toast({ title: "Staking OEC...", description: "Please confirm in your wallet" });

      const hash = await walletClient.writeContract({
        address: STAKING_CONTRACT,
        abi: MultiPoolStakingAPRABI,
        functionName: "stake",
        args: [BigInt(poolId), amount],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      toast({ title: "Successfully staked!", description: `${stakeAmount[poolId]} OEC has been staked` });

      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error("Stake failed:", error);
      toast({ title: "Stake failed", description: "Transaction was rejected or failed", variant: "destructive" });
    } finally {
      setTxPending(false);
    }
  };

  const handleWithdraw = async (poolId: number) => {
    if (!walletClient || !address || !stakeAmount[poolId]) return;

    try {
      setTxPending(true);
      const amount = parseEther(stakeAmount[poolId]);
      toast({ title: "Withdrawing...", description: "Please confirm in your wallet" });

      const hash = await walletClient.writeContract({
        address: STAKING_CONTRACT,
        abi: MultiPoolStakingAPRABI,
        functionName: "withdraw",
        args: [BigInt(poolId), amount],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      toast({ title: "Successfully withdrew!", description: `${stakeAmount[poolId]} OEC has been withdrawn` });
      window.location.reload();
    } catch (error) {
      console.error("Withdraw failed:", error);
      toast({ title: "Withdraw failed", description: "Transaction was rejected or failed", variant: "destructive" });
    } finally {
      setTxPending(false);
    }
  };

  const openEarlyWithdrawModal = (poolId: number) => {
    const pool = pools.find(p => p.id === poolId);
    if (!pool || pool.userBalance === 0n) return;

    setEarlyWithdrawModal({
      isOpen: true,
      poolId,
      poolName: pool.name,
      amount: pool.userBalance,
      penaltyBps: earlyPenaltyBps[poolId] || 1000n,
    });
  };

  const handleEarlyWithdrawConfirm = async () => {
    if (!walletClient || !address || earlyWithdrawModal.poolId === null) return;

    const pool = pools.find(p => p.id === earlyWithdrawModal.poolId);
    if (!pool || pool.userBalance === 0n) return;

    try {
      setTxPending(true);
      setEarlyWithdrawModal(prev => ({ ...prev, isOpen: false }));
      toast({ title: "Processing early withdrawal...", description: "Please confirm in your wallet" });

      const hash = await walletClient.writeContract({
        address: STAKING_CONTRACT,
        abi: MultiPoolStakingAPRABI,
        functionName: "earlyWithdraw",
        args: [BigInt(earlyWithdrawModal.poolId!), pool.userBalance],
      });

      await publicClient?.waitForTransactionReceipt({ hash });

      const penaltyAmount = (pool.userBalance * earlyWithdrawModal.penaltyBps) / 10000n;
      const receivedAmount = pool.userBalance - penaltyAmount;
      toast({
        title: "Early withdrawal complete!",
        description: `Received ${formatNumber(receivedAmount)} OEC (${formatNumber(penaltyAmount)} penalty)`
      });
      window.location.reload();
    } catch (error) {
      console.error("Early withdraw failed:", error);
      toast({ title: "Early withdraw failed", description: "Transaction was rejected or failed", variant: "destructive" });
    } finally {
      setTxPending(false);
    }
  };

  const handleClaimRewards = async (poolId: number) => {
    if (!walletClient || !address) return;

    const pool = pools.find(p => p.id === poolId);

    try {
      setTxPending(true);
      toast({ title: "Claiming rewards...", description: "Please confirm in your wallet" });

      const hash = await walletClient.writeContract({
        address: STAKING_CONTRACT,
        abi: MultiPoolStakingAPRABI,
        functionName: "getReward",
        args: [BigInt(poolId)],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      toast({
        title: "Rewards claimed!",
        description: `Claimed ${pool ? formatNumber(pool.userEarned) : ''} OEC rewards`
      });
      window.location.reload();
    } catch (error) {
      console.error("Claim failed:", error);
      toast({ title: "Claim failed", description: "Transaction was rejected or failed", variant: "destructive" });
    } finally {
      setTxPending(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <OECLoader size="lg" text="Loading pools..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 space-y-2.5 sm:space-y-3 mt-3">
        {/* Wallet Connection Notice */}
        {!isConnected && (
          <Card className="crypto-card p-3 border mb-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-yellow-400" />
                <div>
                  <p className="text-xs font-medium">Connect your wallet to start staking</p>
                  <p className="text-[0.6rem] text-gray-400">Switch to Sepolia testnet after connecting</p>
                </div>
              </div>
              <div className="max-w-xs">
                <WalletConnect />
              </div>
            </div>
          </Card>
        )}

        {/* Wrong Network Warning */}
        {isConnected && !isCorrectNetwork && (
          <Card className="crypto-card p-3 border mb-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-red-400" />
                <div>
                  <p className="text-xs font-medium text-red-400">Wrong Network</p>
                  <p className="text-[0.6rem] text-gray-400">Please switch to Sepolia to use this dapp</p>
                </div>
              </div>
              <button
                onClick={() => switchChain({ chainId: sepolia.id })}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-md transition-colors"
              >
                Switch to Sepolia
              </button>
            </div>
          </Card>
        )}

        {/* User Balance Card */}
        {isConnected && isCorrectNetwork && (
          <Card className="crypto-card p-3 border mb-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Your OEC Balance</p>
                <p className="text-lg font-bold">{formatNumber(userTokenBalance)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Token Address</p>
                <p className="text-xs font-mono">{OEC_TOKEN.slice(0, 10)}...{OEC_TOKEN.slice(-8)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* No Pools Message */}
        {pools.length === 0 && (
          <Card className="crypto-card p-6 text-center">
            <p className="text-gray-400">No staking pools available yet.</p>
          </Card>
        )}

        {/* Staking Pools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {pools.map((pool) => (
            <div key={pool.id} style={{ margin: 0, padding: 0 }}>
              {/* Pool Header */}
              <div
                className={`relative p-2 sm:p-3 bg-gradient-to-r ${pool.gradient} ${expandedPool === pool.id ? 'rounded-t-md' : 'rounded-md'} cursor-pointer transition-all duration-200 hover:shadow-md`}
                onClick={() => toggleExpand(pool.id)}
              >
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-1 min-w-0">
                    <Lock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-semibold truncate">{pool.name}</h3>
                      <div className="flex items-center space-x-1 text-[0.6rem] sm:text-xs opacity-90">
                        <Clock className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                        <span className="truncate">{formatLockPeriod(pool.lockPeriod)}</span>
                        {pool.userBalance > 0n && (
                          <>
                            <span className="hidden sm:inline">—</span>
                            <span className={`hidden sm:inline ${getUnlockStatus(pool.id, pool.lockPeriod).color}`}>
                              {getUnlockStatus(pool.id, pool.lockPeriod).text}
                            </span>
                          </>
                        )}
                        <span className="hidden sm:inline">—</span>
                        <span className="hidden sm:inline">{formatNumber(pool.totalSupply)} staked</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 sm:space-x-12 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-base sm:text-xl font-bold">
                        {formatNumber(pool.userBalance)}
                      </div>
                      <div className="text-[0.6rem] sm:text-xs opacity-75">staked</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base sm:text-xl font-bold text-green-300">
                        {formatNumber(pool.userEarned, 2)}
                      </div>
                      <div className="text-[0.6rem] sm:text-xs opacity-75">rewards</div>
                    </div>
                    <Badge className="bg-white/20 text-white border-white/30 text-xs sm:text-sm px-2 sm:px-3 py-1">
                      {Number(pool.aprBps) / 100}% APR
                    </Badge>
                    {expandedPool === pool.id ? (
                      <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedPool === pool.id && (
                <Card className="rounded-t-none border-t-0 bg-gradient-to-r from-white-900/80 to-slate-800/80 backdrop-blur-sm">
                  <div className="p-2 sm:p-3 space-y-2">
                    {/* Navigation Tabs and Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex bg-black rounded-md p-0.5 w-full sm:w-1/2">
                        {['Stake', 'Unstake', 'Rewards'].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setTab(pool.id, tab)}
                            className={`flex-1 min-w-[60px] px-2 py-1 rounded text-[0.6rem] sm:text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                              activeTab[pool.id] === tab
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-1 sm:space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-red-900 text-white-400 hover:bg-red-500/10 text-[0.6rem] sm:text-xs h-7"
                          onClick={() => openEarlyWithdrawModal(pool.id)}
                          disabled={txPending || pool.userBalance === 0n}
                        >
                          {txPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Early Withdraw"}
                        </Button>
                      </div>
                    </div>

                    {/* Stake Tab Content */}
                    {activeTab[pool.id] === 'Stake' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 min-h-[175px]">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Amount to Stake</h4>

                          <div className="relative">
                            <input
                              type="number"
                              placeholder="0"
                              value={stakeAmount[pool.id] || ''}
                              onChange={(e) => handleStakeAmountChange(pool.id, e.target.value)}
                              className="w-full bg-black border border-slate-700 rounded-md p-2 text-sm sm:text-base text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-4 gap-1">
                            {[25, 50, 75, 100].map((percentage) => (
                              <button
                                key={percentage}
                                onClick={() => {
                                  const amount = (Number(formatEther(userTokenBalance)) * percentage / 100).toString();
                                  handleStakeAmountChange(pool.id, amount);
                                }}
                                className="py-1 px-1 sm:px-2 bg-black hover:bg-gray-600 rounded text-[0.6rem] sm:text-xs font-medium transition-colors"
                              >
                                {percentage === 100 ? 'Max' : `${percentage}%`}
                              </button>
                            ))}
                          </div>

                          <p className="text-[0.6rem] text-gray-400">
                            Balance: {formatNumber(userTokenBalance)} OEC
                          </p>

                          {allowance === 0n ? (
                            <Button
                              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-1.5 text-xs sm:text-sm font-semibold"
                              onClick={handleApprove}
                              disabled={txPending || !isConnected}
                            >
                              {txPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              Approve OEC
                            </Button>
                          ) : (
                            <Button
                              className="w-full bg-blue-600 hover:bg-blue-900 text-white py-1.5 text-xs sm:text-sm font-semibold"
                              onClick={() => handleStake(pool.id)}
                              disabled={txPending || !isConnected || !stakeAmount[pool.id]}
                            >
                              {txPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              Stake
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="bg-black rounded-md p-2 sm:p-2 space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-gray-400 text-[0.6rem] sm:text-xs">APR:</span>
                              <span className="font-semibold text-green-400 text-[0.6rem] sm:text-xs">{Number(pool.aprBps) / 100}%</span>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-gray-400 text-[0.6rem] sm:text-xs">Lock Period:</span>
                              <span className="font-semibold text-[0.6rem] sm:text-xs">{formatLockPeriod(pool.lockPeriod)}</span>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-gray-400 text-[0.6rem] sm:text-xs">Your Staked:</span>
                              <span className="font-semibold text-[0.6rem] sm:text-xs">{formatNumber(pool.userBalance)} OEC</span>
                            </div>
                          </div>

                          <div className="space-y-1 text-[0.6rem] sm:p-2 sm:text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Total Staked:</span>
                              <span>{formatNumber(pool.totalSupply)} OEC</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Your Earned:</span>
                              <span className="text-green-400">{formatNumber(pool.userEarned)} OEC</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Unstake Tab Content */}
                    {activeTab[pool.id] === 'Unstake' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 min-h-[175px]">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Amount to Unstake</h4>

                          <div className="relative">
                            <input
                              type="number"
                              placeholder="0"
                              value={stakeAmount[pool.id] || ''}
                              onChange={(e) => handleStakeAmountChange(pool.id, e.target.value)}
                              className="w-full bg-black border border-gray-600 rounded-md p-2 text-sm sm:text-base text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-4 gap-1">
                            {[25, 50, 75, 100].map((percentage) => (
                              <button
                                key={percentage}
                                onClick={() => {
                                  const amount = (Number(formatEther(pool.userBalance)) * percentage / 100).toString();
                                  handleStakeAmountChange(pool.id, amount);
                                }}
                                className="py-1 px-1 sm:px-2 bg-black hover:bg-gray-600 rounded text-[0.6rem] sm:text-xs font-medium transition-colors"
                              >
                                {percentage === 100 ? 'Max' : `${percentage}%`}
                              </button>
                            ))}
                          </div>

                          <p className="text-[0.6rem] text-gray-400">
                            Staked: {formatNumber(pool.userBalance)} OEC
                          </p>

                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-900 text-white py-1.5 text-xs sm:text-sm font-semibold"
                            onClick={() => handleWithdraw(pool.id)}
                            disabled={txPending || !isConnected || !stakeAmount[pool.id] || pool.userBalance === 0n}
                          >
                            {txPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Unstake
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="bg-black rounded-md p-2 sm:p-2 space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-gray-400 text-[0.6rem] sm:text-xs">Your Staked:</span>
                              <span className="font-semibold text-[0.6rem] sm:text-xs">{formatNumber(pool.userBalance)} OEC</span>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-gray-400 text-[0.6rem] sm:text-xs">Pending Rewards:</span>
                              <span className="font-semibold text-green-400 text-[0.6rem] sm:text-xs">{formatNumber(pool.userEarned)} OEC</span>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-gray-400 text-[0.6rem] sm:text-xs">Lock Period:</span>
                              <span className="font-semibold text-[0.6rem] sm:text-xs">{formatLockPeriod(pool.lockPeriod)}</span>
                            </div>
                          </div>
                          <p className="text-[0.6rem] text-yellow-400 p-2">
                            Note: Withdrawing before lock period ends will use Early Withdraw with 10% penalty.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rewards Tab Content */}
                    {activeTab[pool.id] === 'Rewards' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 min-h-[175px]">
                        <div className="space-y-2 flex flex-col justify-center">
                          <div className="text-center space-y-3 mt-4">
                            <div className="text-2xl sm:text-4xl font-bold text-green-400">
                              {formatNumber(pool.userEarned)}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-400">OEC</div>
                            <div className="text-[0.6rem] sm:text-xs text-gray-500">Available Rewards</div>

                            <Button
                              className="w-full bg-green-600 hover:bg-green-900 text-white py-1.5 text-xs sm:text-sm font-semibold"
                              onClick={() => handleClaimRewards(pool.id)}
                              disabled={txPending || !isConnected || pool.userEarned === 0n}
                            >
                              {txPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              Claim Rewards
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="bg-black rounded-md p-2 sm:p-2 space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-gray-400 text-[0.6rem] sm:text-xs">Your Staked:</span>
                              <span className="font-semibold text-[0.6rem] sm:text-xs">{formatNumber(pool.userBalance)} OEC</span>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-gray-400 text-[0.6rem] sm:text-xs">APR:</span>
                              <span className="font-semibold text-green-400 text-[0.6rem] sm:text-xs">{Number(pool.aprBps) / 100}%</span>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-gray-400 text-[0.6rem] sm:text-xs">Reward Token:</span>
                              <span className="font-semibold text-[0.6rem] sm:text-xs">OEC</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          ))}
        </div>

        {/* Pool Statistics */}
        <Card className="crypto-card p-2 sm:p-3 border bg-card/80">
          <h3 className="text-sm sm:text-base font-semibold mb-2 flex items-center">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-crypto-green" />
            Pool Statistics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="text-center">
              <div className="text-base sm:text-lg font-bold text-crypto-blue">
                {formatNumber(pools.reduce((sum, pool) => sum + pool.totalSupply, 0n))} OEC
              </div>
              <div className="text-[0.6rem] sm:text-xs text-gray-400">Total Value Locked</div>
            </div>
            <div className="text-center">
              <div className="text-base sm:text-lg font-bold text-crypto-green">
                {pools.length}
              </div>
              <div className="text-[0.6rem] sm:text-xs text-gray-400">Active Pools</div>
            </div>
            <div className="text-center">
              <div className="text-base sm:text-lg font-bold text-purple-400">
                {pools.length > 0 ? Math.max(...pools.map(pool => Number(pool.aprBps) / 100)) : 0}%
              </div>
              <div className="text-[0.6rem] sm:text-xs text-gray-400">Highest APR</div>
            </div>
          </div>
        </Card>

        {/* Contract Info */}
        <Card className="crypto-card p-2 sm:p-3 border bg-card/50">
          <h3 className="text-xs font-semibold mb-2">Contract Addresses (Sepolia)</h3>
          <div className="space-y-1 text-[0.6rem] font-mono">
            <div className="flex justify-between">
              <span className="text-gray-400">Staking:</span>
              <a
                href={`https://sepolia.etherscan.io/address/${STAKING_CONTRACT}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {STAKING_CONTRACT}
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">OEC Token:</span>
              <a
                href={`https://sepolia.etherscan.io/address/${OEC_TOKEN}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {OEC_TOKEN}
              </a>
            </div>
          </div>
        </Card>
      </div>

      {/* Early Withdraw Confirmation Modal */}
      <EarlyWithdrawModal
        isOpen={earlyWithdrawModal.isOpen}
        onClose={() => setEarlyWithdrawModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleEarlyWithdrawConfirm}
        amount={earlyWithdrawModal.amount}
        penaltyBps={earlyWithdrawModal.penaltyBps}
        poolName={earlyWithdrawModal.poolName}
      />
    </Layout>
  );
}
