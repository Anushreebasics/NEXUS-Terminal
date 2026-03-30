import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { pack, unpack } from 'msgpackr';

import { priceStore } from './src/services/PriceStore';
import { detectionEngine } from './src/services/DetectionEngine';
import { db } from './src/services/Database';
import { orderBookService } from './src/services/OrderBookService';
import { sentimentEngine } from './src/services/SentimentEngine';

// Initialize exchanges
import './src/exchanges/Binance';
import './src/exchanges/Coinbase';
import './src/exchanges/Uniswap';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let currentSignals: any[] = [];
const clients: Set<WebSocket> = new Set();

// Binary MessagePack broadcast — ~60–80% smaller than JSON
const broadcast = (message: any) => {
  const payload = pack(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
};

// ── Event Wiring ───────────────────────────────────────────────

// 1. Price updates → broadcast binary
priceStore.on('price_update', (update) => {
  broadcast({ type: 'PRICE_UPDATE', data: update });
});

// 2. Detection signals → persist + broadcast
detectionEngine.on('signal', (sig) => {
  currentSignals.unshift(sig);
  if (currentSignals.length > 50) currentSignals.pop();
  broadcast({ type: 'SIGNAL_UPDATE', data: sig });
  if (sig.type === 'EXECUTION') {
    broadcast({ type: 'PNL_UPDATE', data: detectionEngine.totalPnl });
  }
});

// 3. Order Book updates → broadcast binary (high-freq, no persist needed)
orderBookService.on('orderbook_update', (book) => {
  broadcast({ type: 'ORDERBOOK_UPDATE', data: book });
});

// 4. Sentiment updates → broadcast binary
sentimentEngine.on('sentiment_update', (sentiment) => {
  broadcast({ type: 'SENTIMENT_UPDATE', data: sentiment });
});

// ── WebSocket Connections ──────────────────────────────────────
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('[WS] Client connected');

  // Send initial state as binary MessagePack
  ws.send(pack({
    type: 'INIT_STATE',
    data: {
      prices: priceStore.getPrices(),
      signals: currentSignals,
      pnl: detectionEngine.totalPnl,
      sentiment: sentimentEngine.getSentiment(),
    }
  }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log('[WS] Client disconnected');
  });
});

// ── REST API ───────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'Terminal Backend Active', pnl: detectionEngine.totalPnl });
});

app.get('/api/settings', (req, res) => {
  res.json(detectionEngine.settings);
});

app.post('/api/settings', (req, res) => {
  const newSettings = req.body;
  detectionEngine.updateSettings(newSettings);
  res.json({ success: true, settings: detectionEngine.settings });
});

app.get('/api/sentiment', (req, res) => {
  res.json(sentimentEngine.getSentiment());
});

// ── Bootstrap (better-sqlite3 is synchronous — no async needed) ─
const PORT = process.env.PORT || 3001;

// Restore persisted state from SQLite immediately
detectionEngine.totalPnl = db.getPersistedPnl();
const recentSignals = db.getRecentSignals(50);
currentSignals.push(...recentSignals);
console.log(`[DB] Loaded ${recentSignals.length} historical signals, PNL: $${detectionEngine.totalPnl.toFixed(2)}`);

server.listen(PORT, () => {
  console.log(`[HTTP] Server running on port ${PORT}`);
  console.log(`[WS]  Binary MessagePack WebSocket on port ${PORT}`);
});

