# OEC Staking

Multi-pool staking dApp for the OEC token with fixed APR rewards, configurable lock periods, achievement system, and testnet faucet.

**Live:** [https://staking.oeconomia.io](https://staking.oeconomia.io)

## Key Features

| Feature          | Description                                                        |
| ---------------- | ------------------------------------------------------------------ |
| Multi-Pool       | Multiple staking pools with different APR tiers and lock periods   |
| Fixed APR        | Linear reward accrual based on time staked (not compounded)        |
| Lock Periods     | Configurable per pool (flexible, 30-day, 90-day, 365-day)         |
| Early Withdrawal | Exit before lock expires with configurable penalty                 |
| Achievements     | 6 on-chain achievements with OEC rewards (up to 1,855 OEC total)  |
| Batch Operations | Claim all rewards, unstake all, restake rewards in one transaction |
| ROI Calculator   | Project staking returns before committing                          |
| Testnet Faucet   | Claim test OEC tokens on Sepolia                                   |
| Admin Panel      | Owner-only pool management and configuration                      |

## Contract Addresses (Sepolia)

| Contract      | Address                                      |
| ------------- | -------------------------------------------- |
| Staking V2    | `0xd12664c1f09fa1561b5f952259d1eb5555af3265` |
| OEC Token     | `0x00904218319a045a96d776ec6a970f54741208e6` |
| Achievements  | `0xbb0805254d328d1a542efb197b3a922c3fd97063` |
| Faucet        | `0x29c900b48079634e5b1e19508fa347340ee786bb` |

## Tech Stack

| Layer          | Technology                                           |
| -------------- | ---------------------------------------------------- |
| Frontend       | React 18, TypeScript, Vite, Tailwind CSS             |
| Routing        | Wouter                                               |
| Web3           | Wagmi 2, Viem, ethers.js 6                           |
| State          | TanStack Query (React Query)                         |
| UI             | Radix UI (shadcn/ui), Lucide React, Framer Motion    |
| Smart Contracts| Solidity 0.8.27, Hardhat, OpenZeppelin               |
| Deployment     | Netlify (frontend), Hardhat (contracts to Sepolia)   |
