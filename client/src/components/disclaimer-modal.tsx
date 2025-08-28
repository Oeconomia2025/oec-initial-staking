import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle } from 'lucide-react';

export function DisclaimerModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen the disclaimer
    const hasSeenDisclaimer = localStorage.getItem('oeconomia-disclaimer-seen');
    
    if (!hasSeenDisclaimer) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Mark that user has seen the disclaimer
    localStorage.setItem('oeconomia-disclaimer-seen', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-[var(--crypto-card)] border-crypto-border p-6 relative">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-crypto-gold/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-crypto-gold" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Development Notice</h2>
            <p className="text-sm text-gray-400">Oeconomia DApp</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-gray-300">
            Please note that this DApp is currently in active development and is not yet ready for production use.
          </p>
          
          <p className="text-gray-300">
            This dashboard serves as a preview and testing environment. All data, transactions, and features are for demonstration purposes only.
          </p>

          <div className="bg-crypto-gold/10 border border-crypto-gold/30 rounded-lg p-3">
            <p className="text-sm text-crypto-gold">
              <strong>Important:</strong> Do not use real funds or make actual transactions through this interface.
            </p>
          </div>
        </div>

        <Button 
          onClick={handleClose}
          className="w-full bg-crypto-blue hover:bg-crypto-blue/80 text-white"
        >
          I Understand
        </Button>
      </Card>
    </div>
  );
}