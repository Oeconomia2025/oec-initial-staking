import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, AlertTriangle } from "lucide-react";
import { useCopyToClipboard } from "@/hooks/use-copy-clipboard";

interface TestnetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TestnetModal({ isOpen, onClose }: TestnetModalProps) {
  const { copyToClipboard } = useCopyToClipboard();
  
  // Placeholder testnet contract address
  const testnetContract = "0xTestContract123456789012345678901234567890";
  const testnetBSCScanUrl = `https://testnet.bscscan.com/token/${testnetContract}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="crypto-card border-[var(--crypto-border)] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">BSC Testnet Information</DialogTitle>
          <DialogDescription className="text-gray-400">
            Test deployment details for development purposes
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm">Testnet Contract</label>
            <div className="flex items-center space-x-2 mt-1">
              <code className="bg-[var(--crypto-dark)] px-3 py-2 rounded text-sm font-mono flex-1 text-white">
                {testnetContract.slice(0, 10)}...{testnetContract.slice(-8)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(testnetContract)}
                className="text-crypto-blue hover:text-crypto-blue/80 p-2"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-3 bg-crypto-gold/10 rounded-lg border border-crypto-gold/30">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="text-crypto-gold w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-crypto-gold mb-1">Testing Mode</div>
                <div className="text-sm text-gray-400">
                  Use BSC Testnet for testing. Get test BNB from faucet before testing transactions.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Network</span>
              <Badge variant="outline" className="border-crypto-gold/30 text-crypto-gold">
                BSC Testnet
              </Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Chain ID</span>
              <span>97</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">RPC URL</span>
              <span className="text-xs">https://data-seed-prebsc-1-s1.binance.org:8545</span>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <Button
              asChild
              className="w-full bg-crypto-blue hover:bg-crypto-blue/80"
            >
              <a href={testnetBSCScanUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Testnet Explorer
              </a>
            </Button>
            
            <Button
              asChild
              variant="outline"
              className="w-full border-crypto-gold/30 text-crypto-gold hover:bg-crypto-gold/10"
            >
              <a 
                href="https://testnet.binance.org/faucet-smart" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Get Testnet BNB
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
