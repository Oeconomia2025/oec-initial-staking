# Architecture

High-level overview of the OEC Staking dApp architecture and contract interactions.

## System Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     React Frontend                        │
│  (Vite + TypeScript + Tailwind + Wagmi + Framer Motion)   │
│                                                           │
│  Dashboard │ Pools │ ROI Calc │ Faucet │ Admin            │
└──────┬──────────────────────────────────┬─────────────────┘
       │                                  │
       │  Contract Reads/Writes           │  Price Oracle
       │  (Wagmi / Viem)                  │  (Eloqura DEX)
       ▼                                  ▼
┌──────────────────┐           ┌─────────────────────────┐
│  Sepolia RPC     │           │  Eloqura Factory        │
│  (Alchemy)       │           │  0x1a4C7849...          │
│                  │           │                         │
│  ┌─────────────┐ │           │  getPair() → reserves   │
│  │ Staking V2  │ │           │  → OEC/USDC price       │
│  │ 0xd126...   │ │           └─────────────────────────┘
│  └─────────────┘ │
│  ┌─────────────┐ │
│  │ OEC Token   │ │
│  │ 0x0090...   │ │
│  └─────────────┘ │
│  ┌─────────────┐ │
│  │ Achievements│ │
│  │ 0xbb08...   │ │
│  └─────────────┘ │
│  ┌─────────────┐ │
│  │ Faucet      │ │
│  │ 0x29c9...   │ │
│  └─────────────┘ │
└──────────────────┘
```

## Frontend Structure

```
client/src/
├── pages/                  # Route-level page components
│   ├── dashboard.tsx        # Wallet stats + achievements
│   ├── pools.tsx            # Pool cards + stake/withdraw/claim
│   ├── roi-calculator.tsx   # Return projections
│   ├── admin.tsx            # Owner-only pool management
│   ├── faucet.tsx           # Test token claims
│   └── not-found.tsx        # 404 page
├── components/              # Reusable UI components
│   ├── layout.tsx           # Collapsible sidebar layout
│   ├── wallet-connect.tsx   # Multi-wallet connection dialog
│   ├── ecosystem-sidebar.tsx # Right-edge protocol links
│   ├── early-withdraw-modal.tsx # Penalty confirmation
│   └── oec-loader.tsx       # Branded loading spinner
├── hooks/                   # Custom React hooks
│   ├── use-staking-contract.ts
│   └── use-toast.ts
├── services/                # Contract ABIs and helpers
│   ├── staking-contract.ts  # Contract addresses & config
│   └── abis/                # JSON ABIs
│       ├── MultiPoolStakingAPR.json
│       ├── ERC20.json
│       ├── AchievementRewards.json
│       └── OECFaucet.json
├── lib/                     # Wagmi config, query client
│   ├── wagmi.ts
│   └── queryClient.ts
└── App.tsx                  # Router and providers
```

## Contract Architecture

```
                    ┌─────────────────────┐
                    │  OEC Token (ERC20)  │
                    │  Standard token     │
                    └─────┬────────┬──────┘
                          │        │
              approve()   │        │  transfer()
                          ▼        ▼
┌─────────────────────┐        ┌──────────────────────┐
│  MultiPoolStakingV2 │        │  AchievementRewards  │
│                     │        │                      │
│  - stake()          │        │  - claim()           │
│  - withdraw()       │◄──────►│  - claimAll()        │
│  - getReward()      │ reads  │  - getUserStatus()   │
│  - earlyWithdraw()  │        │                      │
│  - claimAllRewards()│        │  Checks staking      │
│  - unstakeAll()     │        │  state for eligibility│
│  - restakeRewards() │        └──────────────────────┘
└─────────────────────┘
         ▲
         │  funded by owner
         │  (OEC transferred in)
```

## Data Flow

1. **Price**: Eloqura Factory → `getPair(OEC, USDC)` → `getReserves()` → price = USDC reserve / OEC reserve
2. **Staking**: User approves OEC → calls `stake(poolId, amount)` → rewards accrue linearly per second
3. **Rewards**: `earned(poolId, account)` calculates pending rewards → `getReward()` or `withdraw()` to claim
4. **Achievements**: `getUserStatus(account)` returns eligibility arrays → `claim(id)` or `claimAll()` to collect

## Key Design Decisions

- **No backend server**: Pure client-side dApp, all data from on-chain reads
- **Fixed APR (not APY)**: Simple linear rewards, no compounding complexity
- **V2 auto-claim**: Withdrawals automatically claim pending rewards (V1 required separate claim)
- **On-chain counters**: Active staker/stake counts tracked in contract for TVL display
- **Eloqura as price oracle**: OEC/USDC price derived from Eloqura DEX pool reserves
