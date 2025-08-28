// Token color mapping for charts and UI elements
export const tokenColorMapping: Record<string, string> = {
  // Major cryptocurrencies with distinctive colors
  'BTC': '#F7931A', // Bitcoin orange
  'ETH': '#627EEA', // Ethereum blue
  'USDT': '#26A17B', // Tether green
  'BNB': '#F3BA2F', // Binance yellow
  'SOL': '#9945FF', // Solana purple
  'USDC': '#2775CA', // USD Coin blue
  'XRP': '#E5E7EB', // XRP light gray (contrast fix for dark theme)
  'DOGE': '#C2A633', // Dogecoin gold
  'ADA': '#0033AD', // Cardano blue
  'AVAX': '#E84142', // Avalanche red
  'SHIB': '#FFA409', // Shiba orange
  'DOT': '#E6007A', // Polkadot pink
  'TRX': '#FF060A', // Tron red
  'MATIC': '#8247E5', // Polygon purple
  'LTC': '#BFBBBB', // Litecoin silver
  'LINK': '#375BD2', // Chainlink blue
  'BCH': '#8DC351', // Bitcoin Cash green
  'NEAR': '#00C08B', // Near green
  'UNI': '#FF007A', // Uniswap pink
  'LEO': '#FF9500', // Leo orange
  'ICP': '#29ABE2', // Internet Computer blue
  'APT': '#F3F4F6', // Aptos light gray (contrast fix for dark theme)
  'FIL': '#0090FF', // Filecoin blue
  'LDO': '#00A3FF', // Lido blue
  'ARB': '#28A0F0', // Arbitrum blue
  'VET': '#15BDFF', // VeChain blue
  'MNT': '#F9FAFB', // Mantle white (contrast fix for dark theme)
  'ATOM': '#D1D5DB', // Cosmos light gray (contrast fix for dark theme)
  'GRT': '#6F4CFF', // The Graph purple
  'MKR': '#1AAB9B', // Maker teal
  'OP': '#FF0420', // Optimism red
  'IMX': '#00D2FF', // Immutable X cyan
  'STX': '#5546FF', // Stacks purple
  'THETA': '#2AB8E6', // Theta blue
  'CRO': '#003CDA', // Crypto.com blue
  'TON': '#0088CC', // TON blue
  'CAKE': '#D1884F', // PancakeSwap brown
  'BUSD': '#F0B90B', // Binance USD yellow
  'DAI': '#F5AC37', // DAI yellow
  'WBNB': '#F3BA2F', // Wrapped BNB yellow
  'BTCB': '#F7931A', // Bitcoin BEP20 orange
  
  // DeFi tokens
  'SUSHI': '#FA52A0', // SushiSwap pink
  'COMP': '#00D395', // Compound green
  'AAVE': '#B6509E', // Aave purple
  'YFI': '#006AE3', // Yearn blue
  'SNX': '#5FCDF7', // Synthetix cyan
  'CRV': '#40E0D0', // Curve turquoise
  'BAL': '#F3F4F6', // Balancer light gray (contrast fix for dark theme)
  'RUNE': '#33FF99', // THORChain green
  'ALPHA': '#2E7D32', // Alpha green
  'BAKE': '#D1884F', // BakerySwap brown
  
  // Layer 2 and scaling
  'FTM': '#13B5EC', // Fantom blue
  'CELO': '#35D07F', // Celo green
  'ONE': '#00AEE9', // Harmony blue
  'ZIL': '#49C1BF', // Zilliqa teal
  'EGLD': '#1B46C2', // MultiversX blue
  'ALGO': '#E5E7EB', // Algorand light gray (contrast fix for dark theme)
  'HBAR': '#D1D5DB', // Hedera light gray (contrast fix for dark theme)
  'FLOW': '#00EF8B', // Flow green
  'IOS': '#F9FAFB', // IOST white (contrast fix for dark theme)
  'XTZ': '#2C7DF7', // Tezos blue
  
  // Meme and community tokens
  'PEPE': '#17C671', // Pepe green
  'FLOKI': '#F0B90B', // Floki yellow
  'BONK': '#FF6B35', // Bonk orange
  'WIF': '#FF69B4', // WIF pink
  'MEME': '#FFD700', // Meme gold
  
  // Stable coins and wrapped tokens
  'FRAX': '#E5E7EB', // Frax light gray (contrast fix for dark theme)
  'TUSD': '#002868', // TrueUSD blue
  'USDP': '#0052FF', // Pax Dollar blue
  'FDUSD': '#F0B90B', // First Digital USD yellow
  
  // Default colors for unknown tokens
  'DEFAULT': '#10B981', // Crypto green fallback
};

// Get color for a specific token, with fallback to crypto green
export function getTokenColor(tokenCode: string): string {
  return tokenColorMapping[tokenCode.toUpperCase()] || tokenColorMapping.DEFAULT;
}

// Convert hex color to RGB values for gradients
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Create gradient ID for chart
export function getChartGradientId(tokenCode: string): string {
  return `areaGradient${tokenCode.toUpperCase()}`;
}