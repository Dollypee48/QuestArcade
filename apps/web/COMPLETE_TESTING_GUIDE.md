# Complete MiniPay Testing Guide - Step by Step

This is your complete, step-by-step guide to test QuestArcade on MiniPay using ngrok.

---

## 📋 PREREQUISITES CHECKLIST

Before starting, make sure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm or pnpm installed
- [ ] MiniPay app installed on your mobile device (Android/iOS)
- [ ] Your ngrok auth token (already configured: `36DGaCXsMl7RJ9vzU7Dwv7ni6lz_mBpSkvjpJjVpQzndMrr`)
- [ ] Your development machine and mobile device on the same network (or use ngrok)

---

## 🚀 STEP-BY-STEP PROCESS

### STEP 1: Install MiniPay on Your Mobile Device

**Option A: Standalone MiniPay App (Recommended)**
- **Android**: Download from [MiniPay Android](https://docs.minipay.xyz/getting-started/test-in-minipay.html)
- **iOS**: Download from [MiniPay iOS](https://docs.minipay.xyz/getting-started/test-in-minipay.html)

**Option B: Opera Mini Browser**
- Download Opera Mini browser
- MiniPay is built-in

**After Installation:**
1. Open MiniPay app
2. Create an account (use Google/Apple account + phone number)
3. Complete the initial setup

---

### STEP 2: Enable Developer Mode in MiniPay

1. **Open MiniPay app** on your mobile device
2. **Go to Settings** (usually in the menu or profile section)
3. **Find "About" section**
4. **Tap the Version number 7 times** (you'll see a confirmation message)
5. **Go back to Settings** - you should now see **"Developer Settings"**
6. **Open Developer Settings** and enable:
   - ✅ **Developer Mode** (toggle ON)
   - ✅ **Use Testnet** (toggle ON) - This connects to Alfajores L2 testnet

**Important**: Keep Developer Mode enabled throughout testing.

---

### STEP 3: Prepare Your Development Environment

1. **Navigate to your project:**
   ```bash
   cd /home/dollypee/questArcade/apps/web
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Verify your setup:**
   ```bash
   # Check if manifest.json exists
   ls public/manifest.json
   
   # Check if ngrok config exists
   ls ngrok.yml
   ```

---

### STEP 4: Start Your Development Server with Ngrok

**Option A: Run Both Together (Recommended)**

Open your terminal and run:
```bash
npm run dev:tunnel
```

This will:
- Start Next.js dev server on `http://localhost:3000`
- Start ngrok tunnel automatically
- Show both outputs in the same terminal

**Option B: Run Separately**

**Terminal 1 - Start Dev Server:**
```bash
npm run dev
```

**Terminal 2 - Start Ngrok:**
```bash
npm run tunnel
```

**Wait for the output** - You'll see something like:
```
Session Status                online
Account                       Your Name (Plan: Free)
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3000
```

**📌 COPY THE HTTPS URL** (e.g., `https://abc123def456.ngrok-free.app`)

---

### STEP 5: Verify Your App is Accessible

**Test 1: Check App in Browser**
1. Open a browser on your computer
2. Go to your ngrok URL: `https://your-ngrok-url.ngrok-free.app`
3. You should see your QuestArcade app loading

**Test 2: Check Manifest**
1. Go to: `https://your-ngrok-url.ngrok-free.app/manifest.json`
2. You should see the JSON manifest file

**Test 3: Check Ngrok Dashboard**
1. Open: `http://127.0.0.1:4040` in your browser
2. You should see the ngrok web interface with request logs

**✅ If all tests pass, proceed to Step 6**

---

### STEP 6: Load Your App in MiniPay

1. **Open MiniPay app** on your mobile device
2. **Go to Settings** → **Developer Settings**
3. **Find "Load test page"** or **"Test URL"** option
4. **Enter your ngrok URL**: `https://your-ngrok-url.ngrok-free.app`
5. **Tap "Load"** or **"Go"**

Your app should now load inside MiniPay!

---

### STEP 7: Test Your App Features

Test each feature systematically:

**✅ Wallet Connection:**
- The wallet should auto-connect (MiniPay is already connected)
- Check if "Connect Wallet" button is hidden (it should be)
- Verify wallet address is displayed

**✅ Quest Browsing:**
- Navigate to `/quests` page
- Check if quests load correctly
- Test quest filtering/search

**✅ Quest Details:**
- Click on a quest
- Verify all details display correctly
- Check video/images load properly

**✅ Quest Actions:**
- Test "Accept Quest" button
- Test "Submit Proof" functionality
- Test "Claim Reward" (if applicable)

**✅ Dashboard:**
- Navigate to `/dashboard`
- Check stats display correctly
- Verify quest progress

**✅ Create Quest:**
- Navigate to `/create-task`
- Test quest creation form
- Submit a test quest

**✅ Other Pages:**
- Test `/profile`
- Test `/leaderboard`
- Test `/rewards`
- Test navigation between pages

---

### STEP 8: Monitor and Debug

**Ngrok Web Interface:**
- Visit `http://127.0.0.1:4040` on your computer
- Monitor all requests
- Check for errors
- Inspect request/response headers

**Browser Console (if testing in browser):**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

**Mobile Device:**
- If possible, enable remote debugging
- Check for JavaScript errors
- Monitor network requests

---

## 🔧 TROUBLESHOOTING

### Problem: Ngrok URL Not Working

**Symptoms:**
- Can't access app via ngrok URL
- Connection timeout errors

**Solutions:**
1. Check if ngrok is running: Visit `http://127.0.0.1:4040`
2. Verify dev server is running on port 3000
3. Check terminal for ngrok errors
4. Restart ngrok: Stop and run `npm run tunnel` again
5. Verify auth token is correct

---

### Problem: App Not Loading in MiniPay

**Symptoms:**
- Blank screen in MiniPay
- "Failed to load" error

**Solutions:**
1. **Verify URL is correct:**
   - Must be HTTPS (not HTTP)
   - No typos in the URL
   - URL should end with `.ngrok-free.app`

2. **Check manifest.json:**
   - Visit `https://your-url.ngrok-free.app/manifest.json`
   - Should return valid JSON
   - Check browser console for manifest errors

3. **Check CORS headers:**
   - Verify `next.config.js` has CORS headers
   - Check ngrok dashboard for CORS errors

4. **Check app build:**
   ```bash
   npm run build
   ```
   - Fix any build errors

5. **Check browser console:**
   - Open ngrok URL in regular browser
   - Check for JavaScript errors
   - Fix errors before testing in MiniPay

---

### Problem: Wallet Not Connecting

**Symptoms:**
- "Connect Wallet" button still visible
- Wallet address not showing

**Solutions:**
1. **Verify MiniPay detection:**
   - Check `use-minipay.ts` hook is working
   - Verify `window.ethereum.isMiniPay` is true
   - Check browser console for detection errors

2. **Check wallet provider:**
   - Verify `wallet-provider.tsx` handles MiniPay correctly
   - Check auto-connect logic

3. **Test wallet connection:**
   - Try manually triggering connection
   - Check for error messages

---

### Problem: Features Not Working

**Symptoms:**
- Buttons not responding
- Forms not submitting
- Data not loading

**Solutions:**
1. **Check JavaScript errors:**
   - Open browser console
   - Look for red error messages
   - Fix errors one by one

2. **Check network requests:**
   - Open Network tab in DevTools
   - Look for failed requests (red)
   - Check request URLs and responses

3. **Verify API endpoints:**
   - Check if contract addresses are correct
   - Verify RPC URLs are accessible
   - Test network connectivity

4. **Check state management:**
   - Verify Zustand store is working
   - Check if data is being fetched correctly

---

### Problem: Ngrok Tunnel Expired

**Symptoms:**
- URL stops working after 2 hours
- "Tunnel not found" error

**Solutions:**
1. **Restart ngrok:**
   ```bash
   # Stop current ngrok (Ctrl+C)
   npm run tunnel
   ```

2. **Get new URL:**
   - Copy the new ngrok URL
   - Update in MiniPay Developer Settings

3. **For consistent testing:**
   - Consider ngrok paid plan (static domains)
   - Or deploy to staging environment

---

## 📱 TESTING CHECKLIST

Use this checklist to ensure thorough testing:

### Basic Functionality
- [ ] App loads without errors
- [ ] All pages are accessible
- [ ] Navigation works correctly
- [ ] No console errors

### Wallet Integration
- [ ] Wallet auto-connects in MiniPay
- [ ] Wallet address displays correctly
- [ ] Balance shows correctly
- [ ] Transactions can be initiated

### Quest Features
- [ ] Quest list loads
- [ ] Quest details display correctly
- [ ] Can accept quests
- [ ] Can submit proof
- [ ] Can claim rewards
- [ ] Can create quests

### UI/UX
- [ ] Mobile responsive design works
- [ ] Buttons are clickable
- [ ] Forms are usable
- [ ] Images/videos load
- [ ] Loading states work

### Performance
- [ ] Pages load quickly
- [ ] No lag when navigating
- [ ] Smooth scrolling
- [ ] Efficient data loading

---

## 🎯 QUICK REFERENCE COMMANDS

```bash
# Start dev server + ngrok together
npm run dev:tunnel

# Start dev server only
npm run dev

# Start ngrok only
npm run tunnel

# Build for production
npm run build

# Check for errors
npm run lint
npm run type-check
```

---

## 📞 GETTING HELP

If you encounter issues:

1. **Check ngrok dashboard**: `http://127.0.0.1:4040`
2. **Check browser console**: Look for JavaScript errors
3. **Check terminal output**: Look for server errors
4. **Verify all prerequisites**: Make sure everything is installed
5. **Check documentation**: See `MINIPAY_TESTING.md` for more details

---

## 🎉 SUCCESS INDICATORS

You'll know everything is working when:

✅ App loads in MiniPay without errors
✅ Wallet automatically connects
✅ You can navigate all pages
✅ Quest features work (create, accept, submit, claim)
✅ No console errors
✅ Smooth user experience

---

## 📝 NOTES

- **Ngrok URLs change**: Each time you restart ngrok, you get a new URL
- **Free tier limits**: 2-hour sessions, random URLs, request limits
- **Testnet mode**: Make sure "Use Testnet" is enabled in MiniPay
- **Keep ngrok running**: Don't close the terminal while testing

---

## 🚀 NEXT STEPS AFTER TESTING

Once testing is complete:

1. **Document issues**: Note any bugs or improvements needed
2. **Fix critical issues**: Address blocking bugs first
3. **Optimize performance**: Improve slow-loading pages
4. **Prepare for production**: 
   - Deploy to a stable domain
   - Update CORS headers
   - Configure production environment
   - Get production MiniPay approval

---

**Good luck with your testing! 🎮**

