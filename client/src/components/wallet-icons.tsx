import React from 'react';

interface WalletIconProps {
  wallet: string;
  className?: string;
}

export function WalletIcon({ wallet, className = "w-5 h-5" }: WalletIconProps) {
  const getWalletIcon = (walletName: string) => {
    switch (walletName.toLowerCase()) {
      case 'metamask':
        return (
          <div className={`${className} bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
            🦊
          </div>
        );
      case 'walletconnect':
        return (
          <div className={`${className} bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
            🔗
          </div>
        );
      case 'coinbase wallet':
        return (
          <div className={`${className} bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
            ⬜
          </div>
        );
      case 'trust wallet':
        return (
          <div className={`${className} bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
            💎
          </div>
        );
      case 'rabby wallet':
        return (
          <div className={`${className} bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
            🐰
          </div>
        );
      case 'okx wallet':
        return (
          <div className={`${className} bg-gradient-to-br from-black to-gray-800 rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
            ⭕
          </div>
        );
      case 'binance wallet':
        return (
          <div className={`${className} bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
            ⚡
          </div>
        );
      case 'phantom wallet':
        return (
          <div className={`${className} bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
            👻
          </div>
        );
      case 'safe wallet':
        return (
          <div className={`${className} bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
            🛡️
          </div>
        );
      default:
        return (
          <div className={`${className} bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
            💼
          </div>
        );
    }
  };

  return getWalletIcon(wallet);
}