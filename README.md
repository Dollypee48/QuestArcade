# QuestArcade 🎮

A gamified quest platform built on Celo blockchain that lets users complete real-world missions and earn cUSD rewards instantly through MiniPay. Think of it as a play-to-earn platform where community tasks become engaging quests.

## What is QuestArcade?

QuestArcade is a Web3 application that transforms everyday tasks into gamified quests. Users can browse available quests, accept missions, complete them in the real world, submit proof (photos/videos/GPS), and get rewarded with cUSD tokens directly in their MiniPay wallet.

### Key Features

- 🎯 **Quest Management**: Create, accept, and complete quests with on-chain verification
- 💰 **Instant Rewards**: Earn cUSD directly in your MiniPay wallet with gasless transactions
- 📸 **Proof Submission**: Upload photo/video evidence or GPS verification stored on IPFS
- 🏆 **Gamification**: Track XP, reputation, streaks, and climb the leaderboard
- 🔐 **On-Chain Security**: All quest data, rewards, and reputation stored on Celo blockchain
- 📱 **Mobile-First**: Optimized for MiniPay and mobile devices

## Tech Stack

I built this using modern web3 technologies:

- **Frontend**: Next.js 14 (App Router), TypeScript, React 18
- **Styling**: Tailwind CSS with custom gamified UI components
- **Blockchain**: Celo (Sepolia testnet), Wagmi, Viem
- **Wallet**: RainbowKit with MetaMask and MiniPay support
- **State Management**: Zustand for global game state
- **Storage**: IPFS (Pinata) for quest proofs and metadata
- **Monorepo**: Turborepo for managing multiple packages
- **Package Manager**: PNPM

## Project Structure

```
questArcade/
├── apps/
│   ├── web/              # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/      # Next.js app router pages
│   │   │   ├── components/  # React components
│   │   │   ├── hooks/    # Custom React hooks
│   │   │   ├── store/    # Zustand state management
│   │   │   └── lib/      # Utility functions
│   │   └── public/       # Static assets
│   └── contracts/        # Hardhat smart contracts
│       ├── contracts/    # Solidity contracts
│       └── scripts/     # Deployment scripts
├── package.json          # Root workspace config
└── turbo.json           # Turborepo configuration
```

## Quick Start

### Prerequisites

Make sure you have these installed:
- Node.js 18+ 
- PNPM 8+
- A Celo wallet (MetaMask or MiniPay)

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repo-url>
   cd questArcade
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in `apps/web/`:
   ```env
   NEXT_PUBLIC_DEFAULT_CHAIN_ID=11142220
   NEXT_PUBLIC_QUEST_ARCADE_CONTRACT=<your-contract-address>
   NEXT_PUBLIC_QUEST_REGISTRY_CONTRACT=<your-registry-address>
   NEXT_PUBLIC_STABLE_TOKEN_ADDRESS=0x05dc1bacbAeaDe0DBFbe2954a0e68b9bCD725708
   NEXT_PUBLIC_WC_PROJECT_ID=<your-walletconnect-project-id>
   ```

4. **Start the development server**:
   ```bash
   pnpm dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

That's it! The app should be running locally.

## Available Scripts

### Development
- `pnpm dev` - Start all development servers
- `pnpm build` - Build all packages for production
- `pnpm lint` - Run ESLint on all packages
- `pnpm type-check` - Run TypeScript type checking

### Smart Contracts
- `pnpm contracts:compile` - Compile Solidity contracts
- `pnpm contracts:test` - Run contract tests
- `pnpm contracts:deploy:sepolia` - Deploy to Celo Sepolia testnet

### Web App (from `apps/web/`)
- `npm run dev` - Start Next.js dev server
- `npm run dev:tunnel` - Start dev server + ngrok tunnel (for MiniPay testing)
- `npm run build` - Build for production
- `npm run start` - Start production server

## Smart Contracts

The project includes several Solidity contracts:

- **QuestArcade.sol**: Main contract handling quest lifecycle, escrow, and rewards
- **QuestRegistry.sol**: Manages quest metadata and discovery
- **Reputation.sol**: Tracks user XP and reputation scores
- **RewardsVault.sol**: Handles reward distribution

Contracts are deployed on Celo Sepolia testnet. See `apps/contracts/` for more details.

## Key Components

### Frontend Architecture

- **Pages**: Next.js App Router pages (`/dashboard`, `/quests`, `/create-task`, etc.)
- **Components**: Reusable UI components in `src/components/`
- **Hooks**: Custom hooks for blockchain interactions (`use-quest-actions.ts`, `use-quest-arcade.ts`)
- **Store**: Zustand store for global state management (`use-game-store.ts`)
- **Providers**: Context providers for wallet, theme, and data sync

### State Management

I use Zustand for global state because it's lightweight and works great with React. The store manages:
- User profile and wallet connection
- Quest data (all quests, user's quests, accepted quests)
- User progress (XP, reputation, streaks)
- Balance and token information
- Notifications

## Configuration

### Network Configuration

The app is configured for Celo Sepolia testnet (Chain ID: 11142220). You can change this in:
- `apps/web/src/config/contractConfig.ts` - Contract addresses and chain config
- `apps/web/.env.local` - Environment variables

### WalletConnect

For wallet connections, you'll need a WalletConnect Project ID. Get one for free at [cloud.walletconnect.com](https://cloud.walletconnect.com) and add it to your `.env.local`.

## Testing on MiniPay

To test the app on MiniPay, I've set up ngrok tunneling. Check out the [TESTING.md](./TESTING.md) guide for detailed instructions.

Quick version:
1. Run `npm run dev:tunnel` from `apps/web/`
2. Copy the ngrok HTTPS URL
3. Load it in MiniPay Developer Settings

## Deployment

### Frontend Deployment

The Next.js app can be deployed to Vercel, Netlify, or any Node.js hosting:

```bash
cd apps/web
npm run build
npm run start
```

### Smart Contract Deployment

Deploy contracts to Celo Sepolia:

```bash
cd apps/contracts
pnpm deploy:sepolia
```

Make sure to update your frontend environment variables with the new contract addresses.

## Contributing

This is my personal project, but if you want to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this for your own projects!

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Celo Documentation](https://docs.celo.org/)
- [Wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)

## Support

If you run into issues:
1. Check the [SETUP.md](./SETUP.md) guide for detailed setup instructions
2. See [TESTING.md](./TESTING.md) for testing help
3. Review the code comments - I tried to document everything well

---

Built with ❤️ on Celo blockchain
