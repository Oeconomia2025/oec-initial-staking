# Environment Variables

Configuration for the OEC Staking dApp.

## Frontend (Vite)

| Variable                        | Description                    | Required |
| ------------------------------- | ------------------------------ | -------- |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID | Yes      |

{% hint style="info" %}
**Minimal Config:** The staking dApp is a pure client-side application. Contract addresses are hardcoded in `client/src/services/staking-contract.ts`. No database or API keys required for the frontend.
{% endhint %}

## Smart Contract Development (Hardhat)

| Variable           | Description                        | Required |
| ------------------ | ---------------------------------- | -------- |
| `ALCHEMY_API_KEY`  | Alchemy API key for Sepolia RPC    | Yes      |
| `DEPLOYER_KEY`     | Private key for contract deployment| Yes      |
| `ETHERSCAN_API_KEY`| Etherscan API key for verification | No       |

## Contract Addresses

Contract addresses are defined in:

**Source:** `client/src/services/staking-contract.ts`

```typescript
export const STAKING_CONTRACT = "0xd12664c1f09fa1561b5f952259d1eb5555af3265";
export const OEC_TOKEN = "0x00904218319a045a96d776ec6a970f54741208e6";
export const ACHIEVEMENTS_CONTRACT = "0xbb0805254d328d1a542efb197b3a922c3fd97063";
export const FAUCET_CONTRACT = "0x29c900b48079634e5b1e19508fa347340ee786bb";
```

To update contract addresses after redeployment, edit this file and rebuild.

## Wallet Configuration

Wallet connectors and chain configuration are defined in:

**Source:** `client/src/lib/wagmi.ts`

Supported chains: Sepolia (primary), Mainnet, BSC, Polygon, Arbitrum, Optimism, Avalanche, Base.
