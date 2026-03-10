# Admin Panel

Owner-only pool management and contract configuration.

**Source:** `client/src/pages/admin.tsx`

## Overview

The Admin Panel is restricted to the contract owner's wallet address. It provides forms for creating pools, updating parameters, and managing the staking contract.

{% hint style="warning" %}
**Owner Only:** The admin page checks the connected wallet against the contract's `owner()` function. Non-owner wallets see an access denied message.
{% endhint %}

## Admin Functions

### Create Pool

| Field            | Type    | Description                             | Constraints        |
| ---------------- | ------- | --------------------------------------- | ------------------ |
| Staking Token    | address | Token to stake (default: OEC)           | Valid ERC20         |
| Rewards Token    | address | Token for rewards (default: OEC)        | Valid ERC20         |
| APR              | uint256 | Annual rate in basis points             | Max 5000 (50%)     |
| Lock Period      | uint256 | Lock duration in seconds                | Max 365 days       |

### Update APR

Change the APR for an existing pool. Takes effect immediately for future reward accrual.

### Update Lock Period

Change the lock duration for an existing pool. Only affects new deposits — existing stakes keep their original lock.

### Update Early Penalty

Change the early withdrawal penalty percentage for a pool.

### Set Penalty Recipient

Change the address that receives penalty tokens from early withdrawals.

### Recover Tokens

Rescue tokens accidentally sent to the staking contract. Cannot recover staked tokens.

## Contract Status Display

| Field               | Description                              |
| ------------------- | ---------------------------------------- |
| Owner Address       | Current contract owner                   |
| Paused Status       | Whether the contract is paused           |
| Penalty Recipient   | Current penalty token recipient          |
| Pool List           | All pools with APR, lock, penalty, TVL   |

## Pause / Unpause

Emergency controls to halt all staking and withdrawal operations. Only the owner can pause and unpause.
