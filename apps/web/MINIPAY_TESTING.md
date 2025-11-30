# MiniPay Mini App Testing Guide

This guide will help you test your QuestArcade app on MiniPay using ngrok for local development.

## Prerequisites

1. **Ngrok Account**: You already have an auth token configured
2. **Node.js**: Version 18 or higher
3. **MiniPay Test Environment**: Access to MiniPay Mini App Test platform

## Quick Start

### Option 1: Run Dev Server and Ngrok Together (Recommended)

```bash
npm run dev:tunnel
```

This will:
- Start the Next.js dev server on `http://localhost:3000`
- Start ngrok tunnel pointing to port 3000
- Display the ngrok HTTPS URL in the terminal

### Option 2: Run Separately

**Terminal 1 - Start Dev Server:**
```bash
npm run dev
```

**Terminal 2 - Start Ngrok Tunnel:**
```bash
npm run tunnel
```

## Getting Your Ngrok URL

After running the tunnel command, you'll see output like:

```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`). This is your public URL for MiniPay testing.

## Testing on MiniPay Mini App Test

1. **Access MiniPay Mini App Test Platform**
   - Navigate to the MiniPay Mini App Test dashboard
   - You may need to register/login with your Celo account

2. **Add Your Mini App**
   - Click "Add Mini App" or "Create New App"
   - Enter the following details:
     - **Name**: QuestArcade
     - **URL**: Your ngrok HTTPS URL (e.g., `https://abc123.ngrok-free.app`)
     - **Description**: A gamified quest platform built on Celo MiniPay
     - **Icon**: Upload your app icon (optional)

3. **Verify Manifest**
   - The app should automatically detect `/manifest.json`
   - Verify the manifest is accessible at: `https://your-ngrok-url.ngrok-free.app/manifest.json`

4. **Test the App**
   - Open the Mini App in the MiniPay test environment
   - Test wallet connection
   - Test quest creation and acceptance
   - Verify all features work correctly

## Important Notes

### Ngrok Free Tier Limitations

- **Session Duration**: Free ngrok tunnels expire after 2 hours
- **URL Changes**: Each new tunnel gets a new random URL
- **Request Limits**: Free tier has request/minute limits

### For Production

When deploying to production:
1. Use a stable domain (not ngrok)
2. Update CORS headers in `next.config.js` to specific MiniPay domains
3. Ensure HTTPS is properly configured
4. Update manifest.json with production URL

## Troubleshooting

### Issue: Ngrok URL Not Accessible

**Solution**: 
- Check if ngrok is running: `ps aux | grep ngrok`
- Verify the auth token is set correctly
- Check ngrok web interface at `http://127.0.0.1:4040`

### Issue: CORS Errors

**Solution**:
- Verify headers in `next.config.js` are correct
- Check browser console for specific CORS errors
- Ensure MiniPay test environment allows your domain

### Issue: Manifest Not Found

**Solution**:
- Verify `manifest.json` exists in `/public` folder
- Check it's accessible: `https://your-ngrok-url.ngrok-free.app/manifest.json`
- Verify the manifest link in `layout.tsx`

### Issue: Wallet Not Connecting

**Solution**:
- Ensure MiniPay is enabled in Opera Mini browser
- Check browser console for errors
- Verify the app detects MiniPay correctly (check `use-minipay.ts` hook)

## Environment Variables

Create a `.env.local` file (optional, for custom ngrok config):

```env
NGROK_AUTH_TOKEN=your-ngrok-auth-token
NEXT_PUBLIC_WC_PROJECT_ID=your-walletconnect-project-id
```

## Ngrok Web Interface

Access the ngrok web interface at `http://127.0.0.1:4040` to:
- View request logs
- Inspect requests/responses
- Replay requests
- Monitor traffic

## Next Steps

1. **Test All Features**: Go through all app features in MiniPay
2. **Test on Real Device**: Use Opera Mini on a mobile device
3. **Monitor Performance**: Check ngrok web interface for performance metrics
4. **Collect Feedback**: Document any issues or improvements needed

## Resources

- [Ngrok Documentation](https://ngrok.com/docs)
- [MiniPay Documentation](https://docs.celo.org/developer/minipay)
- [Celo Composer](https://github.com/celo-org/celo-composer)

## Support

If you encounter issues:
1. Check the ngrok web interface for request logs
2. Check browser console for JavaScript errors
3. Verify all dependencies are installed: `npm install`
4. Check Next.js build: `npm run build`

---

**Note**: Remember that ngrok free tier URLs change each time you restart. For consistent testing, consider using ngrok's paid plan with static domains, or deploy to a staging environment.

