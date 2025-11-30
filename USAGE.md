# Usage Guide

This guide explains how to use QuestArcade - from creating your first quest to claiming rewards. I'll walk you through all the features step by step.

## Getting Started

### First Time Setup

1. **Connect Your Wallet**
   - Click "Connect Wallet" in the top right
   - Select MetaMask or your preferred wallet
   - Approve the connection
   - Make sure you're on Celo Sepolia network

2. **Get Test Tokens**
   - Go to the "Create Task" page (`/create-task`)
   - You'll see a "Get Test Tokens" card at the top
   - Click "Mint 1000 Test Tokens"
   - Approve the transaction
   - Wait for confirmation

3. **Check Your Balance**
   - Your token balance appears in the navbar
   - You can also check it on the Dashboard

Now you're ready to use QuestArcade!

## Creating a Quest

As a quest creator, you can post tasks for others to complete.

### Step 1: Navigate to Create Quest

- Click "Create Quest" in the navbar, or
- Go to `/create-task` directly

### Step 2: Fill Out Quest Details

**Title** (required)**
- Give your quest a clear, descriptive name
- Example: "Take photos of local street art"

**Description** (required)**
- Explain what needs to be done
- Include any specific requirements
- Example: "Visit these 3 locations and take a photo of the street art at each"

**Reward Amount** (required)**
- Enter how much cUSD you're offering
- Make sure you have enough tokens in your wallet
- The amount will be escrowed when you create the quest

**Verification Type** (required)**
- **Photo**: Worker submits photos as proof
- **Video**: Worker submits video as proof
- **GPS**: Worker's location is verified

**Time Limit** (optional)**
- Set how many hours the worker has to complete the quest
- Leave empty for no time limit
- If quest expires, you can cancel and get a refund

**Location** (optional)**
- Add a location if the quest is location-specific
- Helps workers find relevant quests

### Step 3: Submit Quest

1. Review all your details
2. Click "Create Quest"
3. Approve the transaction in your wallet
4. Wait for confirmation

Your quest is now live! Workers can see it and accept it.

## Accepting a Quest

As a worker, you can browse and accept quests to earn rewards.

### Step 1: Browse Quests

- Go to the "Quests" page (`/quests`)
- Browse available quests
- Use the search bar to find specific quests
- Filter by reward amount or verification type

### Step 2: View Quest Details

- Click on any quest card to see full details
- Review:
  - Quest description and requirements
  - Reward amount
  - Time limit (if any)
  - Creator information
  - Verification type needed

### Step 3: Accept the Quest

1. Click "Accept Quest" button
2. Approve the transaction in your wallet
3. Wait for confirmation

Once accepted, the quest appears in your Dashboard under "My Accepted Quests".

## Completing a Quest

After accepting a quest, you need to complete it and submit proof.

### Step 1: Complete the Task

- Follow the quest requirements
- Take photos/videos if needed
- Make sure you're at the right location (for GPS quests)

### Step 2: Submit Proof

1. Go to the quest details page
2. Click "Submit Proof"
3. Upload your proof:
   - **Photo quests**: Upload image files
   - **Video quests**: Upload video files
   - **GPS quests**: Your location is automatically captured
4. Add any additional notes (optional)
5. Click "Submit"
6. Approve the transaction

Your proof is uploaded to IPFS and stored on-chain. The creator will be notified.

### Step 3: Wait for Verification

- The creator needs to verify your proof
- Check the quest status on your Dashboard
- You'll see "Submitted" status while waiting

## Verifying a Quest (Creators)

As a creator, you need to verify submitted proofs.

### Step 1: Check Submissions

- Go to your Dashboard
- Look for quests with "Submitted" status
- Click on the quest to view details

### Step 2: Review Proof

- View the uploaded photos/videos
- Check GPS location (if applicable)
- Review any notes from the worker

### Step 3: Verify or Reject

**To Verify (Approve)**:
1. Click "Verify Quest"
2. Approve the transaction
3. The reward is automatically sent to the worker
4. Worker's reputation increases

**To Reject**:
1. Click "Reject Quest"
2. Provide a reason (optional)
3. The escrowed funds return to you
4. Worker can see the rejection reason

## Claiming Rewards (Workers)

Once your quest is verified, you can claim your reward.

### Automatic Claiming

- Rewards are automatically sent when a quest is verified
- Check your wallet balance
- The cUSD should appear in your MiniPay wallet

### Manual Claiming (if needed)

1. Go to the quest details page
2. Click "Claim Reward" button
3. Approve the transaction
4. Wait for confirmation

## Dashboard Features

The Dashboard (`/dashboard`) shows all your quest activity.

### Your Stats

- **Total Quests**: All quests you've created or accepted
- **Active Quests**: Currently in progress
- **Completed**: Successfully finished quests
- **Earnings**: Total cUSD earned
- **XP**: Your experience points
- **Reputation**: Your reputation score

### Quest Lists

- **My Created Quests**: Quests you've posted
- **My Accepted Quests**: Quests you're working on
- **Completed Quests**: Finished quests

### Quick Actions

- Create new quest
- View quest details
- Check quest status
- See your progress

## Profile Page

Your profile (`/profile`) shows:

- Wallet address
- XP and reputation
- Quest statistics
- MiniPay connection status
- Account settings

## Leaderboard

Check the Leaderboard (`/leaderboard`) to see:

- Top users by XP
- Top users by reputation
- Top earners
- Your ranking

## Quest Expiration

If a quest has a time limit and expires:

- **For Workers**: You can't accept expired quests
- **For Creators**: You can cancel expired quests and get a refund
- Expired quests show "Expired" status

### Canceling Expired Quests

1. Go to your quest details
2. Click "Cancel & Refund"
3. Approve the transaction
4. Your escrowed funds are returned

## Tips for Best Experience

### For Quest Creators

- Be clear and specific in your descriptions
- Set reasonable time limits
- Verify proofs promptly
- Offer fair rewards

### For Workers

- Read quest requirements carefully
- Submit high-quality proof
- Complete quests on time
- Build your reputation

### General Tips

- Keep some CELO tokens for gas fees
- Check your wallet balance regularly
- Use MiniPay for gasless transactions
- Build your XP and reputation for better opportunities

## Mobile Usage

QuestArcade is fully mobile-responsive and works great on MiniPay:

1. Open MiniPay app
2. Enable Developer Mode (for testing)
3. Load the app URL
4. Connect your wallet
5. Use all features just like on desktop

## Troubleshooting

### Can't create quest

- Check you have enough tokens
- Verify you have CELO for gas
- Make sure you're connected to the right network

### Can't submit proof

- Check file size (should be reasonable)
- Ensure you're at the right location (for GPS)
- Try refreshing the page

### Reward not received

- Check transaction status on blockchain explorer
- Verify the quest was actually verified
- Check your wallet balance

### Quest not showing

- Refresh the page
- Check you're on the right network
- Clear browser cache if needed

## Need Help?

If you encounter issues:
- Check the browser console for errors
- Review transaction status on Celo explorer
- Make sure all requirements are met
- Try refreshing or reconnecting your wallet

Happy questing! 🎮

