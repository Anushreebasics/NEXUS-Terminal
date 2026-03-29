import WebSocket from 'ws';
import { priceStore } from '../services/PriceStore';
import { Asset } from '../types';

export class BinanceAdapter {
  private ws: WebSocket | null = null;
  private readonly WS_URL = 'wss://stream.binance.com:9443/ws';
  
  // Binance symbols: btcusdt, ethusdt, solusdt
  private readonly streamMap: Record<string, Asset> = {
    'btcusdt': 'BTC/USDT',
    'ethusdt': 'ETH/USDT',
    'solusdt': 'SOL/USDT',
  };

  constructor() {
    this.connect();
  }

  private connect() {
    // Connect to multi-stream
    const streams = Object.keys(this.streamMap).map(s => `${s}@ticker`).join('/');
    this.ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

    this.ws.on('open', () => {
      console.log('[Binance] WebSocket connected');
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.stream && payload.data) {
          const symbolStr = payload.data.s.toLowerCase(); // e.g. BTCUSDT
          const asset = this.streamMap[symbolStr];
          
          if (asset && payload.data.c) {
            const price = parseFloat(payload.data.c); // 'c' is latest closing price
            priceStore.updatePrice({
              asset,
              exchange: 'Binance',
              price,
              timestamp: Date.now()
            });
          }
        }
      } catch (err) {
        console.error('[Binance] Message parse error:', err);
      }
    });

    this.ws.on('close', () => {
      console.log('[Binance] WebSocket disconnected. Reconnecting in 5s...');
      setTimeout(() => this.connect(), 5000);
    });

    this.ws.on('error', (err) => {
      console.error('[Binance] WebSocket error:', err);
      this.ws?.close();
    });
  }
}

export const binanceAdapter = new BinanceAdapter();
