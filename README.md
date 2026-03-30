# 🌌 NEXUS Terminal V5 — Institutional Crypto Analytics

The **NEXUS Terminal** is an institutional-grade, real-time cryptocurrency arbitrage and quantitative analytics platform. It is designed to provide traders with a high-performance, low-latency environment for detecting market inefficiencies across centralized (Binance, Coinbase) and decentralized (Uniswap V3) exchanges.

![Demo Recording](https://raw.githubusercontent.com/Anushreebasics/NEXUS-Terminal/main/nexus_terminal_v5_full_demo.webp) *(Replace with actual hosted gif/image after push)*

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- **C++ Build Tools** (Required for `better-sqlite3` and `msgpackr` native optimizations)

### 1. Installation
Clone the repository and install dependencies for both the frontend and backend.

```bash
# Clone the repository
git clone https://github.com/Anushreebasics/NEXUS-Terminal.git
cd NEXUS-Terminal

# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../frontend
npm install
```

### 2. Configuration (`backend/.env`)
Create a `.env` file in the `backend/` directory to configure your environment.

```env
PORT=3001
# Use a stable RPC for Uniswap V3 (LlamaRPC or Alchemy recommended)
RPC_URL="https://eth.llamarpc.com"
DATABASE_URL="file:./dev.db"
```

### 3. Launching the Terminal
You need to run both the backend and frontend simultaneously.

**In Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**In Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🛠️ Key Features & How to Use Them

### 1. Live Market Matrix (Arbitrage Detection)
The matrix aggregates prices from Binance, Coinbase, and Uniswap.
- **How to use**: Watch the `SPREAD` column. When a spread exceeds your configured threshold (default 0.5%), a real-time alert is triggered in the **Detection Engine Alerts** feed.
- **Paper Trading**: The system automatically simulates a $10,000 spot trade for every viable arbitrage detected, calculating fees and updating your **Virtual PnL** in the header.

### 2. Level 2 Order Book (Market Depth)
Located in the center of the dashboard, this streams live bids and asks directly from **Coinbase**.
- **Visual Heatmap**: The blue and red bars represent relative volume at each price level.
- **Live Spread**: The center display shows the current bid-ask spread in real-time.

### 3. NLP Sentiment Engine (Fear & Greed)
The top-left gauge analyzes the latest crypto headlines from global RSS feeds.
- **Real-time Scoring**: Headlines are processed via a financial lexicon to produce a score from -100 (Extreme Fear) to +100 (Extreme Greed).
- **Transparency**: Hover or look below the gauge to see the *actual headline* that triggered the most recent sentiment shift.

### 4. Interactive Settings Panel
Click the **Gear Icon** (top right) to open the configuration menu.
- **Dynamic Thresholds**: Adjust Arbitrage, Anomaly, and Spike detection sensitivity on the fly.
- **No Restart Required**: Changes are pushed to the backend over a REST API and applied instantly to the live data stream.

### 5. Persistent State
Thanks to the **SQLite + WAL** architecture, your **Virtual PnL** and recent signals survive server restarts. You can close the terminal and return later without losing your session history.

---

## 🧬 Technical Architecture

- **Binary Protocol**: Uses **MessagePack** (`msgpackr`) for WebSocket communication, slashing payload sizes by ~80% compared to standard JSON.
- **High-Concurrency DB**: Powered by `better-sqlite3` in Write-Ahead Logging (WAL) mode for synchronous, high-speed persistence.
- **On-Chain Polling**: Custom `ethers.js` adapter for Uniswap V3 `slot0` contract calls with a demo-fallback mechanism for RPC resilience.
- **Quant Logic**: Implements a rolling Z-Score algorithm (100-tick window) for statistical anomaly detection.

---

## 📜 License
ISC License - Feel free to use this for your own trading research or as a portfolio piece.

---

*Built by [Anushreebondia](https://github.com/Anushreebasics) — Institutional Crypto Engineering.*
