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
} from "lucide-react";
import { WalletConnect } from "@/components/wallet-connect";
import { OECLoader } from "@/components/oec-loader";
import { useToast } from "@/hooks/use-toast";
import { useAccount, usePublicClient, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatEther } from "viem";
import ERC20ABI from "@/services/abis/ERC20.json";

// Contract addresses on Sepolia
const OEC_TOKEN = "0x2b2fb8df4ac5d394f0d5674d7a54802e42a06aba";

// Faucet wallet address (for manual fulfillment)
const FAUCET_WALLET = "0xD02dbe54454F6FE3c2F9F1F096C5460284E418Ed";

// Rate limit: 24 hours in milliseconds
const RATE_LIMIT_MS = 24 * 60 * 60 * 1000;

export default function Faucet() {
  const { isConnected, address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();

  const isCorrectNetwork = Boolean(chain && chain.id === sepolia.id);

  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState<bigint>(0n);
  const [faucetBalance, setFaucetBalance] = useState<bigint>(0n);
  const [lastRequestTime, setLastRequestTime] = useState<number | null>(null);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load rate limit from localStorage
  useEffect(() => {
    if (address) {
      const key = `oec-faucet-${address.toLowerCase()}`;
      const savedTime = localStorage.getItem(key);
      if (savedTime) {
        setLastRequestTime(parseInt(savedTime, 10));
      }
    }
  }, [address]);

  // Fetch balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!publicClient) return;

      try {
        setLoading(true);

        // Fetch faucet wallet balance
        const faucetBal = await publicClient.readContract({
          address: OEC_TOKEN,
          abi: ERC20ABI,
          functionName: "balanceOf",
          args: [FAUCET_WALLET],
        }) as bigint;
        setFaucetBalance(faucetBal);

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
      } catch (error) {
        console.error("Error fetching balances:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [publicClient, address]);

  const formatNumber = (num: bigint, decimals = 2) => {
    const n = Number(formatEther(num));
    return n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const canRequest = () => {
    if (!lastRequestTime) return true;
    return Date.now() - lastRequestTime >= RATE_LIMIT_MS;
  };

  const getTimeUntilNextRequest = () => {
    if (!lastRequestTime) return null;
    const remaining = RATE_LIMIT_MS - (Date.now() - lastRequestTime);
    if (remaining <= 0) return null;

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleRequestTokens = () => {
    if (!address || !canRequest()) return;

    // Save request time
    const now = Date.now();
    const key = `oec-faucet-${address.toLowerCase()}`;
    localStorage.setItem(key, now.toString());
    setLastRequestTime(now);
    setRequestSubmitted(true);

    toast({
      title: "Request submitted!",
      description: "Your address has been logged. Tokens will be sent manually.",
    });
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
                {requestSubmitted ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-400">Request Submitted!</h3>
                    <p className="text-sm text-gray-400">
                      Your request has been logged. Test tokens will be sent to your address manually.
                      This typically happens within a few hours.
                    </p>
                    <div className="bg-black/30 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Your Address:</p>
                      <p className="font-mono text-sm break-all">{address}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Request Test Tokens</h3>
                        <p className="text-sm text-gray-400">
                          Request 1,000 OEC test tokens for testing the staking dApp.
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 ml-4">
                        <Droplets className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    {!canRequest() && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-yellow-400" />
                        <div>
                          <p className="text-sm text-yellow-400">Rate limited</p>
                          <p className="text-xs text-gray-400">
                            Next request available in: {getTimeUntilNextRequest()}
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
                      onClick={handleRequestTokens}
                      disabled={!canRequest()}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    >
                      <Droplets className="w-4 h-4 mr-2" />
                      Request Test Tokens
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* Need Sepolia ETH */}
            <Card className="crypto-card p-4 bg-gray-900/50">
              <h3 className="text-sm font-semibold mb-2">Need Sepolia ETH?</h3>
              <p className="text-xs text-gray-400 mb-2">
                You'll need Sepolia ETH for gas fees.
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
                  <p className="text-xl font-bold">{formatNumber(faucetBalance)}</p>
                </Card>
              </>
            )}

            <Card className="crypto-card p-4 bg-gray-900/50">
              <h3 className="text-sm font-semibold mb-2">How it works</h3>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>1. Connect your wallet</li>
                <li>2. Switch to Sepolia testnet</li>
                <li>3. Click "Request Test Tokens"</li>
                <li>4. Tokens are sent manually</li>
              </ul>
            </Card>

            {/* Faucet Wallet Info */}
            <Card className="crypto-card p-4 bg-gray-900/50">
              <h3 className="text-xs font-semibold mb-2">Faucet Wallet</h3>
              <p className="text-xs text-gray-400 mb-2">
                Donations to refill the faucet are welcome!
              </p>
              <div className="flex items-center justify-between bg-black/30 rounded p-2">
                <p className="font-mono text-xs break-all">{FAUCET_WALLET}</p>
                <button
                  onClick={() => copyToClipboard(FAUCET_WALLET)}
                  className="ml-2 p-1 hover:bg-gray-700 rounded flex-shrink-0"
                  title="Copy address"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
