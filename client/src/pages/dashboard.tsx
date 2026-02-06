import { useState, useEffect } from "react";
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
} from "lucide-react";
import { WalletConnect } from "@/components/wallet-connect";
import { OECLoader } from "@/components/oec-loader";
import { useAccount, usePublicClient, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatEther } from "viem";
import MultiPoolStakingAPRABI from "@/services/abis/MultiPoolStakingAPR.json";
import ERC20ABI from "@/services/abis/ERC20.json";

// Contract addresses on Sepolia
const STAKING_CONTRACT = "0x4a4da37c9a9f421efe3feb527fc16802ce756ec3";
const OEC_TOKEN = "0x2b2fb8df4ac5d394f0d5674d7a54802e42a06aba";

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
  const { switchChain } = useSwitchChain();

  // Check if on correct network - must be defined AND be sepolia
  const isCorrectNetwork = Boolean(chain && chain.id === sepolia.id);

  const [initialLoading, setInitialLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    walletBalance: 0n,
    totalStaked: 0n,
    totalEarned: 0n,
    activePools: 0,
    poolStakes: [],
  });

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

  // Calculate achievements based on real data
  const achievements = [
    {
      id: 1,
      title: "First Stake",
      description: "Complete your first staking transaction",
      icon: Star,
      completed: stats.totalStaked > 0n,
      progress: stats.totalStaked > 0n ? 100 : 0,
      reward: "5 OEC",
      category: "Beginner",
    },
    {
      id: 2,
      title: "Diamond Hands",
      description: "Hold staked tokens for 30 days",
      icon: Crown,
      completed: false,
      progress: 0,
      reward: "50 OEC",
      category: "Loyalty",
    },
    {
      id: 3,
      title: "Pool Pioneer",
      description: "Stake in 3 different pools",
      icon: Trophy,
      completed: stats.activePools >= 3,
      progress: Math.min((stats.activePools / 3) * 100, 100),
      reward: "100 OEC",
      category: "Explorer",
    },
    {
      id: 4,
      title: "High Roller",
      description: "Stake over 10,000 OEC tokens",
      icon: Medal,
      completed: Number(formatEther(stats.totalStaked)) >= 10000,
      progress: Math.min((Number(formatEther(stats.totalStaked)) / 10000) * 100, 100),
      reward: "500 OEC",
      category: "Whale",
    },
    {
      id: 5,
      title: "Reward Hunter",
      description: "Earn 100 OEC in rewards",
      icon: Zap,
      completed: Number(formatEther(stats.totalEarned)) >= 100,
      progress: Math.min((Number(formatEther(stats.totalEarned)) / 100) * 100, 100),
      reward: "200 OEC",
      category: "Strategy",
    },
    {
      id: 6,
      title: "Hodler",
      description: "Have 100,000+ OEC total (wallet + staked)",
      icon: Target,
      completed: Number(formatEther(stats.walletBalance + stats.totalStaked)) >= 100000,
      progress: Math.min((Number(formatEther(stats.walletBalance + stats.totalStaked)) / 100000) * 100, 100),
      reward: "1000 OEC",
      category: "Dedication",
    },
  ];

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
                <div className="text-2xl font-bold">
                  {isConnected ? formatNumber(stats.walletBalance) : "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isConnected ? "Available to stake" : "Connect wallet to see balance"}
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
                <div className="text-2xl font-bold">
                  {isConnected ? formatNumber(stats.totalStaked) : "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isConnected ? "Across all pools" : "Connect wallet to see staked amount"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500/10 to-pink-600/10 border border-purple-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  OEC Pending Rewards
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  {isConnected ? formatNumber(stats.totalEarned, 2) : "0.00"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isConnected ? "Available to claim" : "Connect wallet to see rewards"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-600/10 to-purple-800/10 border border-purple-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  OEC Active Pools
                </CardTitle>
                <Activity className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isConnected ? stats.activePools : "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isConnected ? "Earning rewards" : "Connect wallet to see active pools"}
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
                <div className="text-2xl font-bold">
                  {isConnected ? formatNumber(stats.walletBalance + stats.totalStaked) : "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isConnected ? "Wallet + Staked" : "Connect wallet to see holdings"}
                </p>
              </CardContent>
            </Card>
          </div>

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
                        className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border"
                      >
                        <div>
                          <h4 className="font-medium">Pool {pool.poolId}</h4>
                          <p className="text-xs text-gray-400">
                            {Number(pool.aprBps) / 100}% APR • {formatLockPeriod(pool.lockPeriod)} lock
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatNumber(pool.staked)}</p>
                          <p className="text-xs text-green-400">
                            +{formatNumber(pool.earned, 2)} earned
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Pool Achievements</span>
              </CardTitle>
              <CardDescription>
                {isConnected
                  ? `${achievements.filter(a => a.completed).length}/${achievements.length} completed`
                  : "Connect your wallet to track achievements"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <Card
                    key={achievement.id}
                    className={`relative ${
                      achievement.completed
                        ? "border-green-500/20 bg-green-500/5"
                        : "border-muted"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <achievement.icon
                            className={`w-5 h-5 ${
                              achievement.completed
                                ? "text-green-500"
                                : "text-muted-foreground"
                            }`}
                          />
                          <Badge
                            variant={
                              achievement.completed ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {achievement.category}
                          </Badge>
                        </div>
                        {achievement.completed && (
                          <Badge
                            variant="outline"
                            className="text-green-500 border-green-500"
                          >
                            Complete
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
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>
                            {isConnected ? `${Math.round(achievement.progress)}%` : "0%"}
                          </span>
                        </div>
                        <Progress
                          value={isConnected ? achievement.progress : 0}
                          className="h-2"
                        />
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Reward:</span>
                          <span className="font-medium text-blue-500">
                            {achievement.reward}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contract Info */}
          <Card className="crypto-card p-3 border bg-card/50">
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
