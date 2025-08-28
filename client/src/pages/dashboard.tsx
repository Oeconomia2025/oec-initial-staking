import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Activity
} from "lucide-react";
import { WalletConnect } from "@/components/wallet-connect";
import { WalletSetupGuide } from "@/components/wallet-setup-guide";
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
    category: "Beginner"
  },
  {
    id: 2,
    title: "Diamond Hands",
    description: "Hold staked tokens for 30 days",
    icon: Crown,
    completed: false,
    progress: 0,
    reward: "50 OEC",
    category: "Loyalty"
  },
  {
    id: 3,
    title: "Pool Pioneer",
    description: "Stake in 3 different pools",
    icon: Trophy,
    completed: false,
    progress: 0,
    reward: "100 OEC",
    category: "Explorer"
  },
  {
    id: 4,
    title: "High Roller",
    description: "Stake over 10,000 OEC tokens",
    icon: Medal,
    completed: false,
    progress: 0,
    reward: "500 OEC",
    category: "Whale"
  },
  {
    id: 5,
    title: "Compound Master",
    description: "Compound rewards 10 times",
    icon: Zap,
    completed: false,
    progress: 0,
    reward: "200 OEC",
    category: "Strategy"
  },
  {
    id: 6,
    title: "Long-term Vision",
    description: "Keep tokens staked for 90 days",
    icon: Target,
    completed: false,
    progress: 0,
    reward: "1000 OEC",
    category: "Dedication"
  }
];

// Mock user stats
const mockUserStats = {
  totalStaked: 0,
  totalRewards: 0,
  activePools: 0,
  stakingDays: 0,
  totalValue: 0,
  monthlyReturn: 0
};

export default function Dashboard() {
  const { isConnected } = useAccount();
  
  if (!isConnected) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          <div className="text-center space-y-4">

          </div>
          <WalletConnect />
          <WalletSetupGuide />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 space-y-8">

        {/* User Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUserStats.totalStaked.toLocaleString()} OEC</div>
              <p className="text-xs text-muted-foreground">
                ${(mockUserStats.totalStaked * 0.85).toLocaleString()} USD
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUserStats.totalRewards} OEC</div>
              <p className="text-xs text-muted-foreground">
                +{mockUserStats.monthlyReturn}% this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Pools</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUserStats.activePools}</div>
              <p className="text-xs text-muted-foreground">
                Earning rewards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staking Days</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUserStats.stakingDays}</div>
              <p className="text-xs text-muted-foreground">
                Keep going!
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
              Unlock rewards by completing staking milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockAchievements.map((achievement) => (
                <Card key={achievement.id} className={`relative ${achievement.completed ? 'border-green-500/20 bg-green-500/5' : 'border-muted'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <achievement.icon className={`w-5 h-5 ${achievement.completed ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <Badge variant={achievement.completed ? "default" : "secondary"} className="text-xs">
                          {achievement.category}
                        </Badge>
                      </div>
                      {achievement.completed && (
                        <Badge variant="outline" className="text-green-500 border-green-500">
                          Complete
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{achievement.progress}%</span>
                      </div>
                      <Progress value={achievement.progress} className="h-2" />
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Reward:</span>
                        <span className="font-medium text-blue-500">{achievement.reward}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}