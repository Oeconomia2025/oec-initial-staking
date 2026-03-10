# Staking Pools

Browse, stake, withdraw, and manage positions across multiple staking pools.

**Source:** `client/src/pages/pools.tsx`

## Overview

The Pools page displays all available staking pools as expandable cards. Each pool has independent APR, lock period, and penalty settings. Users can stake, withdraw, claim rewards, or exit early with a penalty.

## Pool Cards

Each pool card displays:

| Field           | Description                                          |
| --------------- | ---------------------------------------------------- |
| Pool Name       | e.g., "OEC 30-Day Lock"                             |
| APR             | Annual percentage rate (from `aprBps / 100`)         |
| Lock Period     | Duration in days (or "Flexible" if 0)                |
| Lock Remaining  | Countdown: "Unlocks in 5d 3h" or "Unlocked"         |
| Your Staked     | User's balance in this pool                          |
| Pending Rewards | User's earned rewards                                |
| TVL             | Total tokens staked in pool (`totalSupply`)           |

Cards use gradient borders (cyan, purple, green, orange) to visually distinguish pools.

## Expanded Pool View

Clicking a pool card reveals three tabs:

### Stake Tab

Two-step process:
1. **Approve** — One-time approval for the staking contract to spend OEC
2. **Stake** — Enter amount and confirm deposit

{% hint style="warning" %}
**Lock Reset:** Staking additional tokens into a pool that has a lock period will **reset your lock timer**. Your entire balance starts a new lock period.
{% endhint %}

### Withdraw Tab

- Only enabled when the lock period has expired
- Enter amount to withdraw
- Withdrawal automatically claims all pending rewards (V2 auto-claim)

### Claim Rewards Tab

- Shows current pending rewards
- Claim without withdrawing your staked principal

## Early Withdrawal

Available for locked pools before the lock period expires. Accessed via a separate button on the pool card.

**Early Withdrawal Modal** shows:
- Original staked amount
- Penalty percentage (e.g., 10%)
- Penalty amount deducted
- Net amount received
- Warning: "All accrued rewards will be forfeited"

Requires explicit confirmation before executing.

## On-Chain Data Fetched

| Contract Call                         | Purpose                        |
| ------------------------------------- | ------------------------------ |
| `poolCount()`                         | Number of pools to display     |
| `pools(poolId)` for each pool         | APR, lock period, total supply |
| `balanceOf(poolId, wallet)`           | User's staked balance          |
| `earned(poolId, wallet)`              | User's pending rewards         |
| `getDepositTimestamp(poolId, wallet)` | Lock expiry calculation        |
| `earlyPenaltyBps(poolId)`            | Penalty rate for early exit    |
| `allowance(wallet, stakingContract)` | Whether approval is needed     |

## Batch Operations

Available from the layout header when staking in multiple pools:
- **Claim All Rewards** — `claimAllRewards()` claims from every pool in one tx
- **Unstake All** — `unstakeAll()` withdraws + claims from all unlocked pools
