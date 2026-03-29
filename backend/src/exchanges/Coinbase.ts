import WebSocket from 'ws';
import { priceStore } from '../services/PriceStore';
import { Asset } from '../types';

export class CoinbaseAdapter {
  private ws: WebSocket | null = null;
  private readonly WS_URL = 'wss://ws-feed.exchange.coinbase.com';

  private readonly productMap: Record<string, Asset> = {
    'BTC-USD': 'BTC/USDT',
    'ETH-USD': 'ETH/USDT',
    'SOL-USD': 'SOL/USDT',
  };

  constructor() {
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(this.WS_URL);

    this.ws.on('open', () => {
      console.log('[Coinbase] WebSocket connected');
      // Subscribe to ticker
      const subscribeMessage = {
        type: 'subscribe',
        product_ids: Object.keys(this.productMap),
        channels: ['ticker']
      };
      this.ws?.send(JSON.stringify(subscribeMessage));
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.type === 'ticker' && payload.product_id && payload.price) {
          const asset = this.productMap[payload.product_id];
          if (asset) {
            const price = parseFloat(payload.price);
            priceStore.updatePrice({
              asset,
              exchange: 'Coinbase',
              price,
              timestamp: Date.now()
            });
          }
        }
      } catch (err) {
        console.error('[Coinbase] Message parse error:', err);
      }
    });

    this.ws.on('close', () => {
      console.log('[Coinbase] WebSocket disconnected. Reconnecting in 5s...');
      setTimeout(() => this.connect(), 5000);
    });

    this.ws.on('error', (err) => {
      console.error('[Coinbase] WebSocket error:', err);
      this.ws?.close();
    });
  }
}

export const coinbaseAdapter = new CoinbaseAdapter();
