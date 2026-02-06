import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Droplets,
  Wallet,
  Clock,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { WalletConnect } from "@/components/wallet-connect";
import { OECLoader } from "@/components/oec-loader";
import { useToast } from "@/hooks/use-toast";
import { useAccount, usePublicClient, useWalletClient, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatEther } from "viem";
import ERC20ABI from "@/services/abis/ERC20.json";
import OECFaucetABI from "@/services/abis/OECFaucet.json";

// Contract addresses on Sepolia
const OEC_TOKEN = "0x2b2fb8df4ac5d394f0d5674d7a54802e42a06aba";

// Faucet contract address - UPDATE THIS AFTER DEPLOYMENT
const FAUCET_CONTRACT = "0x0000000000000000000000000000000000000000";

export default function Faucet() {
  const { isConnected, address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();

  const isCorrectNetwork = Boolean(chain && chain.id === sepolia.id);
  const isFaucetDeployed = FAUCET_CONTRACT !== "0x0000000000000000000000000000000000000000";

  const [loading, setLoading] = useState(true);
  const [txPending, setTxPending] = useState(false);
  const [userBalance, setUserBalance] = useState<bigint>(0n);
  const [faucetBalance, setFaucetBalance] = useState<bigint>(0n);
  const [claimAmount, setClaimAmount] = useState<bigint>(0n);
  const [canClaimTokens, setCanClaimTokens] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<bigint>(0n);
  const [copied, setCopied] = useState(false);

  // Fetch balances and claim status
  useEffect(() => {
    const fetchData = async () => {
      if (!publicClient) return;

      try {
        setLoading(true);

        // Fetch user balance if connected
        if (address) {
          const userBal = await publicClient.readContract({
            address: OEC_TOKEN,
            abi: ERC20ABI,
            functionName: "balanceOf",
            args: [address],
          }) as bigint;
          setUserBalance(userBal);
        }

        // Only fetch faucet data if contract is deployed
        if (isFaucetDeployed) {
          // Fetch faucet balance
          const faucetBal = await publicClient.readContract({
            address: FAUCET_CONTRACT,
            abi: OECFaucetABI,
            functionName: "faucetBalance",
          }) as bigint;
          setFaucetBalance(faucetBal);

          // Fetch claim amount
          const amount = await publicClient.readContract({
            address: FAUCET_CONTRACT,
            abi: OECFaucetABI,
            functionName: "claimAmount",
          }) as bigint;
          setClaimAmount(amount);

          // Check if user can claim
          if (address) {
            const [eligible, remaining] = await publicClient.readContract({
              address: FAUCET_CONTRACT,
              abi: OECFaucetABI,
              functionName: "canClaim",
              args: [address],
            }) as [boolean, bigint];
            setCanClaimTokens(eligible);
            setTimeRemaining(remaining);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [publicClient, address, isFaucetDeployed]);

  // Update countdown timer
  useEffect(() => {
    if (timeRemaining <= 0n) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0n ? prev - 1n : 0n));
      if (timeRemaining <= 1n) {
        setCanClaimTokens(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const formatNumber = (num: bigint, decimals = 2) => {
    const n = Number(formatEther(num));
    return n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const formatTimeRemaining = () => {
    const seconds = Number(timeRemaining);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const handleClaimTokens = async () => {
    if (!walletClient || !address || !canClaimTokens || !isFaucetDeployed) return;

    try {
      setTxPending(true);
      toast({ title: "Claiming tokens...", description: "Please confirm in your wallet" });

      const hash = await walletClient.writeContract({
        address: FAUCET_CONTRACT,
        abi: OECFaucetABI,
        functionName: "claim",
      });

      await publicClient?.waitForTransactionReceipt({ hash });

      toast({
        title: "Tokens claimed!",
        description: `You received ${formatNumber(claimAmount)} OEC`
      });

      // Refresh data
      window.location.reload();
    } catch (error: any) {
      console.error("Claim failed:", error);

      // Parse error message
      let errorMsg = "Transaction failed";
      if (error?.message?.includes("CooldownNotElapsed")) {
        errorMsg = "Please wait for the cooldown period to end";
      } else if (error?.message?.includes("InsufficientFaucetBalance")) {
        errorMsg = "Faucet is empty. Please try again later.";
      } else if (error?.message?.includes("User rejected")) {
        errorMsg = "Transaction was rejected";
      }

      toast({ title: "Claim failed", description: errorMsg, variant: "destructive" });
    } finally {
      setTxPending(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <OECLoader size="lg" text="Loading faucet..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Faucet Not Deployed Warning */}
        {!isFaucetDeployed && (
          <Card className="crypto-card p-4 border bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 mb-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-400">Faucet Not Deployed</p>
                <p className="text-xs text-gray-400">The faucet contract has not been deployed yet.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Wallet Connection Notice - Full Width */}
        {!isConnected && (
          <Card className="crypto-card p-4 border bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wallet className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-sm font-medium">Connect your wallet</p>
                  <p className="text-xs text-gray-400">to request test tokens</p>
                </div>
              </div>
              <WalletConnect />
            </div>
          </Card>
        )}

        {/* Wrong Network Warning - Full Width */}
        {isConnected && !isCorrectNetwork && (
          <Card className="crypto-card p-4 border bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-400">Wrong Network</p>
                  <p className="text-xs text-gray-400">Please switch to Sepolia</p>
                </div>
              </div>
              <Button
                onClick={() => switchChain({ chainId: sepolia.id })}
                className="bg-red-500 hover:bg-red-600"
                size="sm"
              >
                Switch to Sepolia
              </Button>
            </div>
          </Card>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
          {/* Left Column - Request Form */}
          <div className="space-y-4">
            {/* Request Form */}
            {isConnected && isCorrectNetwork && (
              <Card className="crypto-card p-6 bg-gray-900/80">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Request Test Tokens</h3>
                      <p className="text-sm text-gray-400">
                        Claim {isFaucetDeployed ? formatNumber(claimAmount) : "1,000"} OEC test tokens for testing the staking dApp.
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 ml-4">
                      <Droplets className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {!canClaimTokens && timeRemaining > 0n && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-yellow-400" />
                      <div>
                        <p className="text-sm text-yellow-400">Cooldown active</p>
                        <p className="text-xs text-gray-400">
                          Next claim available in: {formatTimeRemaining()}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-black/30 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Your Address:</p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-sm break-all flex-1">{address}</p>
                      <button
                        onClick={() => copyToClipboard(address || "")}
                        className="ml-2 p-1 hover:bg-gray-700 rounded"
                        title="Copy address"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleClaimTokens}
                    disabled={!canClaimTokens || txPending || !isFaucetDeployed}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  >
                    {txPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Droplets className="w-4 h-4 mr-2" />
                    )}
                    {txPending ? "Claiming..." : "Claim Test Tokens"}
                  </Button>
                </div>
              </Card>
            )}

            {/* Need Sepolia ETH */}
            <Card className="crypto-card p-4 bg-gray-900/50">
              <h3 className="text-sm font-semibold mb-2">Need Sepolia ETH?</h3>
              <p className="text-xs text-gray-400 mb-2">
                You'll need Sepolia ETH for gas fees to claim tokens.
              </p>
              <a
                href="https://sepoliafaucet.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:underline flex items-center"
              >
                Get Sepolia ETH <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Card>

            {/* Token Contract */}
            <Card className="crypto-card p-4 bg-gray-900/50">
              <h3 className="text-xs font-semibold mb-2">OEC Token Contract (Sepolia)</h3>
              <div className="flex items-center justify-between">
                <a
                  href={`https://sepolia.etherscan.io/address/${OEC_TOKEN}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-blue-400 hover:underline break-all"
                >
                  {OEC_TOKEN}
                </a>
                <a
                  href={`https://sepolia.etherscan.io/address/${OEC_TOKEN}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-gray-400 hover:text-white"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </Card>
          </div>

          {/* Right Column - Stacked Info Cards */}
          <div className="space-y-4">
            {/* Balances */}
            {isConnected && isCorrectNetwork && (
              <>
                <Card className="crypto-card p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
                  <p className="text-xs text-gray-400 mb-1">Your OEC Balance</p>
                  <p className="text-xl font-bold">{formatNumber(userBalance)}</p>
                </Card>
                <Card className="crypto-card p-4 bg-gradient-to-r from-green-500/10 to-teal-500/10 border-green-500/30">
                  <p className="text-xs text-gray-400 mb-1">Faucet Balance</p>
                  <p className="text-xl font-bold">{isFaucetDeployed ? formatNumber(faucetBalance) : "—"}</p>
                </Card>
              </>
            )}

            <Card className="crypto-card p-4 bg-gray-900/50">
              <h3 className="text-sm font-semibold mb-2">How it works</h3>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>1. Connect your wallet</li>
                <li>2. Switch to Sepolia testnet</li>
                <li>3. Click "Claim Test Tokens"</li>
                <li>4. Confirm the transaction</li>
                <li>5. Wait 24 hours between claims</li>
              </ul>
            </Card>

            {/* Faucet Contract Info */}
            {isFaucetDeployed && (
              <Card className="crypto-card p-4 bg-gray-900/50">
                <h3 className="text-xs font-semibold mb-2">Faucet Contract</h3>
                <p className="text-xs text-gray-400 mb-2">
                  Send OEC here to refill the faucet.
                </p>
                <div className="flex items-center justify-between bg-black/30 rounded p-2">
                  <p className="font-mono text-xs break-all">{FAUCET_CONTRACT}</p>
                  <button
                    onClick={() => copyToClipboard(FAUCET_CONTRACT)}
                    className="ml-2 p-1 hover:bg-gray-700 rounded flex-shrink-0"
                    title="Copy address"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
