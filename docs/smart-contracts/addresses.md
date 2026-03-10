# Contract Addresses

All deployed contract addresses for the OEC Staking ecosystem.

## Staking Contracts (Sepolia)

| Contract              | Address                                      | Description                    |
| --------------------- | -------------------------------------------- | ------------------------------ |
| MultiPoolStakingV2    | `0xd12664c1f09fa1561b5f952259d1eb5555af3265` | Main staking contract          |
| OEC Token             | `0x00904218319a045a96d776ec6a970f54741208e6` | ERC20 staking/rewards token    |
| AchievementRewards    | `0xbb0805254d328d1a542efb197b3a922c3fd97063` | Achievement tracking & rewards |
| OECFaucet             | `0x29c900b48079634e5b1e19508fa347340ee786bb` | Testnet token faucet           |

## Price Oracle (Sepolia)

| Contract         | Address                                      | Description                 |
| ---------------- | -------------------------------------------- | --------------------------- |
| Eloqura Factory  | `0x1a4C7849Dd8f62AefA082360b3A8D857952B3b8e` | DEX factory for pair lookup |
| USDC             | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | USDC token (pricing pair)   |

## ABI Files

Contract ABIs are stored in `client/src/services/abis/`:

| File                          | Contract                |
| ----------------------------- | ----------------------- |
| `MultiPoolStakingAPR.json`    | Staking V2              |
| `ERC20.json`                  | Standard ERC20          |
| `AchievementRewards.json`     | Achievements            |
| `OECFaucet.json`              | Faucet                  |

## Network Configuration

| Parameter     | Value                                     |
| ------------- | ----------------------------------------- |
| Network       | Sepolia Testnet                           |
| Chain ID      | 11155111                                  |
| RPC           | Alchemy Sepolia endpoint                  |
| Block Explorer| https://sepolia.etherscan.io              |

{% hint style="warning" %}
**Testnet Only:** All contracts are currently deployed to Sepolia. Mainnet deployment addresses will be added after launch.
{% endhint %}
