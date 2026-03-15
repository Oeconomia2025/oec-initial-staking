import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { OECLoader } from "@/components/oec-loader";
import {
  Calculator,
  Wallet,
  TrendingUp,
  Coins,
  DollarSign,
  Percent,
} from "lucide-react";
import { WalletConnect } from "@/components/wallet-connect";
import { useAccount, usePublicClient, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import MultiPoolStakingAPRABI from "@/services/abis/MultiPoolStakingAPR.json";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

import { CONTRACTS } from "@/lib/contracts";

interface Pool {
  id: number;
  name: string;
  lockPeriod: string;
  lockSeconds: number;
  apr: number; // percentage (e.g. 35 = 35%)
}

// ---------- Helpers ----------
function formatAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toFixed(0);
}

function formatNumber(num: number, decimals = 2): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ---------- Synced slider+input component ----------
// Uses local string state so the user can freely type/select-all/clear
// without being fighting the clamped value. Clamping only happens on blur.
function SliderInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
  prefix,
  suffix,
  decimals,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const dp = decimals ?? (step < 1 ? (String(step).split(".")[1]?.length ?? 2) : 0);
  const [text, setText] = useState(dp > 0 ? value.toFixed(dp) : value.toString());
  const [focused, setFocused] = useState(false);

  // Sync text from external value changes (slider, buttons, reset) — but NOT while typing
  useEffect(() => {
    if (!focused) {
      setText(dp > 0 ? value.toFixed(dp) : value.toString());
    }
  }, [value, dp, focused]);

  const handleTextChange = (raw: string) => {
    // Allow free typing — strip non-numeric chars except dot
    const cleaned = raw.replace(/[^0-9.]/g, "");
    setText(cleaned);

    // Live-update the numeric value if it's a valid number within range
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    const parsed = parseFloat(text);
    if (isNaN(parsed) || text === "") {
      onChange(min);
    } else {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-300">{label}</Label>
      <div className="flex items-center gap-3">
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={([v]) => onChange(v)}
          className="flex-1"
        />
        <div className="relative w-32 flex-shrink-0">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
              {prefix}
            </span>
          )}
          <Input
            type="text"
            value={text}
            onFocus={() => setFocused(true)}
            onChange={(e) => handleTextChange(e.target.value)}
            onBlur={handleBlur}
            className={`bg-black border-white/20 text-right ${prefix ? "pl-7" : ""} ${suffix ? "pr-8" : ""}`}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Custom tooltip for the chart ----------
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const principal = payload.find((p: any) => p.dataKey === "principal")?.value ?? 0;
  const rewards = payload.find((p: any) => p.dataKey === "rewards")?.value ?? 0;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="text-gray-400 mb-1">Month {label}</p>
      <p className="text-purple-400">Staked: {formatNumber(principal)}</p>
      <p className="text-emerald-400">Rewards: {formatNumber(rewards)}</p>
      <p className="text-white font-medium">Total: {formatNumber(principal + rewards)}</p>
    </div>
  );
}

// ---------- Main component ----------
export default function ROICalculator() {
  const { isConnected, chain } = useAccount();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const isCorrectNetwork = Boolean(chain && chain.id === sepolia.id);

  // Pool fetching
  const [loading, setLoading] = useState(true);
  const [pools, setPools] = useState<Pool[]>([]);

  useEffect(() => {
    const fetchPools = async () => {
      if (!publicClient) {
        setLoading(false);
        return;
      }
      try {
        const poolCount = (await publicClient.readContract({
          address: CONTRACTS.STAKING,
          abi: MultiPoolStakingAPRABI,
          functionName: "poolCount",
        })) as bigint;

        const fetched: Pool[] = [];
        for (let i = 0; i < Number(poolCount); i++) {
          const info = (await publicClient.readContract({
            address: CONTRACTS.STAKING,
            abi: MultiPoolStakingAPRABI,
            functionName: "getPoolInfo",
            args: [BigInt(i)],
          })) as [string, string, bigint, bigint, bigint, bigint, bigint];

          const lockSeconds = Number(info[3]);
          const aprBps = Number(info[2]);
          let lockPeriod = "Flexible";
          if (lockSeconds > 0) {
            if (lockSeconds < 3600) {
              lockPeriod = `${lockSeconds}s`;
            } else if (lockSeconds < 86400) {
              lockPeriod = `${Math.floor(lockSeconds / 3600)}h`;
            } else {
              lockPeriod = `${Math.floor(lockSeconds / 86400)}d`;
            }
          }

          fetched.push({
            id: i,
            name: lockPeriod,
            lockPeriod,
            lockSeconds,
            apr: aprBps / 100,
          });
        }
        setPools(fetched);
      } catch (err) {
        console.error("Error fetching pools:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPools();
  }, [publicClient]);

  // Calculator state
  const [stake, setStake] = useState(1000);
  const [apy, setApy] = useState(35);
  const [price, setPrice] = useState(0.000259);
  const [months, setMonths] = useState(12);
  const [compound, setCompound] = useState(true);

  // Auto-select first pool APR once loaded
  useEffect(() => {
    if (pools.length > 0) {
      const defaultPool = pools.find((p) => p.apr > 0) || pools[0];
      setApy(defaultPool.apr);
    }
  }, [pools]);

  // Calculations
  const { finalBalance, rewards, usdValue, roiPercent, chartData } = useMemo(() => {
    let finalBalance: number;
    if (compound) {
      finalBalance = stake * Math.pow(1 + apy / 12 / 100, months);
    } else {
      finalBalance = stake + stake * (apy / 100 / 12) * months;
    }
    const rewards = finalBalance - stake;
    const usdValue = finalBalance * price;
    const roiPercent = stake > 0 ? (rewards / stake) * 100 : 0;

    const chartData = [];
    for (let m = 0; m <= months; m++) {
      let bal: number;
      if (compound) {
        bal = stake * Math.pow(1 + apy / 12 / 100, m);
      } else {
        bal = stake + stake * (apy / 100 / 12) * m;
      }
      chartData.push({
        month: m,
        principal: stake,
        rewards: Math.max(0, bal - stake),
      });
    }
    return { finalBalance, rewards, usdValue, roiPercent, chartData };
  }, [stake, apy, price, months, compound]);

  const stats = [
    {
      label: "Final Balance",
      value: `${formatNumber(finalBalance)} OEC`,
      icon: Coins,
      color: "text-purple-400",
    },
    {
      label: "Rewards Earned",
      value: `+${formatNumber(rewards)} OEC`,
      icon: TrendingUp,
      color: "text-emerald-400",
    },
    {
      label: "Total USD Value",
      value: `$${formatNumber(usdValue)}`,
      icon: DollarSign,
      color: "text-crypto-gold",
    },
    {
      label: "Rewards USD Value",
      value: `$${formatNumber(rewards * price)}`,
      icon: DollarSign,
      color: "text-yellow-400",
    },
    {
      label: "ROI",
      value: `${formatNumber(roiPercent)}%`,
      icon: Percent,
      color: "text-crypto-blue",
    },
  ];

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
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 mt-3">
        {/* Wallet Connection Notice */}
        {!isConnected && (
          <Card className="crypto-card p-3 border mb-1 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
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
          <Card className="crypto-card p-3 border mb-1 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30">
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

        {/* Main Calculator Card */}
        <Card className="crypto-card p-6 border bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-6">
            <Calculator className="w-6 h-6 text-crypto-blue" />
            <h2 className="text-xl font-semibold">OEC Rewards Calculator</h2>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Inputs */}
            <div className="space-y-5">
              <SliderInput
                label="Stake Amount (OEC)"
                value={stake}
                min={5_000}
                max={5_000_000}
                step={100}
                onChange={setStake}
              />

              {/* APY — pool buttons instead of slider */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">APR (from staking pools)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {pools.map((pool) => (
                    <button
                      key={pool.id}
                      onClick={() => setApy(pool.apr)}
                      className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        apy === pool.apr
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-black border border-white/20 text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span className="font-bold">{pool.apr}%</span>
                    </button>
                  ))}
                </div>
              </div>

              <SliderInput
                label="Token Price (USD)"
                value={price}
                min={0.0001}
                max={1}
                step={0.0001}
                onChange={setPrice}
                prefix="$"
                decimals={4}
              />
              <div>
                <SliderInput
                  label="Duration (months)"
                  value={months}
                  min={1}
                  max={36}
                  step={1}
                  onChange={setMonths}
                />
                {(() => {
                  const selectedPool = pools.find((p) => p.apr === apy);
                  const show = selectedPool && selectedPool.lockSeconds > 0 &&
                    months < Math.ceil(selectedPool.lockSeconds / (30 * 86400));
                  const lockMonths = selectedPool ? Math.ceil(selectedPool.lockSeconds / (30 * 86400)) : 0;
                  return (
                    <p className={`text-xs mt-1.5 h-4 ${show ? "text-yellow-400" : "text-transparent"}`}>
                      {show
                        ? `The ${selectedPool!.apr}% APR pool requires a ${selectedPool!.lockPeriod} lock (~${lockMonths} month${lockMonths > 1 ? "s" : ""}). You've selected ${months} month${months > 1 ? "s" : ""}.`
                        : "\u00A0"}
                    </p>
                  );
                })()}
              </div>

              {/* Compounding toggle */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">Compounding Mode</Label>
                <div className="flex rounded-md overflow-hidden border border-white/20">
                  <button
                    onClick={() => setCompound(true)}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      compound
                        ? "bg-primary text-primary-foreground"
                        : "bg-black text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Auto-compound
                  </button>
                  <button
                    onClick={() => setCompound(false)}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      !compound
                        ? "bg-primary text-primary-foreground"
                        : "bg-black text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Manual claim
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Chart */}
            <div className="flex flex-col">
              <div className="bg-black rounded-lg border border-white/10 p-4 flex flex-col flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" />
                    <span className="text-xs text-gray-400">Staked principal</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                    <span className="text-xs text-gray-400">Rewards earned</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" className="flex-1" style={{ minHeight: 280 }}>
                  <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      axisLine={{ stroke: "#374151" }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={formatAxis}
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={50}
                    />
                    <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                    <Bar dataKey="principal" stackId="a" fill="#a855f7" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="rewards" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Stat Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-muted rounded-lg p-4 border border-border"
              >
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className={`text-lg font-semibold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground mt-4">
            Estimates only. APY is variable and depends on total staked supply, emissions schedule, and protocol conditions.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
