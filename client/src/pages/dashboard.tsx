import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Award,
  Star,
  Crown,
  Zap,
  Target,
  Medal,
  Flame,
  TrendingUp,
  DollarSign,
  Clock,
  Activity,
  Wallet,
  Loader2,
  ExternalLink,
  Gift,
  CheckCircle,
} from "lucide-react";
import { WalletConnect } from "@/components/wallet-connect";
import { OECLoader } from "@/components/oec-loader";
import { useAccount, usePublicClient, useWalletClient, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatEther, formatUnits } from "viem";
import MultiPoolStakingAPRABI from "@/services/abis/MultiPoolStakingAPR.json";
import ERC20ABI from "@/services/abis/ERC20.json";
import AchievementRewardsABI from "@/services/abis/AchievementRewards.json";

// Contract addresses on Sepolia
const STAKING_CONTRACT = "0xd12664c1f09fa1561b5f952259d1eb5555af3265";
const OEC_TOKEN = "0x00904218319a045a96d776ec6a970f54741208e6";
const ACHIEVEMENT_CONTRACT = "0xbb0805254d328d1a542efb197b3a922c3fd97063";
const ELOQURA_FACTORY = "0x1a4C7849Dd8f62AefA082360b3A8D857952B3b8e";
const USDC_TOKEN = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

// Minimal ABIs for Eloqura DEX price fetch
const FACTORY_ABI = [
  {
    type: "function",
    name: "getPair",
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" },
    ],
    outputs: [{ name: "pair", type: "address" }],
    stateMutability: "view",
  },
] as const;

const PAIR_ABI = [
  {
    type: "function",
    name: "getReserves",
    inputs: [],
    outputs: [
      { name: "reserve0", type: "uint112" },
      { name: "reserve1", type: "uint112" },
      { name: "blockTimestampLast", type: "uint32" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "token0",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
] as const;

interface PoolStake {
  poolId: number;
  staked: bigint;
  earned: bigint;
  aprBps: bigint;
  lockPeriod: bigint;
}

interface UserStats {
  walletBalance: bigint;
  totalStaked: bigint;
  totalEarned: bigint;
  activePools: number;
  poolStakes: PoolStake[];
}

export default function Dashboard() {
  const { isConnected, address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();

  // Check if on correct network - must be defined AND be sepolia
  const isCorrectNetwork = Boolean(chain && chain.id === sepolia.id);

  const [tokenPrice, setTokenPrice] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    walletBalance: 0n,
    totalStaked: 0n,
    totalEarned: 0n,
    activePools: 0,
    poolStakes: [],
  });

  // Achievement on-chain state
  const [achievementEligible, setAchievementEligible] = useState<boolean[]>([false, false, false, false, false, false]);
  const [achievementClaimed, setAchievementClaimed] = useState<boolean[]>([false, false, false, false, false, false]);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [claimingAll, setClaimingAll] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<number | null>(null);

  // Fetch achievement status from contract
  const fetchAchievementStatus = useCallback(async () => {
    if (!publicClient || !address) return;
    try {
      const result = await publicClient.readContract({
        address: ACHIEVEMENT_CONTRACT,
        abi: AchievementRewardsABI,
        functionName: "getUserStatus",
        args: [address],
      }) as [boolean[], boolean[]];
      setAchievementEligible([...result[0]]);
      setAchievementClaimed([...result[1]]);
    } catch (error) {
      console.error("Error fetching achievement status:", error);
    }
  }, [publicClient, address]);

  useEffect(() => {
    fetchAchievementStatus();
    const interval = setInterval(fetchAchievementStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchAchievementStatus]);

  // Claim a single achievement
  const handleClaim = async (achievementId: number) => {
    if (!walletClient || !publicClient || !address) return;
    setClaimingId(achievementId);
    try {
      const hash = await walletClient.writeContract({
        address: ACHIEVEMENT_CONTRACT,
        abi: AchievementRewardsABI,
        functionName: "claim",
        args: [BigInt(achievementId)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setClaimSuccess(achievementId);
      setTimeout(() => setClaimSuccess(null), 3000);
      await fetchAchievementStatus();
    } catch (error: any) {
      console.error("Claim failed:", error);
    } finally {
      setClaimingId(null);
    }
  };

  // Claim all eligible achievements
  const handleClaimAll = async () => {
    if (!walletClient || !publicClient || !address) return;
    setClaimingAll(true);
    try {
      const hash = await walletClient.writeContract({
        address: ACHIEVEMENT_CONTRACT,
        abi: AchievementRewardsABI,
        functionName: "claimAll",
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setClaimSuccess(-1); // -1 = claimed all
      setTimeout(() => setClaimSuccess(null), 3000);
      await fetchAchievementStatus();
    } catch (error: any) {
      console.error("Claim all failed:", error);
    } finally {
      setClaimingAll(false);
    }
  };

  // Fetch user data from contracts
  useEffect(() => {
    const fetchUserData = async (isInitial = false) => {
      if (!publicClient || !address) {
        setInitialLoading(false);
        return;
      }

      try {

        // Fetch wallet balance
        const walletBalance = await publicClient.readContract({
          address: OEC_TOKEN,
          abi: ERC20ABI,
          functionName: "balanceOf",
          args: [address],
        }) as bigint;

        // Fetch pool count
        const poolCount = await publicClient.readContract({
          address: STAKING_CONTRACT,
          abi: MultiPoolStakingAPRABI,
          functionName: "poolCount",
        }) as bigint;

        // Fetch user stakes in each pool
        const poolStakes: PoolStake[] = [];
        let totalStaked = 0n;
        let totalEarned = 0n;
        let activePools = 0;

        for (let i = 0; i < Number(poolCount); i++) {
          const poolInfo = await publicClient.readContract({
            address: STAKING_CONTRACT,
            abi: MultiPoolStakingAPRABI,
            functionName: "getPoolInfo",
            args: [BigInt(i)],
          }) as [string, string, bigint, bigint, bigint, bigint, bigint];

          const staked = await publicClient.readContract({
            address: STAKING_CONTRACT,
            abi: MultiPoolStakingAPRABI,
            functionName: "balanceOf",
            args: [BigInt(i), address],
          }) as bigint;

          const earned = await publicClient.readContract({
            address: STAKING_CONTRACT,
            abi: MultiPoolStakingAPRABI,
            functionName: "earned",
            args: [BigInt(i), address],
          }) as bigint;

          poolStakes.push({
            poolId: i,
            staked,
            earned,
            aprBps: poolInfo[2],
            lockPeriod: poolInfo[3],
          });

          totalStaked += staked;
          totalEarned += earned;
          if (staked > 0n) activePools++;
        }

        setStats({
          walletBalance,
          totalStaked,
          totalEarned,
          activePools,
          poolStakes,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserData(true);

    // Refresh every 30 seconds (silently, no loading state)
    const interval = setInterval(() => fetchUserData(false), 30000);
    return () => clearInterval(interval);
  }, [publicClient, address]);

  // Fetch OEC price from Eloqura DEX OEC/USDC pool
  useEffect(() => {
    const fetchTokenPrice = async () => {
      if (!publicClient) return;
      try {
        const pairAddress = await publicClient.readContract({
          address: ELOQURA_FACTORY as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: "getPair",
          args: [OEC_TOKEN as `0x${string}`, USDC_TOKEN as `0x${string}`],
        }) as `0x${string}`;
        if (!pairAddress || pairAddress === "0x0000000000000000000000000000000000000000") return;
        const [reserves, token0] = await Promise.all([
          publicClient.readContract({ address: pairAddress, abi: PAIR_ABI, functionName: "getReserves" }) as Promise<[bigint, bigint, number]>,
          publicClient.readContract({ address: pairAddress, abi: PAIR_ABI, functionName: "token0" }) as Promise<`0x${string}`>,
        ]);
        const isOecToken0 = token0.toLowerCase() === OEC_TOKEN.toLowerCase();
        const oecReserve = parseFloat(formatUnits(isOecToken0 ? reserves[0] : reserves[1], 18));
        const usdcReserve = parseFloat(formatUnits(isOecToken0 ? reserves[1] : reserves[0], 6));
        if (oecReserve > 0) setTokenPrice(usdcReserve / oecReserve);
      } catch (error) {
        console.error("Error fetching OEC price:", error);
      }
    };
    fetchTokenPrice();
    const interval = setInterval(fetchTokenPrice, 60000);
    return () => clearInterval(interval);
  }, [publicClient]);

  const formatDollar = (oecAmount: bigint) => {
    const usd = Number(formatEther(oecAmount)) * tokenPrice;
    return usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatNumber = (num: bigint, decimals = 0) => {
    const n = Number(formatEther(num));
    return n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const formatLockPeriod = (seconds: bigint) => {
    const s = Number(seconds);
    if (s === 0) return "Flexible";
    if (s < 3600) return `${s}s`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  // Achievement definitions — eligibility is checked on-chain by the AchievementRewards contract
  // IDs match the contract: 0-5
  const achievements = [
    {
      id: 0,
      title: "First Stake",
      description: "Complete your first staking transaction",
      icon: Star,
      eligible: achievementEligible[0],
      claimed: achievementClaimed[0],
      reward: "5 OEC",
      category: "Beginner",
    },
    {
      id: 1,
      title: "Diamond Hands",
      description: "Hold staked tokens in a 30-day+ pool for 30 days",
      icon: Crown,
      eligible: achievementEligible[1],
      claimed: achievementClaimed[1],
      reward: "50 OEC",
      category: "Loyalty",
    },
    {
      id: 2,
      title: "Pool Explorer",
      description: "Stake 100+ OEC each in 2 different long-term pools",
      icon: Trophy,
      eligible: achievementEligible[2],
      claimed: achievementClaimed[2],
      reward: "100 OEC",
      category: "Explorer",
    },
    {
      id: 3,
      title: "High Roller",
      description: "Stake 10,000+ OEC across 30-day+ pools",
      icon: Medal,
      eligible: achievementEligible[3],
      claimed: achievementClaimed[3],
      reward: "500 OEC",
      category: "Whale",
    },
    {
      id: 4,
      title: "Reward Hunter",
      description: "Earn 100+ OEC in staking rewards",
      icon: Zap,
      eligible: achievementEligible[4],
      claimed: achievementClaimed[4],
      reward: "200 OEC",
      category: "Strategy",
    },
    {
      id: 5,
      title: "Hodler",
      description: "Stake 2,000+ OEC in a long-term pool",
      icon: Target,
      eligible: achievementEligible[5],
      claimed: achievementClaimed[5],
      reward: "1,000 OEC",
      category: "Dedication",
    },
  ];

  const claimableCount = achievements.filter(a => a.eligible && !a.claimed).length;

  if (initialLoading && isConnected) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <OECLoader size="lg" text="Loading dashboard..." />
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
                  <p className="text-xs font-medium">Connect your wallet for personalized dashboard</p>
                  <p className="text-[0.6rem] text-gray-400">Connect to see your staking data and achievements</p>
                </div>
              </div>
              <div className="max-w-xs">
                <WalletConnect />
              </div>
            </div>
          </Card>
        )}

        {/* Wrong Network Warning */}
        {isConnected && address && !isCorrectNetwork && (
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

        {/* Connected Wallet Info */}
        {isConnected && address && isCorrectNetwork && (
          <Card className="crypto-card p-3 border mb-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-xs font-medium">Connected to Sepolia</p>
                  <p className="text-[0.6rem] text-gray-400 font-mono">{address}</p>
                </div>
              </div>
              <a
                href={`https://sepolia.etherscan.io/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center text-xs"
              >
                View on Etherscan
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </Card>
        )}

        <div className="space-y-8">
          {/* User Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
            <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  OEC Wallet Balance
                </CardTitle>
                <DollarSign className="h-4 w-4 text-cyan-400" />
              </CardHeader>
              <CardContent>
                {isConnected && tokenPrice > 0 && (
                  <div className="text-sm font-semibold text-cyan-400 mb-0.5">
                    ${formatDollar(stats.walletBalance)}
                  </div>
                )}
                <div className="text-2xl font-bold">
                  {isConnected ? formatNumber(stats.walletBalance) : "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available to stake
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-cyan-500/10 to-teal-600/10 border border-cyan-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  OEC Total Staked
                </CardTitle>
                <DollarSign className="h-4 w-4 text-cyan-400" />
              </CardHeader>
              <CardContent>
                {isConnected && tokenPrice > 0 && (
                  <div className="text-sm font-semibold text-cyan-400 mb-0.5">
                    ${formatDollar(stats.totalStaked)}
                  </div>
                )}
                <div className="text-2xl font-bold">
                  {isConnected ? formatNumber(stats.totalStaked) : "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all pools
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500/10 to-pink-600/10 border border-purple-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Rewards
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                {isConnected && tokenPrice > 0 && (
                  <div className="text-sm font-semibold text-green-400 mb-0.5">
                    ${formatDollar(stats.totalEarned)}
                  </div>
                )}
                <div className="text-2xl font-bold text-green-400">
                  {isConnected ? formatNumber(stats.totalEarned, 2) : "0.00"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available to claim
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-600/10 to-purple-800/10 border border-purple-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Pools
                </CardTitle>
                <Activity className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                {isConnected && tokenPrice > 0 && (
                  <div className="text-sm mb-0.5">&nbsp;</div>
                )}
                <div className="text-2xl font-bold">
                  {isConnected ? stats.activePools : "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Earning rewards
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  OEC Total Holdings
                </CardTitle>
                <Clock className="h-4 w-4 text-cyan-400" />
              </CardHeader>
              <CardContent>
                {isConnected && tokenPrice > 0 && (
                  <div className="text-sm font-semibold text-cyan-400 mb-0.5">
                    ${formatDollar(stats.walletBalance + stats.totalStaked)}
                  </div>
                )}
                <div className="text-2xl font-bold">
                  {isConnected ? formatNumber(stats.walletBalance + stats.totalStaked) : "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Wallet + Staked
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Achievements Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>Pool Achievements</span>
                  </CardTitle>
                  <CardDescription>
                    {isConnected
                      ? `${achievements.filter(a => a.claimed).length}/${achievements.length} claimed`
                      : "Connect your wallet to track achievements"}
                  </CardDescription>
                </div>
                {isConnected && claimableCount > 1 && (
                  <Button
                    onClick={handleClaimAll}
                    disabled={claimingAll || claimingId !== null}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold"
                  >
                    {claimingAll ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Claiming...</>
                    ) : claimSuccess === -1 ? (
                      <><CheckCircle className="w-4 h-4 mr-2" /> Claimed!</>
                    ) : (
                      <><Gift className="w-4 h-4 mr-2" /> Claim All ({claimableCount})</>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => {
                  const canClaim = achievement.eligible && !achievement.claimed;
                  const isClaiming = claimingId === achievement.id;
                  const justClaimed = claimSuccess === achievement.id;

                  return (
                    <Card
                      key={achievement.id}
                      className={`relative ${
                        achievement.claimed
                          ? "border-green-500/20 bg-green-500/5"
                          : canClaim
                          ? "border-yellow-500/30 bg-yellow-500/5"
                          : "border-muted"
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <achievement.icon
                              className={`w-5 h-5 ${
                                achievement.claimed
                                  ? "text-green-500"
                                  : canClaim
                                  ? "text-yellow-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <Badge
                              variant={
                                achievement.claimed ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {achievement.category}
                            </Badge>
                          </div>
                          {achievement.claimed && (
                            <Badge
                              variant="outline"
                              className="text-green-500 border-green-500"
                            >
                              Claimed
                            </Badge>
                          )}
                          {canClaim && !achievement.claimed && (
                            <Badge
                              variant="outline"
                              className="text-yellow-500 border-yellow-500 animate-pulse"
                            >
                              Ready!
                            </Badge>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{achievement.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {achievement.description}
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Reward:</span>
                            <span className="font-medium text-blue-500">
                              {achievement.reward}
                            </span>
                          </div>
                          {isConnected && canClaim && (
                            <Button
                              onClick={() => handleClaim(achievement.id)}
                              disabled={isClaiming || claimingAll}
                              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold"
                              size="sm"
                            >
                              {isClaiming ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Claiming...</>
                              ) : justClaimed ? (
                                <><CheckCircle className="w-4 h-4 mr-2" /> Claimed!</>
                              ) : (
                                <><Gift className="w-4 h-4 mr-2" /> Claim {achievement.reward}</>
                              )}
                            </Button>
                          )}
                          {isConnected && achievement.claimed && (
                            <div className="flex items-center justify-center text-sm text-green-500 py-1">
                              <CheckCircle className="w-4 h-4 mr-1" /> Reward collected
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Active Stakes Section */}
          {isConnected && stats.poolStakes.some(p => p.staked > 0n) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  <span>Your Active Stakes</span>
                </CardTitle>
                <CardDescription>
                  Overview of your staking positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.poolStakes
                    .filter(p => p.staked > 0n)
                    .map((pool) => (
                      <div
                        key={pool.poolId}
                        className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800"
                      >
                        <div>
                          <h4 className="font-medium">Pool {pool.poolId}</h4>
                          <p className="text-xs text-gray-400">
                            {Number(pool.aprBps) / 100}% APR • {formatLockPeriod(pool.lockPeriod)} lock
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatNumber(pool.staked)}</p>
                          {tokenPrice > 0 && (
                            <p className="text-xs text-cyan-400">${formatDollar(pool.staked)}</p>
                          )}
                          <p className="text-xs text-green-400">
                            +{formatNumber(pool.earned, 2)} earned
                            {tokenPrice > 0 && ` ($${formatDollar(pool.earned)})`}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contract Info */}
          <Card className="crypto-card p-3 border bg-gray-900/50">
            <h3 className="text-xs font-semibold mb-2">Contract Addresses (Sepolia Testnet)</h3>
            <div className="space-y-1 text-[0.6rem] font-mono">
              <div className="flex justify-between">
                <span className="text-gray-400">Staking Contract:</span>
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
                <span className="text-gray-400">Achievement Rewards:</span>
                <a
                  href={`https://sepolia.etherscan.io/address/${ACHIEVEMENT_CONTRACT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  {ACHIEVEMENT_CONTRACT}
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
      </div>
    </Layout>
  );
}
