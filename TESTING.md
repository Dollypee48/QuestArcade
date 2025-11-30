# Testing Guide

This guide explains how to test QuestArcade on MiniPay using ngrok. I set this up so you can test the full mobile experience with MiniPay's gasless transactions.

## Why Test on MiniPay?

MiniPay is Celo's mobile wallet that offers:
- Gasless transactions (sponsored by Opera)
- Built-in browser for seamless dApp experience
- Native Celo integration
- Better mobile UX

Testing on MiniPay ensures your app works perfectly for mobile users.

## Prerequisites

Before you start testing, make sure you have:

1. **MiniPay App** installed on your mobile device
   - Android: Download from [MiniPay Android](https://docs.minipay.xyz/getting-started/test-in-minipay.html)
   - iOS: Download from [MiniPay iOS](https://docs.minipay.xyz/getting-started/test-in-minipay.html)
   - Or use Opera Mini browser (has MiniPay built-in)

2. **Ngrok Auth Token** (already configured in the project)
   - Token: `36DGaCXsMl7RJ9vzU7Dwv7ni6lz_mBpSkvjpJjVpQzndMrr`
   - This is set up in the package.json scripts

3. **Development Server** running
   - The app needs to be running on `localhost:3000`

## Quick Start (3 Steps)

### Step 1: Start Dev Server with Ngrok

From the `apps/web` directory, run:

```bash
npm run dev:tunnel
```

This command:
- Starts the Next.js dev server on port 3000
- Starts ngrok tunnel automatically
- Shows you the ngrok HTTPS URL

**Wait for the output** - you'll see something like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

**Copy that HTTPS URL** - you'll need it in the next step.

### Step 2: Enable Developer Mode in MiniPay

1. Open MiniPay app on your phone
2. Go to **Settings**
3. Find the **"About"** section
4. **Tap the version number 7 times** (you'll see a confirmation)
5. Go back to Settings
6. You should now see **"Developer Settings"**
7. Open Developer Settings and enable:
   - ✅ **Developer Mode** (toggle ON)
   - ✅ **Use Testnet** (toggle ON)

Keep Developer Mode enabled while testing.

### Step 3: Load Your App in MiniPay

1. In MiniPay, go to **Settings → Developer Settings**
2. Find **"Load test page"** or **"Test URL"** option
3. Paste your ngrok URL (from Step 1)
4. Tap **"Load"**

Your app should now open in MiniPay! 🎉

## Detailed Testing Process

### Testing Checklist

Once your app loads in MiniPay, test these features:

#### Basic Functionality
- [ ] App loads without errors
- [ ] All pages are accessible
- [ ] Navigation works smoothly
- [ ] No console errors

#### Wallet Integration
- [ ] Wallet auto-connects (MiniPay is already connected)
- [ ] Wallet address displays correctly
- [ ] Balance shows correctly
- [ ] Can initiate transactions

#### Quest Features
- [ ] Can browse quests
- [ ] Can view quest details
- [ ] Can accept quests
- [ ] Can submit proof
- [ ] Can claim rewards
- [ ] Can create quests

#### UI/UX
- [ ] Mobile responsive design works
- [ ] Buttons are clickable
- [ ] Forms are usable
- [ ] Images/videos load
- [ ] Loading states work

#### Performance
- [ ] Pages load quickly
- [ ] No lag when navigating
- [ ] Smooth scrolling
- [ ] Efficient data loading

## Alternative: Run Separately

If you prefer to run dev server and ngrok in separate terminals:

**Terminal 1 - Dev Server:**
```bash
cd apps/web
npm run dev
```

**Terminal 2 - Ngrok:**
```bash
cd apps/web
npm run tunnel
```

Then follow Step 2 and 3 above.

## Using Ngrok Config File

If you want to use the ngrok.yml config file:

```bash
cd apps/web
npm run tunnel:config
```

This uses the `ngrok.yml` configuration file.

## Monitoring Your Tests

### Ngrok Web Interface

While ngrok is running, you can monitor requests:

1. Open `http://127.0.0.1:4040` in your browser
2. You'll see:
   - All incoming requests
   - Request/response details
   - Performance metrics
   - Error logs

This is super helpful for debugging!

### Browser Console

On your computer, you can also:
1. Open the ngrok URL in a regular browser
2. Open DevTools (F12)
3. Check Console for JavaScript errors
4. Check Network tab for failed requests

## Common Issues & Solutions

### Issue: Ngrok URL Not Working

**Symptoms**: Can't access app via ngrok URL

**Solutions**:
- Check if ngrok is running: Visit `http://127.0.0.1:4040`
- Verify dev server is on port 3000
- Check terminal for ngrok errors
- Restart ngrok: Stop (Ctrl+C) and run `npm run tunnel` again

### Issue: App Not Loading in MiniPay

**Symptoms**: Blank screen or "Failed to load" error

**Solutions**:
1. **Verify URL is correct**:
   - Must be HTTPS (not HTTP)
   - No typos in the URL
   - Should end with `.ngrok-free.app` or `.ngrok-free.dev`

2. **Check manifest.json**:
   - Visit `https://your-url.ngrok-free.app/manifest.json` in browser
   - Should return valid JSON
   - Check browser console for manifest errors

3. **Test in regular browser first**:
   - Open ngrok URL in your computer browser
   - If it works there, it should work in MiniPay
   - Fix any errors before testing in MiniPay

4. **Check CORS headers**:
   - Verify `next.config.js` has CORS headers
   - Check ngrok dashboard for CORS errors

### Issue: Wallet Not Connecting

**Symptoms**: "Connect Wallet" button still visible, address not showing

**Solutions**:
- Make sure Developer Mode is ON in MiniPay
- Enable "Use Testnet" in Developer Settings
- Check browser console for errors
- Try refreshing the page
- Verify MiniPay is the active wallet

### Issue: Transactions Failing

**Symptoms**: Can't create quests, accept quests, etc.

**Solutions**:
- Check you have CELO tokens for gas (even though MiniPay is gasless, you might need some)
- Verify you're on Celo Sepolia testnet
- Check transaction status on Celo explorer
- Make sure you have enough tokens for quest rewards

### Issue: Ngrok Tunnel Expired

**Symptoms**: URL stops working after 2 hours

**Solutions**:
- Free ngrok tunnels expire after 2 hours
- Restart ngrok to get a new URL:
  ```bash
  # Stop current ngrok (Ctrl+C)
  npm run tunnel
  ```
- Copy the new URL
- Update it in MiniPay Developer Settings

**Note**: For consistent testing, consider ngrok paid plan (static domains) or deploy to staging.

## Testing Different Scenarios

### Test Quest Creation Flow

1. Connect wallet in MiniPay
2. Get test tokens (mint if needed)
3. Create a quest with all fields
4. Verify quest appears in quest list
5. Check quest details page

### Test Quest Acceptance Flow

1. Browse available quests
2. Accept a quest
3. Verify it appears in "My Accepted Quests"
4. Complete the task in real world
5. Submit proof
6. Wait for verification
7. Claim reward

### Test Quest Verification Flow

1. Create a quest as creator
2. Have someone accept it (or use another wallet)
3. Wait for proof submission
4. Review the proof
5. Verify or reject
6. Check reward distribution

### Test Edge Cases

- Expired quests
- Quest cancellation
- Rejected proofs
- Multiple quests at once
- Large file uploads
- Network interruptions

## Performance Testing

While testing, monitor:

- **Page load times**: Should be under 3 seconds
- **Transaction times**: Should be reasonable
- **Image/video loading**: Should be smooth
- **Navigation**: Should be instant
- **Memory usage**: Check ngrok dashboard

## Production Testing

Before going to production:

1. **Deploy to staging**: Use a real domain, not ngrok
2. **Update CORS**: Restrict to specific MiniPay domains
3. **Test on real network**: Not just localhost
4. **Load testing**: Test with multiple users
5. **Security audit**: Review all smart contract interactions

## Tips for Effective Testing

1. **Test on real device**: Not just emulator
2. **Test different networks**: WiFi and mobile data
3. **Test with low battery**: See how app handles it
4. **Test interruptions**: Phone calls, notifications
5. **Test offline mode**: What happens without internet
6. **Test with slow connection**: 3G speeds
7. **Test different screen sizes**: Various phones

## Getting Help

If you encounter issues:

1. **Check ngrok dashboard**: `http://127.0.0.1:4040`
2. **Check browser console**: Look for JavaScript errors
3. **Check terminal**: Look for server errors
4. **Verify setup**: Make sure all prerequisites are met
5. **Review logs**: Check all error messages

## Next Steps After Testing

Once testing is complete:

1. **Document issues**: Note any bugs or improvements
2. **Fix critical bugs**: Address blocking issues first
3. **Optimize performance**: Improve slow-loading pages
4. **Prepare for production**: 
   - Deploy to stable domain
   - Update CORS headers
   - Configure production environment
   - Get MiniPay approval (if needed)

Happy testing! 🚀

