# Faucet

Claim test OEC tokens on Sepolia testnet.

**Source:** `client/src/pages/faucet.tsx`

## Overview

The Faucet page allows users to claim free test OEC tokens for use with the staking dApp on Sepolia testnet. A cooldown period prevents abuse.

## Display

| Field                      | Description                                   |
| -------------------------- | --------------------------------------------- |
| Faucet Balance             | OEC tokens remaining in the faucet contract   |
| Claim Amount               | OEC dispensed per claim                       |
| Your OEC Balance           | Connected wallet's current OEC balance        |
| Staking Rewards Balance    | OEC held by the staking contract for rewards  |
| Achievements Balance       | OEC held by the achievements contract         |

## Usage

1. Connect wallet to Sepolia
2. Click **Claim** to receive test OEC
3. If on cooldown, a countdown timer shows when the next claim is available

## States

| State           | Display                                          |
| --------------- | ------------------------------------------------ |
| Not connected   | Prompt to connect wallet                         |
| Can claim       | Active claim button                              |
| On cooldown     | Disabled button with countdown timer             |
| Faucet empty    | Warning that faucet needs to be refunded         |

{% hint style="info" %}
**Sepolia ETH Required:** You need Sepolia ETH for gas fees. Get some from a public Sepolia faucet (Alchemy, Infura, etc.) before claiming OEC.
{% endhint %}
