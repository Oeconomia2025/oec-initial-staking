declare global {
  interface Window {
    ethereum?: any;
    trustWallet?: any;
    rabby?: any;
    okxwallet?: any;
    BinanceChain?: any;
    phantom?: {
      ethereum?: any;
    };
    safe?: any;
    // Additional wallet providers
    okx?: any;
    binance?: any;
    brave?: any;
    coinbaseWalletExtension?: any;
  }
}

export {};