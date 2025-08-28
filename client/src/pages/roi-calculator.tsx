import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calculator,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Wallet
} from "lucide-react";
import { WalletConnect } from "@/components/wallet-connect";
import { WalletSetupGuide } from "@/components/wallet-setup-guide";
import { useAccount } from "wagmi";

// Mock data - matches original staking page design
const mockStakingPools = [
  { id: 1, name: "Flexible Staking", lockPeriod: "Flexible", apy: 12.5 },
  { id: 2, name: "30-Day Lock", lockPeriod: "30 Days", apy: 18.0 },
  { id: 3, name: "60-Day Lock", lockPeriod: "60 Days", apy: 22.5 },
  { id: 4, name: "90-Day Lock", lockPeriod: "90 Days", apy: 28.0 }
];

export default function ROICalculator() {
  const { isConnected } = useAccount();
  const [isROIExpanded, setIsROIExpanded] = useState(true);
  const [calcAmount, setCalcAmount] = useState("1000");
  const [calcDays, setCalcDays] = useState("365");
  const [selectedPool, setSelectedPool] = useState(mockStakingPools[0]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const calculateROI = () => {
    const principal = parseFloat(calcAmount) || 0;
    const days = parseFloat(calcDays) || 0;
    const apy = selectedPool.apy / 100;
    const years = days / 365;
    
    const totalRewards = principal * apy * years;
    const totalValue = principal + totalRewards;
    const roi = totalRewards > 0 ? (totalRewards / principal) * 100 : 0;
    const dailyRewards = totalRewards / days;
    const monthlyRewards = totalRewards / (days / 30);
    
    return {
      principal,
      totalRewards,
      totalValue,
      roi,
      dailyRewards,
      monthlyRewards
    };
  };

  const roiData = calculateROI();

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Interactive ROI Calculator
          </h1>
          <p className="text-xl text-muted-foreground">
            Calculate your potential staking rewards and optimize your strategy
          </p>
        </div>

        {/* Wallet Connection Notice */}
        {!isConnected && (
          <Card className="crypto-card p-4 border mb-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wallet className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-sm font-medium">Connect your wallet to start staking</p>
                  <p className="text-xs text-gray-400">Calculator works without connection, but you'll need a wallet to stake</p>
                </div>
              </div>
              <div className="max-w-xs">
                <WalletConnect />
              </div>
            </div>
          </Card>
        )}

        {/* ROI Calculator Section - Collapsible like original */}
        <Card className={`crypto-card p-6 border mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 ${!isROIExpanded ? 'pb-4' : ''}`}>
          <div 
            className={`flex items-center justify-between cursor-pointer hover:bg-white/5 rounded-lg p-2 -m-2 transition-all duration-200 ${isROIExpanded ? 'mb-6' : 'mb-0'}`}
            onClick={() => setIsROIExpanded(!isROIExpanded)}
          >
            <div className="flex items-center space-x-2">
              <Calculator className="w-6 h-6 text-crypto-blue" />
              <h2 className="text-xl font-semibold">Interactive ROI Calculator</h2>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="p-2 h-auto border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all duration-200"
            >
              {isROIExpanded ? (
                <ChevronUp className="w-6 h-6 text-white" />
              ) : (
                <ChevronDown className="w-6 h-6 text-white" />
              )}
            </Button>
          </div>
          
          {isROIExpanded && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calculator Controls */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="calc-amount" className="text-sm font-medium mb-2 block">
                  Stake Amount (OEC)
                </Label>
                <Input
                  id="calc-amount"
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  placeholder="Enter amount to stake"
                  className="bg-black/30 border-white/20"
                />
              </div>
              
              <div>
                <Label htmlFor="calc-days" className="text-sm font-medium mb-2 block">
                  Staking Period (Days)
                </Label>
                <Input
                  id="calc-days"
                  type="number"
                  value={calcDays}
                  onChange={(e) => setCalcDays(e.target.value)}
                  placeholder="Enter staking period"
                  className="bg-black/30 border-white/20"
                />
                <div className="flex gap-2 mt-2">
                  {[30, 90, 180, 365].map((days) => (
                    <Button
                      key={days}
                      variant="outline"
                      size="sm"
                      onClick={() => setCalcDays(days.toString())}
                      className="text-xs bg-black/20 border-white/20 hover:bg-white/10"
                    >
                      {days}d
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Select Pool
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {mockStakingPools.map((pool) => (
                    <Button
                      key={pool.id}
                      variant={selectedPool.id === pool.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPool(pool)}
                      className={`text-xs ${
                        selectedPool.id === pool.id
                          ? 'bg-crypto-blue hover:bg-crypto-blue/80'
                          : 'bg-black/20 border-white/20 hover:bg-white/10'
                      }`}
                    >
                      {pool.apy}% APY
                      <br />
                      <span className="text-xs opacity-75">{pool.lockPeriod}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* ROI Results */}
            <div className="space-y-4">
              <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-crypto-green" />
                  ROI Breakdown
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Initial Stake:</span>
                    <span className="font-medium">{formatNumber(roiData.principal)} OEC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Rewards:</span>
                    <span className="font-medium text-crypto-green">+{formatNumber(roiData.totalRewards)} OEC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Final Value:</span>
                    <span className="font-bold text-white">{formatNumber(roiData.totalValue)} OEC</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/10 pt-2">
                    <span className="text-gray-300">ROI:</span>
                    <span className="font-bold text-crypto-blue">{roiData.roi.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Earning Breakdown</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Daily Rewards:</span>
                    <span className="font-medium text-crypto-green">{roiData.dailyRewards.toFixed(4)} OEC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Monthly Rewards:</span>
                    <span className="font-medium text-crypto-green">{roiData.monthlyRewards.toFixed(2)} OEC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Selected Pool:</span>
                    <span className="font-medium">{selectedPool.name} ({selectedPool.apy}% APY)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}