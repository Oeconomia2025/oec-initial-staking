# Dashboard & Achievements

User overview with wallet stats, staking positions, and the achievement system.

**Source:** `client/src/pages/dashboard.tsx`

## Overview

The Dashboard is the primary landing page showing a connected wallet's staking positions and achievement progress. Data refreshes automatically every 30 seconds.

## User Stats Cards

Five cards displayed at the top:

| Card             | Data Source                          | Description                     |
| ---------------- | ------------------------------------ | ------------------------------- |
| OEC Balance      | `balanceOf(wallet)` on OEC token     | Wallet balance + USD value      |
| Total Staked     | Sum of `balanceOf(poolId, wallet)`   | Staked across all pools + USD   |
| Pending Rewards  | Sum of `earned(poolId, wallet)`      | Claimable rewards + USD         |
| Active Pools     | `getUserActivePools(wallet).length`  | Number of pools user stakes in  |
| Total Holdings   | Balance + staked                     | Combined value + USD            |

USD values are calculated using the OEC/USDC price from Eloqura DEX pool reserves.

## Achievement Grid

Six achievement cards in a 3-column grid:

| Achievement    | Criteria                                    | Reward    |
| -------------- | ------------------------------------------- | --------- |
| First Stake    | Complete first staking transaction          | 5 OEC     |
| Diamond Hands  | Hold in 30-day+ pool for 30 days            | 50 OEC    |
| Pool Explorer  | Stake 100+ OEC in 2 long-term pools         | 100 OEC   |
| High Roller    | Stake 10,000+ OEC across 30-day+ pools      | 500 OEC   |
| Reward Hunter  | Earn 100+ OEC in rewards                    | 200 OEC   |
| Hodler         | Stake 2,000+ OEC in a long-term pool        | 1,000 OEC |

Each card shows:
- Icon and title
- Category badge (Beginner, Loyalty, Explorer, Whale, Strategy, Dedication)
- Reward amount
- Status indicator:
  - **Claimed** — Green checkmark
  - **Ready!** — Yellow pulsing badge with claim button
  - **Locked** — Gray, criteria not yet met

### Claim All

A "Claim All" button appears when multiple achievements are eligible, calling `claimAll()` on the AchievementRewards contract in a single transaction.

## Wallet States

| State              | Display                                         |
| ------------------ | ------------------------------------------------ |
| Not connected      | Banner prompting wallet connection               |
| Wrong network      | Warning to switch to Sepolia                     |
| Connected          | Full dashboard with stats and achievements       |

## Data Fetching

The dashboard uses Wagmi's `useReadContract` hooks to fetch:
- OEC token balance
- Per-pool staked balance and earned rewards
- Achievement eligibility and claim status
- OEC/USDC price from Eloqura DEX

All queries refresh on a 30-second interval.
