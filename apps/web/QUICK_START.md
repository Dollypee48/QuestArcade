# Quick Start: Testing on MiniPay

## 🚀 Start Testing in 3 Steps

### Step 1: Start the Development Server with Ngrok

```bash
npm run dev:tunnel
```

This command will:
- ✅ Start Next.js dev server on `http://localhost:3000`
- ✅ Start ngrok tunnel (HTTPS URL will be displayed)
- ✅ Show both outputs in the same terminal

### Step 2: Copy Your Ngrok URL

Look for output like this:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

### Step 3: Add to MiniPay Mini App Test

1. Go to MiniPay Mini App Test platform
2. Click "Add Mini App" or "Create New App"
3. Enter:
   - **Name**: QuestArcade
   - **URL**: Your ngrok URL from Step 2
4. Save and test!

## 📋 Alternative: Run Separately

If you prefer separate terminals:

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
npm run tunnel
```

## 🔍 Verify Setup

1. **Check Manifest**: Open `https://your-ngrok-url.ngrok-free.app/manifest.json` in browser
2. **Check App**: Open `https://your-ngrok-url.ngrok-free.app` in browser
3. **Ngrok Dashboard**: Visit `http://127.0.0.1:4040` to see request logs

## ⚠️ Important Notes

- Ngrok free tier URLs **change each time** you restart
- Free tunnels expire after **2 hours**
- For consistent testing, consider ngrok paid plan or deploy to staging

## 🆘 Troubleshooting

**Can't connect?**
- Check ngrok is running: Visit `http://127.0.0.1:4040`
- Verify dev server is on port 3000
- Check browser console for errors

**Manifest not found?**
- Verify `manifest.json` exists in `/public` folder
- Check it's accessible via the ngrok URL

**Need help?** See `MINIPAY_TESTING.md` for detailed guide.

