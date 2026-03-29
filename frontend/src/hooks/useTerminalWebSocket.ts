import { useState, useEffect, useCallback } from 'react';
import { unpack } from 'msgpackr';
import type { Asset, ExchangeName, PriceUpdate, Signal, OrderBook, SentimentData } from '../types';

export interface TerminalState {
  prices: Record<Asset, Record<ExchangeName, number | null>>;
  signals: Signal[];
  connected: boolean;
  history: Record<Asset, { time: number; price: number }[]>;
  pnl: number;
  orderBook: OrderBook | null;
  sentiment: SentimentData | null;
}

const WS_URL = 'ws://localhost:3001';

const INITIAL_PRICES: Record<Asset, Record<ExchangeName, number | null>> = {
  'BTC/USDT': { Binance: null, Coinbase: null, Uniswap: null },
  'ETH/USDT': { Binance: null, Coinbase: null, Uniswap: null },
  'SOL/USDT': { Binance: null, Coinbase: null, Uniswap: null },
};

const INITIAL_HISTORY: Record<Asset, { time: number; price: number }[]> = {
  'BTC/USDT': [],
  'ETH/USDT': [],
  'SOL/USDT': [],
};

const MAX_HISTORY_POINTS = 60;

export function useTerminalWebSocket() {
  const [state, setState] = useState<TerminalState>({
    prices: INITIAL_PRICES,
    signals: [],
    connected: false,
    history: INITIAL_HISTORY,
    pnl: 0,
    orderBook: null,
    sentiment: null,
  });

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);
    // Receive binary ArrayBuffer frames from the MessagePack server
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      setState(s => ({ ...s, connected: true }));
      console.log('[WS] Connected (Binary MessagePack mode)');
    };

    ws.onmessage = (event) => {
      try {
        // Decode binary MessagePack payload
        const message = unpack(new Uint8Array(event.data as ArrayBuffer));

        if (message.type === 'INIT_STATE') {
          setState(s => ({
            ...s,
            prices: message.data.prices || INITIAL_PRICES,
            signals: message.data.signals || [],
            pnl: message.data.pnl || 0,
            sentiment: message.data.sentiment || null,
          }));

        } else if (message.type === 'PNL_UPDATE') {
          setState(s => ({ ...s, pnl: message.data }));

        } else if (message.type === 'ORDERBOOK_UPDATE') {
          setState(s => ({ ...s, orderBook: message.data as OrderBook }));

        } else if (message.type === 'SENTIMENT_UPDATE') {
          setState(s => ({ ...s, sentiment: message.data as SentimentData }));

        } else if (message.type === 'PRICE_UPDATE') {
          const update = message.data as PriceUpdate;

          setState(s => {
            const currentPrices = s.prices[update.asset];
            const newPrices = { ...currentPrices, [update.exchange]: update.price };

            const availableExchanges = Object.values(newPrices).filter((p): p is number => p !== null);
            const avgPrice = availableExchanges.length > 0
              ? availableExchanges.reduce((a, b) => a + b, 0) / availableExchanges.length
              : 0;

            const newHistoryPoint = { time: update.timestamp, price: avgPrice };
            let assetHistory = [...s.history[update.asset], newHistoryPoint];
            if (assetHistory.length > MAX_HISTORY_POINTS) {
              assetHistory = assetHistory.slice(assetHistory.length - MAX_HISTORY_POINTS);
            }

            return {
              ...s,
              prices: { ...s.prices, [update.asset]: newPrices },
              history: { ...s.history, [update.asset]: assetHistory },
            };
          });

        } else if (message.type === 'SIGNAL_UPDATE') {
          const signal = message.data as Signal;
          setState(s => ({
            ...s,
            signals: [signal, ...s.signals].slice(0, 50),
          }));
        }
      } catch (err) {
        console.error('[WS] Decode error:', err);
      }
    };

    ws.onclose = () => {
      setState(s => ({ ...s, connected: false }));
      console.log('[WS] Disconnected. Reconnecting in 3s...');
      setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error('[WS] Error', err);
      ws.close();
    };

    return () => { ws.close(); };
  }, []);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return state;
}
