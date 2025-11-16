# QuestArcade Deployment Guide

## 🚀 Quick Deployment Steps

### Prerequisites
1. Make sure you have a `.env` file in `apps/contracts/` with:
   ```env
   PRIVATE_KEY=your_private_key_without_0x_prefix
   CELOSCAN_API_KEY=your_celoscan_api_key (optional, for verification)
   ```

2. Ensure you have CELO-S tokens in your wallet for gas fees on Celo Sepolia

### Step 1: Deploy Contracts

```bash
cd apps/contracts
pnpm deploy:sepolia
```

This will:
- Deploy QuestArcade with MockERC20 token (`0x05dc1bacbAeaDe0DBFbe2954a0e68b9bCD725708`)
- Deploy QuestRegistry, RewardsVault, and Reputation contracts
- Show you the new contract addresses

### Step 2: Update Frontend Configuration

After deployment, update `apps/web/.env.local` with the new addresses:

```env
NEXT_PUBLIC_DEFAULT_CHAIN_ID=11142220
NEXT_PUBLIC_QUEST_ARCADE_CONTRACT=<NEW_QUEST_ARCADE_ADDRESS>
NEXT_PUBLIC_QUEST_REGISTRY_CONTRACT=<NEW_QUEST_REGISTRY_ADDRESS>
NEXT_PUBLIC_REWARDS_VAULT_CONTRACT=<NEW_REWARDS_VAULT_ADDRESS>
NEXT_PUBLIC_REPUTATION_CONTRACT=<NEW_REPUTATION_ADDRESS>
NEXT_PUBLIC_STABLE_TOKEN_ADDRESS=0x05dc1bacbAeaDe0DBFbe2954a0e68b9bCD725708
```

### Step 3: Restart Dev Server

```bash
cd apps/web
# Stop current server (Ctrl+C)
pnpm dev
```

### Step 4: Mint Test Tokens

1. Go to the "Create Task" page
2. You'll see a "Get Test Tokens" card at the top
3. Click "Mint 1000 Test Tokens" to get tokens for testing

### Step 5: Create Your First Quest!

Now you can create quests using the test tokens you just minted.

## 📋 Deployment Configuration

The deployment uses the following configuration (in `apps/contracts/ignition/parameters/sepolia.json`):

- **Token Address**: `0x05dc1bacbAeaDe0DBFbe2954a0e68b9bCD725708` (MockERC20 - supports minting)
- **Fee Recipient**: `0x7e6a38d86e4a655086218c1648999e509b40e391`
- **Platform Fee**: 5% (500 basis points)

## 🔍 Verifying Deployment

After deployment, you can verify the contracts on Celo Sepolia Blockscout:
- Explorer: https://celo-sepolia.blockscout.com

## ⚠️ Important Notes

1. **Token Address**: The MockERC20 token is already deployed and supports public minting. Anyone can mint tokens for testing.

2. **Contract Addresses**: After redeployment, you'll get NEW contract addresses. Make sure to update your `.env.local` file.

3. **Gas Fees**: You need CELO-S (native Celo Sepolia tokens) for gas. Get them from: https://faucet.celo.org/celo-sepolia

4. **Test Tokens**: The MockERC20 token has no real value - it's only for testing on Celo Sepolia.

## 🐛 Troubleshooting

### "Insufficient funds for gas"
- Get CELO-S tokens from the faucet: https://faucet.celo.org/celo-sepolia

### "Contract already deployed"
- If you see this, the contracts are already deployed. Check `apps/contracts/ignition/deployments/chain-11142220/deployed_addresses.json` for addresses.

### "Token address mismatch"
- Make sure `NEXT_PUBLIC_STABLE_TOKEN_ADDRESS` in `.env.local` matches the token address used in deployment.

### "Cannot mint tokens"
- Make sure you're on Celo Sepolia network (Chain ID: 11142220)
- Verify the token address is correct: `0x05dc1bacbAeaDe0DBFbe2954a0e68b9bCD725708`

