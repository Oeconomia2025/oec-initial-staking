# Quick Start

Get the OEC Staking dApp running locally for development.

## Prerequisites

- Node.js 20+
- npm
- MetaMask or compatible wallet configured for Sepolia testnet

## Installation

```bash
cd oec-claude-workspace
npm install
```

## Run Development Server

```bash
npm run dev:client
```

The app will be available at `http://localhost:5173`.

## Get Test Tokens

1. Connect your wallet to Sepolia testnet
2. Navigate to the **Faucet** page
3. Click **Claim** to receive test OEC tokens
4. You'll need Sepolia ETH for gas — use a public Sepolia faucet

## Your First Stake

1. Go to **Staking Pools**
2. Select a pool (e.g., 30-Day Lock, 12% APR)
3. Click **Approve** to allow the staking contract to spend your OEC
4. Enter an amount and click **Stake**
5. Watch your rewards accrue on the **Dashboard**

## Production Build

```bash
npx vite build --config vite.config.netlify.ts
```

Outputs to `dist/public/` for Netlify deployment. See [Deploy Guide](../deployment/deploy-guide.md).

## Smart Contract Development

```bash
npx hardhat compile
npx hardhat deploy --network sepolia
```

See [Staking Contract (V2)](../smart-contracts/staking-v2.md) for contract details.
