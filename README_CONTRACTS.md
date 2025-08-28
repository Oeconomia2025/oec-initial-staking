# OEC Staking Contract Integration

This document explains how to set up and deploy the MultiPoolStakingAPR contract for the OEC staking dapp.

## Prerequisites

1. Node.js (version 18 or higher recommended)
2. npm or yarn package manager

## Hardhat Setup

The project uses Hardhat for smart contract development and testing. The Hardhat configuration is in `hardhat.config.js`.

### Installing Dependencies

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-ethers ethers
```

### Compiling Contracts

```bash
npx hardhat compile
```

### Running Tests

```bash
npx hardhat test
```

## Contract Deployment

### Deploying to Local Network

1. Start a local Hardhat network:
   ```bash
   npx hardhat node
   ```

2. In a separate terminal, deploy the contract:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

### Deploying to Testnet/Mainnet

1. Configure your network in `hardhat.config.js`:
   ```javascript
   networks: {
     sepolia: {
       url: `https://sepolia.infura.io/v3/YOUR_INFURA_KEY`,
       accounts: [process.env.PRIVATE_KEY]
     }
   }
   ```

2. Deploy the contract:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

## Contract Integration with Frontend

The frontend integrates with the contract through:

1. ABI file: `client/src/services/abis/MultiPoolStakingAPR.json`
2. Service file: `client/src/services/staking-contract.ts`
3. Pool page: `client/src/pages/pools.tsx`

### Updating Contract Address

After deploying the contract, update the `CONTRACT_ADDRESS` constant in `client/src/services/staking-contract.ts` with the deployed address.

## Available Contract Functions

The contract provides the following main functions:

- `stake(poolId, amount)` - Stake tokens in a pool
- `withdraw(poolId, amount)` - Withdraw staked tokens after lock period
- `earlyWithdraw(poolId, amount)` - Withdraw with penalty before lock period
- `getReward(poolId)` - Claim earned rewards
- `exit(poolId)` - Withdraw and claim rewards in one transaction
- `emergencyWithdraw(poolId)` - Emergency withdrawal (forfeit rewards)

## Testing

Run the test suite with:
```bash
npx hardhat test
```

## Troubleshooting

### Node.js Version Issues

Hardhat may show warnings about Node.js versions. Consider using Node.js version 18 or 20 for best compatibility.

### Compilation Errors

If you encounter compilation errors:
1. Check that all import paths in the Solidity contract are correct
2. Ensure OpenZeppelin contracts are accessible
3. Run `npx hardhat clean` and then `npx hardhat compile`