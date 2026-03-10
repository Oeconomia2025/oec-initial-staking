# Faucet

Testnet faucet contract for distributing test OEC tokens on Sepolia.

**Address (Sepolia):** `0x29c900b48079634e5b1e19508fa347340ee786bb`

## Overview

The OECFaucet contract distributes test OEC tokens to users on Sepolia testnet. Each claim dispenses a fixed amount with a cooldown period between claims.

## Functions

| Function              | Description                                        |
| --------------------- | -------------------------------------------------- |
| `claim()`             | Request test OEC tokens                            |
| `canClaim(address)`   | Check if address is eligible and time until next claim |
| `claimAmount()`       | Amount of OEC dispensed per claim                  |
| `faucetBalance()`     | Current OEC balance available in the faucet        |

## Usage

1. Connect wallet to Sepolia testnet
2. Navigate to the Faucet page
3. Click **Claim** to receive test OEC
4. Wait for the cooldown period before claiming again

{% hint style="info" %}
**Gas Required:** Users need Sepolia ETH for gas fees. Use a public Sepolia faucet (e.g., Alchemy, Infura) to get test ETH first.
{% endhint %}
