#!/bin/bash

# QuestArcade Deployment Script for Celo Sepolia
# This script deploys all contracts with the correct MockERC20 token

set -e

echo "🚀 Starting QuestArcade deployment to Celo Sepolia..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your PRIVATE_KEY"
    exit 1
fi

# Check if PRIVATE_KEY is set
if ! grep -q "PRIVATE_KEY" .env; then
    echo "❌ Error: PRIVATE_KEY not found in .env file"
    exit 1
fi

echo "✅ Configuration check passed"
echo ""

# Compile contracts
echo "📦 Compiling contracts..."
pnpm compile
echo "✅ Contracts compiled"
echo ""

# Deploy to Sepolia
echo "🌐 Deploying to Celo Sepolia..."
echo "Using MockERC20 token: 0x05dc1bacbAeaDe0DBFbe2954a0e68b9bCD725708"
echo ""

pnpm deploy:sepolia

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the contract addresses from the deployment output above"
echo "2. Update apps/web/.env.local with the new addresses:"
echo "   - NEXT_PUBLIC_QUEST_ARCADE_CONTRACT=<new_address>"
echo "   - NEXT_PUBLIC_QUEST_REGISTRY_CONTRACT=<new_address>"
echo "   - NEXT_PUBLIC_REWARDS_VAULT_CONTRACT=<new_address>"
echo "   - NEXT_PUBLIC_REPUTATION_CONTRACT=<new_address>"
echo "   - NEXT_PUBLIC_STABLE_TOKEN_ADDRESS=0x05dc1bacbAeaDe0DBFbe2954a0e68b9bCD725708"
echo "3. Restart your dev server"
echo "4. Go to Create Task page and mint test tokens"

