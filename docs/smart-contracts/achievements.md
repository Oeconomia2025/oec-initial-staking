# Achievement Rewards

On-chain achievement system rewarding users for staking milestones.

**Address (Sepolia):** `0xbb0805254d328d1a542efb197b3a922c3fd97063`

## Overview

The AchievementRewards contract tracks 6 staking achievements, each with eligibility criteria checked against the staking contract state. Users can claim OEC rewards for achievements they've completed. Each achievement can only be claimed once per address.

## Achievements

| ID | Name           | Requirement                                        | Reward    | Category   |
| -- | -------------- | -------------------------------------------------- | --------- | ---------- |
| 0  | First Stake    | Complete first staking transaction                 | 5 OEC     | Beginner   |
| 1  | Diamond Hands  | Hold staked tokens in 30-day+ pool for 30 days     | 50 OEC    | Loyalty    |
| 2  | Pool Explorer  | Stake 100+ OEC in 2 different long-term pools      | 100 OEC   | Explorer   |
| 3  | High Roller    | Stake 10,000+ OEC across 30-day+ pools             | 500 OEC   | Whale      |
| 4  | Reward Hunter  | Earn 100+ OEC in staking rewards                   | 200 OEC   | Strategy   |
| 5  | Hodler         | Stake 2,000+ OEC in a long-term pool               | 1,000 OEC | Dedication |

**Maximum per user:** 1,855 OEC (if all 6 achievements are claimed)

## Functions

| Function                  | Description                                        |
| ------------------------- | -------------------------------------------------- |
| `getUserStatus(account)`  | Returns `(bool[] eligible, bool[] claimed)` arrays |
| `claim(achievementId)`    | Claim a single achievement reward                  |
| `claimAll()`              | Claim all eligible achievements in one transaction |

## How It Works

1. The contract reads staking state from the MultiPoolStakingV2 contract
2. `getUserStatus()` checks each achievement's criteria against on-chain data
3. Returns two boolean arrays: which achievements are eligible, which are already claimed
4. User calls `claim(id)` or `claimAll()` to receive OEC rewards
5. Claimed achievements are marked and cannot be claimed again

{% hint style="info" %}
**Funding:** The AchievementRewards contract must hold sufficient OEC tokens to pay out rewards. The faucet page displays the contract's current OEC balance.
{% endhint %}
