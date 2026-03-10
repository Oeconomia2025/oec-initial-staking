# Deploy Guide

Instructions for deploying the OEC Staking dApp frontend and smart contracts.

## Frontend Deployment (Netlify)

### Prerequisites

- Netlify CLI installed (`npm i -g netlify-cli`)
- Netlify account linked to the project
- Netlify Site ID: `a1a45e0c-11f1-49b9-89a2-ca65cc24fa44`

### Build

```bash
cd oec-claude-workspace
npx vite build --config vite.config.netlify.ts
```

Output: `dist/public/`

### Deploy

```bash
npx netlify deploy --prod --dir=dist/public
```

### Production URL

**Live:** [https://staking.oeconomia.io](https://staking.oeconomia.io)

## Smart Contract Deployment (Hardhat)

### Prerequisites

- Hardhat configured with Sepolia network
- Deployer wallet funded with Sepolia ETH
- Alchemy API key for Sepolia RPC

### Compile

```bash
npx hardhat compile
```

Artifacts output to `artifacts/`.

### Deploy

```bash
npx hardhat deploy --network sepolia
```

### Current Deployments

See [Contract Addresses](../smart-contracts/addresses.md) for all deployed contract addresses.

## Post-Deployment Checklist

1. **Fund staking contract** — Transfer OEC tokens to the staking contract for rewards distribution
2. **Fund achievements contract** — Transfer OEC tokens for achievement reward payouts
3. **Fund faucet** — Transfer OEC tokens to the faucet for testnet distribution
4. **Create pools** — Use the Admin Panel to create staking pools with desired APR and lock periods
5. **Verify contracts** — Verify on Etherscan for transparency

{% hint style="info" %}
**No Backend Required:** The staking dApp is a pure client-side application. All data comes from on-chain contract reads — no server or database needed for the frontend.
{% endhint %}
