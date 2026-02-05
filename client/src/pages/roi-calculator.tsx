import { useState, useEffect } from "react";
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
import { OECLoader } from "@/components/oec-loader";
import { useAccount, usePublicClient, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import MultiPoolStakingAPRABI from "@/services/abis/MultiPoolStakingAPR.json";

const STAKING_CONTRACT = "0x4a4da37c9a9f421efe3feb527fc16802ce756ec3";

interface Pool {
  id: number;
  name: string;
  lockPeriod: string;
  lockSeconds: number;
  aprBps: number;
  apr: number;
}

export default function ROICalculator() {
  const { isConnected, chain } = useAccount();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();

  // Check if on correct network - must be defined AND be sepolia
  const isCorrectNetwork = Boolean(chain && chain.id === sepolia.id);

  const [loading, setLoading] = useState(true);
  const [pools, setPools] = useState<Pool[]>([]);
  const [isROIExpanded, setIsROIExpanded] = useState(true);
  const [calcAmount, setCalcAmount] = useState("1000");
  const [calcDays, setCalcDays] = useState("365");
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);

  // Fetch pools from contract
  useEffect(() => {
    const fetchPools = async () => {
      if (!publicClient) {
        setLoading(false);
        return;
      }

      try {
        const poolCount = await publicClient.readContract({
          address: STAKING_CONTRACT,
          abi: MultiPoolStakingAPRABI,
          functionName: "poolCount",
        }) as bigint;

        const fetchedPools: Pool[] = [];

        for (let i = 0; i < Number(poolCount); i++) {
          const poolInfo = await publicClient.readContract({
            address: STAKING_CONTRACT,
            abi: MultiPoolStakingAPRABI,
            functionName: "getPoolInfo",
            args: [BigInt(i)],
          }) as [string, string, bigint, bigint, bigint, bigint, bigint];

          const lockSeconds = Number(poolInfo[3]);
          const aprBps = Number(poolInfo[2]);

          // Format lock period for display
          let lockPeriod = "Flexible";
          let name = "Flexible Staking";
          if (lockSeconds > 0) {
            if (lockSeconds < 3600) {
              lockPeriod = `${lockSeconds}s`;
              name = `${lockSeconds}-Second Lock`;
            } else if (lockSeconds < 86400) {
              const hours = Math.floor(lockSeconds / 3600);
              lockPeriod = `${hours} Hour${hours > 1 ? 's' : ''}`;
              name = `${hours}-Hour Lock`;
            } else {
              const days = Math.floor(lockSeconds / 86400);
              lockPeriod = `${days} Day${days > 1 ? 's' : ''}`;
              name = `${days}-Day Lock`;
            }
          }

          fetchedPools.push({
            id: i,
            name,
            lockPeriod,
            lockSeconds,
            aprBps,
            apr: aprBps / 100,
          });
        }

        setPools(fetchedPools);
        if (fetchedPools.length > 0) {
          // Select the first non-test pool by default, or first pool
          const defaultPool = fetchedPools.find(p => p.lockSeconds >= 86400) || fetchedPools[0];
          setSelectedPool(defaultPool);
        }
      } catch (error) {
        console.error("Error fetching pools:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, [publicClient]);

  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const calculateROI = () => {
    const principal = parseFloat(calcAmount) || 0;
    const days = parseFloat(calcDays) || 0;
    const apr = selectedPool ? selectedPool.apr / 100 : 0;
    const years = days / 365;

    // Simple interest calculation (APR, not compound)
    const totalRewards = principal * apr * years;
    const totalValue = principal + totalRewards;
    const roi = principal > 0 ? (totalRewards / principal) * 100 : 0;
    const dailyRewards = days > 0 ? totalRewards / days : 0;
    const monthlyRewards = days > 0 ? totalRewards / (days / 30) : 0;

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

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <OECLoader size="lg" text="Loading calculator..." />
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
                  <p className="text-[0.6rem] text-gray-400">You can use the calculator without connection</p>
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

        {/* ROI Calculator Section */}
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
                    className="bg-black border-white/20"
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
                    className="bg-black border-white/20"
                  />
                  <div className="flex gap-2 mt-2">
                    {[30, 60, 90, 365].map((days) => (
                      <Button
                        key={days}
                        variant="outline"
                        size="sm"
                        onClick={() => setCalcDays(days.toString())}
                        className={`text-xs border-white/20 hover:bg-white/10 ${
                          calcDays === days.toString() ? 'bg-white/20' : 'bg-black'
                        }`}
                      >
                        {days === 365 ? '1y' : `${days}d`}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Select Pool
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {pools.map((pool) => (
                      <Button
                        key={pool.id}
                        variant={selectedPool?.id === pool.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPool(pool)}
                        className={`text-xs h-auto py-2 ${
                          selectedPool?.id === pool.id
                            ? 'bg-crypto-blue hover:bg-crypto-blue/80'
                            : 'bg-black border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="font-bold">{pool.apr}% APR</span>
                          <span className="text-xs opacity-75">{pool.lockPeriod}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * APR = Annual Percentage Rate (simple interest, not compounded)
                  </p>
                </div>
              </div>

              {/* ROI Results */}
              <div className="space-y-4">
                <div className="bg-black p-4 rounded-lg border border-white/10">
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
                      <span className="font-medium text-green-400">+{formatNumber(roiData.totalRewards)} OEC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Final Value:</span>
                      <span className="font-bold text-white">{formatNumber(roiData.totalValue)} OEC</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/10 pt-2">
                      <span className="text-gray-300">ROI:</span>
                      <span className="font-bold text-crypto-blue">{formatNumber(roiData.roi)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-black p-4 rounded-lg border border-white/10">
                  <h3 className="text-lg font-semibold mb-4">Earning Breakdown</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Daily Rewards:</span>
                      <span className="font-medium text-green-400">{formatNumber(roiData.dailyRewards, 4)} OEC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Monthly Rewards:</span>
                      <span className="font-medium text-green-400">{formatNumber(roiData.monthlyRewards)} OEC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Selected Pool:</span>
                      <span className="font-medium">{selectedPool?.name} ({selectedPool?.apr}% APR)</span>
                    </div>
                    {selectedPool && selectedPool.lockSeconds > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Lock Period:</span>
                        <span className="font-medium text-yellow-400">{selectedPool.lockPeriod}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedPool && parseInt(calcDays) < Math.ceil(selectedPool.lockSeconds / 86400) && selectedPool.lockSeconds >= 86400 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg">
                    <p className="text-xs text-yellow-400">
                      <strong>Note:</strong> Your selected staking period ({calcDays} days) is less than the pool's lock period ({selectedPool.lockPeriod}).
                      Early withdrawal may incur penalties.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
