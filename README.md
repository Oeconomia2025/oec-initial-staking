# OEC Initial Staking

This is the OEC Initial Staking dapp, a decentralized application for staking OEC tokens and earning rewards.

## Features

- Multi-pool staking with different lock periods and APYs
- Fixed APR reward system
- Early withdrawal with penalties
- Emergency withdrawal option
- Wallet integration with MetaMask and other Web3 wallets

## Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn package manager
- A Web3 wallet (MetaMask, Coinbase Wallet, etc.)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev:client
   ```

4. Open your browser to http://localhost:5173

## Smart Contract Integration

This dapp integrates with the MultiPoolStakingAPR smart contract. For detailed information about the contract setup, deployment, and integration, see [README_CONTRACTS.md](README_CONTRACTS.md).

### Contract Features

- Multiple staking pools with different APRs and lock periods
- Fixed APR reward calculation
- Support for fee-on-transfer tokens
- Emergency withdrawal functionality
- Owner controls for pool management

## Development

### Frontend

The frontend is built with:
- React
- TypeScript
- Vite
- Tailwind CSS
- wagmi for wallet integration

### Smart Contracts

The smart contracts are written in Solidity and use:
- Hardhat for development and testing
- OpenZeppelin contracts for security
- Ethers.js for blockchain interactions

## Available Scripts

- `npm run dev:client` - Start the development server
- `npm run build` - Build the production version
- `npm run dev` - Run the backend server (if applicable)

## Deployment

### Frontend

The frontend can be deployed to any static hosting service like Netlify, Vercel, or GitHub Pages.

### Smart Contracts

For smart contract deployment instructions, see [README_CONTRACTS.md](README_CONTRACTS.md).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or support, please open an issue on the GitHub repository.
