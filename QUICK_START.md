# 🚀 QuestArcade Quick Start Guide

## Current Status

✅ **Configuration Complete!** Everything is set up and ready for deployment.

## What's Been Configured

1. ✅ **Deployment Config**: Updated to use MockERC20 token (`0x05dc1bacbAeaDe0DBFbe2954a0e68b9bCD725708`)
2. ✅ **Frontend Config**: Updated to use MockERC20 token
3. ✅ **Mint Component**: Added to Create Task page for easy token minting
4. ✅ **Error Handling**: Improved error messages for token mismatches
5. ✅ **Deployment Script**: Created helper script for easy deployment

## Next Steps (You Need To Do)

### 1. Deploy Contracts

Run this command:

```bash
cd apps/contracts
pnpm deploy:sepolia
```

Or use the helper script:

```bash
cd apps/contracts
./scripts/deploy-sepolia.sh
```

**What this does:**
- Deploys QuestArcade with MockERC20 token
- Deploys QuestRegistry, RewardsVault, and Reputation
- Shows you the new contract addresses

### 2. Update Environment Variables

After deployment, update `apps/web/.env.local` with the NEW contract addresses:

```env
NEXT_PUBLIC_DEFAULT_CHAIN_ID=11142220
NEXT_PUBLIC_QUEST_ARCADE_CONTRACT=<NEW_ADDRESS_FROM_DEPLOYMENT>
NEXT_PUBLIC_QUEST_REGISTRY_CONTRACT=<NEW_ADDRESS_FROM_DEPLOYMENT>
NEXT_PUBLIC_REWARDS_VAULT_CONTRACT=<NEW_ADDRESS_FROM_DEPLOYMENT>
NEXT_PUBLIC_REPUTATION_CONTRACT=<NEW_ADDRESS_FROM_DEPLOYMENT>
NEXT_PUBLIC_STABLE_TOKEN_ADDRESS=0x05dc1bacbAeaDe0DBFbe2954a0e68b9bCD725708
```

### 3. Restart Dev Server

```bash
cd apps/web
# Stop current server (Ctrl+C)
pnpm dev
```

### 4. Mint Test Tokens

1. Go to **Create Task** page (`/create-task`)
2. You'll see a **"Get Test Tokens"** card at the top
3. Click **"Mint 1000 Test Tokens"**
4. Wait for transaction confirmation

### 5. Create Your First Quest! 🎉

Now you can create quests using the test tokens!

## Why Redeployment is Needed

The current QuestArcade contract (`0x9d9e0310b65DE1c4e5b25Fa665d24d11787f0e8a`) was deployed with an invalid token address (`0x7e6a38d86e4a655086218c1648999e509b40e391` - not a valid ERC20 contract).

After redeployment:
- ✅ Contract will use MockERC20 (valid ERC20 with minting)
- ✅ Frontend will match the contract's token address
- ✅ You can mint test tokens easily
- ✅ Quest creation will work perfectly!

## Troubleshooting

### "Insufficient funds for gas"
Get CELO-S tokens from: https://faucet.celo.org/celo-sepolia

### "Token address mismatch"
Make sure you updated `.env.local` with the NEW contract addresses after deployment.

### "Cannot mint tokens"
- Verify you're on Celo Sepolia (Chain ID: 11142220)
- Check that token address is: `0x05dc1bacbAeaDe0DBFbe2954a0e68b9bCD725708`

## Files Updated

- ✅ `apps/contracts/ignition/parameters/sepolia.json` - Uses MockERC20
- ✅ `apps/web/src/config/contractConfig.ts` - Uses MockERC20
- ✅ `apps/web/src/app/create-task/page.tsx` - Added mint component
- ✅ `apps/web/src/components/mint-test-token.tsx` - Mint component
- ✅ `apps/web/src/hooks/use-quest-actions.ts` - Better error handling
- ✅ `apps/web/.env.local` - Updated token address

## Ready to Deploy! 🚀

Everything is configured and ready. Just run the deployment command and follow the steps above!

