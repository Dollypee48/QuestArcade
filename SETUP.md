# Setup Guide

This guide will walk you through setting up QuestArcade from scratch. I'll cover everything you need to get the project running locally and ready for development.

## Prerequisites

Before you start, make sure you have these installed:

### Required Software

1. **Node.js** (version 18 or higher)
   - Check your version: `node --version`
   - Download from [nodejs.org](https://nodejs.org/) if needed

2. **PNPM** (version 8 or higher)
   - Install globally: `npm install -g pnpm`
   - Check version: `pnpm --version`

3. **Git** (for version control)
   - Most systems have this pre-installed
   - Check: `git --version`

### Optional but Recommended

- **VS Code** or your preferred code editor
- **MetaMask** browser extension (for wallet testing)
- **MiniPay** app (for mobile testing)

## Step 1: Clone and Install

First, get the project on your machine:

```bash
# Clone the repository
git clone <your-repo-url>
cd questArcade

# Install all dependencies
pnpm install
```

This might take a few minutes as it installs dependencies for both the web app and smart contracts.

## Step 2: Environment Configuration

You'll need to set up environment variables for the frontend to work properly.

### Create Environment File

Create a `.env.local` file in the `apps/web/` directory:

```bash
cd apps/web
touch .env.local
```

### Add Required Variables

Open `.env.local` and add these variables:

```env
# Network Configuration
NEXT_PUBLIC_DEFAULT_CHAIN_ID=11142220

# Contract Addresses (update these after deploying contracts)
NEXT_PUBLIC_QUEST_ARCADE_CONTRACT=0x0e2767305AD4bCE3C5deA1422c2da88D2345b663
NEXT_PUBLIC_QUEST_REGISTRY_CONTRACT=0x5E105dA0B4F15311F604eb0e34A3f46cB243BDB4
NEXT_PUBLIC_STABLE_TOKEN_ADDRESS=0x05dc1bacbAeaDe0DBFbe2954a0e68b9bCD725708

# WalletConnect (optional but recommended)
NEXT_PUBLIC_WC_PROJECT_ID=your-walletconnect-project-id
```

**Note**: The contract addresses above are for the deployed contracts on Celo Sepolia. If you're deploying your own contracts, you'll need to update these.

### Getting a WalletConnect Project ID

1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Sign up for a free account
3. Create a new project
4. Copy the Project ID
5. Add it to your `.env.local` file

This is optional but recommended for better wallet connection experience.

## Step 3: Deploy Smart Contracts (Optional)

If you want to deploy your own contracts instead of using the existing ones:

```bash
# Navigate to contracts directory
cd apps/contracts

# Compile contracts
pnpm compile

# Deploy to Celo Sepolia testnet
pnpm deploy:sepolia
```

After deployment, you'll see contract addresses in the terminal. Update your `.env.local` file with these new addresses.

### Getting Testnet Tokens

You'll need CELO tokens for gas fees on Celo Sepolia:
1. Visit [Celo Sepolia Faucet](https://faucet.celo.org/celo-sepolia)
2. Connect your wallet
3. Request test tokens

## Step 4: Start Development Server

Now you're ready to run the app:

```bash
# From the root directory
pnpm dev

# Or from apps/web
cd apps/web
npm run dev
```

The app should start on [http://localhost:3000](http://localhost:3000)

### What You Should See

- The app loads without errors
- You can see the homepage
- Wallet connection button is visible
- No console errors (check browser DevTools)

## Step 5: Connect Your Wallet

1. Click "Connect Wallet" in the navbar
2. Select MetaMask (or your preferred wallet)
3. Approve the connection
4. Make sure you're on Celo Sepolia network

If MetaMask doesn't have Celo Sepolia, you can add it:
- Network Name: Celo Sepolia
- RPC URL: `https://forno.celo-sepolia.celo-testnet.org`
- Chain ID: `11142220`
- Currency Symbol: `CELO`

## Step 6: Get Test Tokens

To create quests, you'll need test tokens:

1. Navigate to `/create-task` page
2. You'll see a "Get Test Tokens" card
3. Click "Mint 1000 Test Tokens"
4. Approve the transaction in your wallet
5. Wait for confirmation

Now you have tokens to create quests!

## Troubleshooting

### Issue: Dependencies won't install

**Solution**: 
- Make sure you're using Node.js 18+ and PNPM 8+
- Try deleting `node_modules` and `pnpm-lock.yaml`, then run `pnpm install` again
- Check your internet connection

### Issue: Environment variables not working

**Solution**:
- Make sure `.env.local` is in `apps/web/` directory (not root)
- Restart the dev server after changing env variables
- Check that variable names start with `NEXT_PUBLIC_` for client-side access

### Issue: Can't connect wallet

**Solution**:
- Make sure MetaMask is installed and unlocked
- Check that you're on the correct network (Celo Sepolia)
- Try refreshing the page
- Check browser console for errors

### Issue: Contract calls failing

**Solution**:
- Verify contract addresses in `.env.local` are correct
- Make sure you're on Celo Sepolia network
- Check that contracts are deployed and verified
- Ensure you have CELO tokens for gas

### Issue: Build errors

**Solution**:
- Run `pnpm install` again to ensure all dependencies are installed
- Check TypeScript errors: `pnpm type-check`
- Make sure all environment variables are set

## Development Tips

### Hot Reload

The Next.js dev server has hot reload enabled, so changes to your code will automatically refresh in the browser.

### TypeScript

The project uses TypeScript. If you see type errors:
- Check the error message in your editor
- Run `pnpm type-check` to see all type errors
- Fix type issues before committing

### Linting

Run the linter to check code quality:
```bash
pnpm lint
```

### Testing Locally

- Use MetaMask for desktop testing
- Use MiniPay for mobile testing (see TESTING.md)
- Test on different screen sizes (the app is mobile-responsive)

## Next Steps

Once setup is complete:

1. **Explore the app**: Browse quests, create a test quest, accept a quest
2. **Read the code**: Check out `apps/web/src/` to understand the structure
3. **Check USAGE.md**: Learn how to use all the features
4. **Review TESTING.md**: Learn how to test on MiniPay

## Need Help?

If you're stuck:
- Check the error messages in the terminal and browser console
- Review the code comments (I tried to document everything)
- Check the README.md for overview
- Review USAGE.md for feature documentation

Good luck with your setup! 🚀

