import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { formatEther } from "viem";

interface EarlyWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: bigint;
  penaltyBps: bigint;
  poolName: string;
}

export function EarlyWithdrawModal({
  isOpen,
  onClose,
  onConfirm,
  amount,
  penaltyBps,
  poolName,
}: EarlyWithdrawModalProps) {
  const penaltyAmount = (amount * penaltyBps) / 10000n;
  const receiveAmount = amount - penaltyAmount;
  const penaltyPercent = Number(penaltyBps) / 100;

  const formatNumber = (num: bigint) => {
    const n = Number(formatEther(num));
    return n.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-xl text-white">Early Withdrawal Warning</DialogTitle>
              <DialogDescription className="text-gray-400">
                {poolName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Your Staked Amount:</span>
              <span className="font-semibold text-white">{formatNumber(amount)} OEC</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Penalty ({penaltyPercent}%):</span>
              <span className="font-semibold text-red-400">-{formatNumber(penaltyAmount)} OEC</span>
            </div>
            <div className="border-t border-red-500/30 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-medium">You will receive:</span>
                <span className="font-bold text-lg text-green-400">{formatNumber(receiveAmount)} OEC</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-sm text-yellow-400">
              <strong>Note:</strong> All accrued rewards will be forfeited when using early withdrawal.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-gray-600 hover:bg-gray-700 text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            Confirm Early Withdrawal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
