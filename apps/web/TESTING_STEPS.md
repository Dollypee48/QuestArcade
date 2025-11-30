# 🎯 MiniPay Testing - Simple Step-by-Step

## ⚡ QUICK START (5 Steps)

### 1️⃣ Install MiniPay on Your Phone
- Download MiniPay app (Android/iOS) or Opera Mini browser
- Create account and complete setup

### 2️⃣ Enable Developer Mode
- Open MiniPay → Settings
- Tap "Version" 7 times
- Go to Developer Settings
- Enable "Developer Mode" ✅
- Enable "Use Testnet" ✅

### 3️⃣ Start Your App with Ngrok
```bash
cd /home/dollypee/questArcade/apps/web
npm run dev:tunnel
```

**Wait for this output:**
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

**📋 COPY THE HTTPS URL**

### 4️⃣ Test in Browser First
Open in your computer browser:
- `https://your-ngrok-url.ngrok-free.app` ← Should show your app
- `https://your-ngrok-url.ngrok-free.app/manifest.json` ← Should show JSON

✅ If both work, continue to step 5

### 5️⃣ Load in MiniPay
- Open MiniPay app on phone
- Go to Settings → Developer Settings
- Find "Load test page" or "Test URL"
- Paste your ngrok URL
- Tap "Load"

**🎉 Your app should now open in MiniPay!**

---

## 📋 DETAILED CHECKLIST

### Before Starting
- [ ] MiniPay installed on phone
- [ ] Developer Mode enabled
- [ ] Testnet enabled
- [ ] Computer and phone ready

### Starting the Server
- [ ] Navigate to project folder
- [ ] Run `npm run dev:tunnel`
- [ ] Wait for ngrok URL
- [ ] Copy the HTTPS URL

### Testing
- [ ] App loads in browser
- [ ] Manifest accessible
- [ ] App loads in MiniPay
- [ ] Wallet connects automatically
- [ ] Can navigate pages
- [ ] Features work correctly

---

## 🔧 COMMON ISSUES & FIXES

### ❌ "Can't connect to ngrok"
**Fix:** 
- Check terminal - is ngrok running?
- Visit `http://127.0.0.1:4040` to see ngrok dashboard
- Restart: Stop (Ctrl+C) and run `npm run tunnel` again

### ❌ "App not loading in MiniPay"
**Fix:**
- Verify URL is HTTPS (not HTTP)
- Check app loads in regular browser first
- Verify manifest.json is accessible
- Check for JavaScript errors in browser console

### ❌ "Wallet not connecting"
**Fix:**
- Make sure Developer Mode is ON
- Check "Use Testnet" is enabled
- Verify MiniPay is the active wallet
- Check browser console for errors

### ❌ "Ngrok URL expired"
**Fix:**
- Free ngrok tunnels last 2 hours
- Restart ngrok to get new URL
- Update URL in MiniPay Developer Settings

---

## 📱 WHAT TO TEST

### Basic Tests
- [ ] App opens without errors
- [ ] All pages load
- [ ] Navigation works
- [ ] Wallet shows address

### Feature Tests
- [ ] Browse quests
- [ ] View quest details
- [ ] Accept a quest
- [ ] Submit proof
- [ ] Claim reward
- [ ] Create quest
- [ ] View dashboard
- [ ] Check profile

---

## 🎯 COMMANDS REFERENCE

```bash
# Start everything (dev server + ngrok)
npm run dev:tunnel

# Start dev server only
npm run dev

# Start ngrok only  
npm run tunnel

# Check for errors
npm run build
```

---

## 📞 NEED HELP?

1. **Check ngrok dashboard**: `http://127.0.0.1:4040`
2. **Check browser console**: F12 → Console tab
3. **Read full guide**: See `COMPLETE_TESTING_GUIDE.md`

---

## ✅ SUCCESS!

You'll know it's working when:
- ✅ App loads in MiniPay
- ✅ No error messages
- ✅ Wallet connects automatically
- ✅ You can use all features

**Happy Testing! 🚀**

