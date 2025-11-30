/**
 * Ngrok configuration for MiniPay Mini App testing
 * 
 * To use this configuration:
 * 1. Install ngrok: npm install -g ngrok (or use npx)
 * 2. Set your ngrok auth token: ngrok config add-authtoken YOUR_TOKEN
 * 3. Run: npx ngrok http 3000 --config=ngrok.config.js
 * 
 * Or use the npm script: npm run dev:tunnel
 */

module.exports = {
  authtoken: process.env.NGROK_AUTH_TOKEN || "36DGaCXsMl7RJ9vzU7Dwv7ni6lz_mBpSkvjpJjVpQzndMrr",
  region: "us", // Options: us, eu, ap, au, sa, jp, in
  addr: 3000,
  inspect: true, // Enable web interface at http://127.0.0.1:4040
  log: "stdout",
  log_level: "info",
  // Headers for CORS and security
  request_header: {
    add: [
      "X-Forwarded-Proto: https",
      "X-Forwarded-For: $remote_addr"
    ]
  },
  // Compression
  compression: true,
};

