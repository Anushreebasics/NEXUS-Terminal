# Real-Time Multi-Exchange Crypto Arbitrage Terminal

A professional-grade dashboard for detecting cryptocurrency arbitrage opportunities and price anomalies in real-time across multiple exchanges.

## Features
- **Real-Time Data Streaming**: Aggregates live prices using WebSockets for Binance and Coinbase, and `ethers.js` on-chain polling for Uniswap V3.
- **Arbitrage Detection Engine**: Calculates spreads across exchanges and flags profitable arbitrage opportunities.
- **Anomaly & Spike Alerts**: Computes rolling global averages and time-series data to detect anomalous price deviations or sudden flash crashes/spikes.
- **Trading Terminal UI**: A sleek, dark-mode React (Vite) interface built with Tailwind CSS and Recharts.

---

## Folder Structure
- `/backend`: Node.js Express/WebSocket server and detection logic.
- `/frontend`: React SPA dashboard powered by Vite, Tailwind CSS, and Recharts.

---

## 🚀 Quick Setup Guide

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```

The server will start on `http://localhost:3001` and expose a WebSocket connection at `ws://localhost:3001`.

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will typically start on `http://localhost:5173`. Open this URL in your browser to see the live terminal.

---

## Configuration

The backend uses a public Ankr/Cloudflare Ethereum RPC endpoint for Uniswap connection by default. If you encounter rate limits or connection errors, you can create a `.env` file in the `/backend` directory:

```env
PORT=3001
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
```

## Note on Decentralized Data

- The detection engine tracks BTC, ETH, and SOL.
- Since SOL is not natively traded on Ethereum Mainnet Uniswap, the Uniswap mock either ignores SOL or relies on Wrapped variants (if provided). The system seamlessly handles incomplete data matrices without breaking the UI.
