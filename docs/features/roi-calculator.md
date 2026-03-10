# ROI Calculator

Project staking returns before committing funds.

**Source:** `client/src/pages/roi-calculator.tsx`

## Overview

The ROI Calculator lets users estimate their staking rewards based on a chosen amount, duration, and pool. It uses simple interest (not compound) to match the on-chain reward calculation.

## Inputs

| Input          | Description                                           |
| -------------- | ----------------------------------------------------- |
| Stake Amount   | Number of OEC tokens to stake                         |
| Staking Period | Duration in days (quick buttons: 30d, 60d, 90d, 1y)  |
| Pool           | Select a pool to use its APR for calculation          |

## Results

| Output          | Calculation                                         |
| --------------- | --------------------------------------------------- |
| Principal       | Input amount                                        |
| Total Rewards   | `principal × (apr / 100) × (days / 365)`            |
| Total Value     | Principal + rewards                                 |
| ROI %           | `(rewards / principal) × 100`                       |
| Daily Rewards   | `totalRewards / days`                               |
| Monthly Rewards | `dailyRewards × 30`                                |

## Calculation Method

```
totalRewards = principal × (apr / 100) × (days / 365)
```

This matches the contract's linear reward accrual — rewards accumulate at a constant rate per second, not compounded.

{% hint style="info" %}
**No Wallet Required:** The ROI Calculator works without a connected wallet. Pool APR data is read from the contract, but calculations are performed client-side.
{% endhint %}

## Collapsible UI

The calculator section can be collapsed/expanded with a chevron toggle, keeping the page clean when not in use.
