import { useState } from "react";
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
} from "lucide-react";
import { WalletConnect } from "@/components/wallet-connect";
import { useAccount } from "wagmi";

// Mock user achievements data
const mockAchievements = [
  {
    id: 1,
    title: "First Stake",
    description: "Complete your first staking transaction",
    icon: Star,
    completed: false,
    progress: 0,
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
    completed: false,
    progress: 0,
    reward: "100 OEC",
    category: "Explorer",
  },
  {
    id: 4,
    title: "High Roller",
    description: "Stake over 10,000 OEC tokens",
    icon: Medal,
    completed: false,
    progress: 0,
    reward: "500 OEC",
    category: "Whale",
  },
  {
    id: 5,
    title: "Compound Master",
    description: "Compound rewards 10 times",
    icon: Zap,
    completed: false,
    progress: 0,
    reward: "200 OEC",
    category: "Strategy",
  },
  {
    id: 6,
    title: "Long-term Vision",
    description: "Keep tokens staked for 90 days",
    icon: Target,
    completed: false,
    progress: 0,
    reward: "1000 OEC",
    category: "Dedication",
  },
];

// Mock user stats
const mockUserStats = {
  totalStaked: 0,
  totalRewards: 0,
  activePools: 0,
  stakingDays: 0,
  totalValue: 0,
  monthlyReturn: 0,
};

export default function Dashboard() {
  const { isConnected } = useAccount();

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
        
        <div className="space-y-8">
          {/* User Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
            <Card className="bg-black">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Wallet Balance
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isConnected ? mockUserStats.totalStaked.toLocaleString() : "0"} OEC
                </div>
                <p className="text-xs text-muted-foreground">
                  {isConnected ? `$${(mockUserStats.totalStaked * 0.85).toLocaleString()} USD` : "Connect wallet to see balance"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Your Total Staked
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isConnected ? mockUserStats.totalStaked.toLocaleString() : "0"} OEC
                </div>
                <p className="text-xs text-muted-foreground">
                  {isConnected ? `$${(mockUserStats.totalStaked * 0.85).toLocaleString()} USD` : "Connect wallet to see staked amount"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Rewards
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isConnected ? mockUserStats.totalRewards : "0"} OEC
                </div>
                <p className="text-xs text-muted-foreground">
                  {isConnected ? `+${mockUserStats.monthlyReturn}% this month` : "Connect wallet to see rewards"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Pools
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isConnected ? mockUserStats.activePools : "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isConnected ? "Earning rewards" : "Connect wallet to see active pools"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Staking Days
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isConnected ? mockUserStats.stakingDays : "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isConnected ? "Keep going!" : "Connect wallet to see staking days"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Achievements Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Pool Achievements</span>
              </CardTitle>
              <CardDescription>
                {isConnected 
                  ? "Unlock rewards by completing staking milestones" 
                  : "Connect your wallet to track achievements"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockAchievements.map((achievement) => (
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
                            {isConnected ? `${achievement.progress}%` : "0%"}
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
        </div>
      </div>
    </Layout>
  );
}
