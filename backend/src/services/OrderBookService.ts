import { EventEmitter } from 'events';
import WebSocket from 'ws';
import type { OrderBook, OrderBookLevel } from '../types';

export class OrderBookService extends EventEmitter {
  private binanceWs: WebSocket | null = null;
  private coinbaseWs: WebSocket | null = null;

  // Local state: top 10 levels
  private binanceBook: { bids: Map<number, number>; asks: Map<number, number> } = {
    bids: new Map(),
    asks: new Map(),
  };
  private coinbaseBook: { bids: Map<number, number>; asks: Map<number, number> } = {
    bids: new Map(),
    asks: new Map(),
  };

  constructor() {
    super();
    this.connectBinance();
    this.connectCoinbase();
  }

  private connectBinance() {
    // Binance depth stream for BTC/USDT — top 20 levels, 100ms updates
    this.binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@depth20@1000ms');

    this.binanceWs.on('open', () => console.log('[OrderBook:Binance] Connected'));

    this.binanceWs.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        // msg.bids and msg.asks are arrays of [price, qty] strings
        this.binanceBook.bids.clear();
        this.binanceBook.asks.clear();
        for (const [p, q] of msg.bids.slice(0, 10)) {
          this.binanceBook.bids.set(parseFloat(p), parseFloat(q));
        }
        for (const [p, q] of msg.asks.slice(0, 10)) {
          this.binanceBook.asks.set(parseFloat(p), parseFloat(q));
        }
        this.emitBook('Binance');
      } catch (e) {
        // silently drop
      }
    });

    this.binanceWs.on('close', () => {
      console.log('[OrderBook:Binance] Disconnected, reconnecting...');
      setTimeout(() => this.connectBinance(), 5000);
    });
    this.binanceWs.on('error', () => this.binanceWs?.close());
  }

  private connectCoinbase() {
    this.coinbaseWs = new WebSocket('wss://ws-feed.exchange.coinbase.com');

    this.coinbaseWs.on('open', () => {
      console.log('[OrderBook:Coinbase] Connected');
      this.coinbaseWs?.send(JSON.stringify({
        type: 'subscribe',
        product_ids: ['BTC-USD'],
        channels: ['level2_batch']
      }));
    });

    this.coinbaseWs.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'snapshot') {
          this.coinbaseBook.bids.clear();
          this.coinbaseBook.asks.clear();
          for (const [p, q] of (msg.bids || []).slice(0, 10)) {
            this.coinbaseBook.bids.set(parseFloat(p), parseFloat(q));
          }
          for (const [p, q] of (msg.asks || []).slice(0, 10)) {
            this.coinbaseBook.asks.set(parseFloat(p), parseFloat(q));
          }
          this.emitBook('Coinbase');
        } else if (msg.type === 'l2update') {
          const changes: [string, string, string][] = msg.changes || [];
          for (const [side, price, qty] of changes) {
            const p = parseFloat(price);
            const q = parseFloat(qty);
            const map = side === 'buy' ? this.coinbaseBook.bids : this.coinbaseBook.asks;
            if (q === 0) map.delete(p);
            else map.set(p, q);
          }
          this.emitBook('Coinbase');
        }
      } catch (e) {
        // silently drop
      }
    });

    this.coinbaseWs.on('close', () => {
      console.log('[OrderBook:Coinbase] Disconnected, reconnecting...');
      setTimeout(() => this.connectCoinbase(), 5000);
    });
    this.coinbaseWs.on('error', () => this.coinbaseWs?.close());
  }

  private emitBook(exchange: 'Binance' | 'Coinbase') {
    const book = exchange === 'Binance' ? this.binanceBook : this.coinbaseBook;

    const sortedBids: OrderBookLevel[] = [...book.bids.entries()]
      .sort((a, b) => b[0] - a[0])
      .slice(0, 10) as OrderBookLevel[];

    const sortedAsks: OrderBookLevel[] = [...book.asks.entries()]
      .sort((a, b) => a[0] - b[0])
      .slice(0, 10) as OrderBookLevel[];

    const orderBook: OrderBook = {
      asset: 'BTC/USDT',
      exchange,
      bids: sortedBids,
      asks: sortedAsks,
      timestamp: Date.now(),
    };

    this.emit('orderbook_update', orderBook);
  }
}

export const orderBookService = new OrderBookService();
