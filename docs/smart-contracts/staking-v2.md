# Staking Contract (V2)

Multi-pool staking with fixed APR rewards, configurable lock periods, and batch operations.

**Source:** `staking_MultiPoolStakingAPRV2.sol`
**Address (Sepolia):** `0xd12664c1f09fa1561b5f952259d1eb5555af3265`

## Overview

MultiPoolStakingAPRV2 is an upgradeable staking contract supporting unlimited pools, each with independent APR, lock period, and early withdrawal penalty settings. V2 adds auto-claim on withdrawal, batch operations, and on-chain staker/stake counters.

**Inherited Contracts:** ReentrancyGuard, Pausable, Ownable, SafeERC20 (OpenZeppelin)

## Reward Calculation

Rewards accrue linearly based on time staked (simple interest, not compound):

```
aprPerSecondWad = (aprBps * 1e18) / 10000 / 31536000

rewardPerToken = storedRewardPerToken + (timeDelta * aprPerSecondWad)

userEarned = (userBalance * (rewardPerToken - userPaidRate)) / 1e18 + storedRewards
```

| Term                | Description                                    |
| ------------------- | ---------------------------------------------- |
| `aprBps`            | APR in basis points (100 bps = 1%)             |
| `WAD`               | 1e18 (fixed-point precision)                   |
| `SECONDS_PER_YEAR`  | 31,536,000                                     |
| `aprPerSecondWad`   | Per-second reward rate in WAD precision         |
| `rewardPerToken`    | Cumulative reward rate per token staked         |

## User Functions

| Function                      | Description                                             |
| ----------------------------- | ------------------------------------------------------- |
| `stake(poolId, amount)`       | Deposit tokens to earn rewards. Resets lock timer.      |
| `withdraw(poolId, amount)`    | Withdraw + auto-claim rewards (requires lock expired)   |
| `earlyWithdraw(poolId, amount)`| Exit before lock expires with penalty                  |
| `getReward(poolId)`           | Claim pending rewards only (no withdrawal)              |
| `claimAllRewards()`           | Claim rewards from all pools in one transaction         |
| `unstakeAll()`                | Withdraw + claim from all unlocked pools                |
| `restakeRewards(poolId)`      | Claim rewards and re-stake them into the same pool      |

## View Functions

| Function                             | Returns                                  |
| ------------------------------------ | ---------------------------------------- |
| `earned(poolId, account)`            | Pending rewards (uint256)                |
| `balanceOf(poolId, account)`         | Staked balance (uint256)                 |
| `getDepositTimestamp(poolId, account)`| Last deposit time (uint256)              |
| `isLockExpired(poolId, account)`     | Whether lock period has passed (bool)    |
| `getUserActivePools(account)`        | Array of pool IDs the user is staking in |
| `poolCount()`                        | Total number of pools (uint256)          |
| `activeStakerCount(poolId)`          | Unique stakers in pool (uint256)         |
| `activeStakeCount(poolId)`           | Total active stakes in pool (uint256)    |
| `globalActiveStakerCount()`          | Unique stakers across all pools          |
| `globalActiveStakeCount()`           | Total stakes across all pools            |

## Lock Period Mechanics

1. User stakes → `depositTimestamp` set to `block.timestamp`
2. Adding more to the same pool **resets** the lock timer
3. Withdrawal requires: `block.timestamp >= depositTimestamp + lockPeriod`
4. `earlyWithdraw()` available anytime before lock expires

## Early Withdrawal Penalty

When a user calls `earlyWithdraw()`:
- **All accrued rewards are forfeited** (reset to zero)
- A percentage of the principal is deducted: `penalty = amount * earlyPenaltyBps / 10000`
- User receives: `amount - penalty`
- Penalty tokens are sent to `penaltyRecipient` (configurable by owner)

Example: 10% penalty (1000 bps) on 100 OEC → user receives 90 OEC, 10 OEC goes to penalty recipient.

## Fee-on-Transfer Support

The `stake()` function measures actual tokens received after transfer:

```solidity
uint256 balBefore = stakingToken.balanceOf(address(this));
stakingToken.safeTransferFrom(msg.sender, address(this), amount);
uint256 actualAmount = stakingToken.balanceOf(address(this)) - balBefore;
```

This ensures correct accounting for tokens with transfer fees.

## Admin Functions

| Function                              | Description                           |
| ------------------------------------- | ------------------------------------- |
| `addPool(token, rewards, apr, lock)`  | Create a new staking pool             |
| `setAprBps(poolId, aprBps)`          | Update pool APR                       |
| `setLockPeriod(poolId, seconds)`     | Update pool lock duration             |
| `setEarlyPenaltyBps(poolId, bps)`   | Update early withdrawal penalty       |
| `setPenaltyRecipient(address)`       | Set penalty token recipient           |
| `pause() / unpause()`               | Emergency pause/resume all operations |
| `recoverTokens(token, amount)`       | Rescue tokens sent to contract        |

{% hint style="warning" %}
**APR Limits:** Maximum APR is 5000 bps (50%). Maximum lock period is 365 days (31,536,000 seconds).
{% endhint %}

## Events

| Event                                           | Emitted When                  |
| ----------------------------------------------- | ----------------------------- |
| `Staked(user, poolId, amount)`                  | User stakes tokens            |
| `Withdrawn(user, poolId, amount)`               | User withdraws tokens         |
| `RewardPaid(user, poolId, reward)`              | Rewards claimed               |
| `EarlyWithdrawal(user, poolId, amount, penalty)`| Early withdrawal with penalty |
| `PoolAdded(poolId, token, rewards, apr, lock)` | New pool created              |
| `AprUpdated(poolId, newApr)`                   | Pool APR changed              |
