export type Asset = 'BTC/USDT' | 'ETH/USDT' | 'SOL/USDT';
export type ExchangeName = 'Binance' | 'Coinbase' | 'Uniswap';

export interface PriceUpdate {
  asset: Asset;
  exchange: ExchangeName;
  price: number;
  timestamp: number;
}

export type SignalType = 'NORMAL' | 'ARBITRAGE' | 'ANOMALY' | 'SPIKE' | 'DROP' | 'EXECUTION' | 'SENTIMENT';

export interface Signal {
  id: string;
  type: SignalType;
  asset: Asset;
  message: string;
  timestamp: number;
  data?: any;
}

export interface TerminalSettings {
  arbitrageThreshold: number;
  anomalyThreshold: number;
  spikeThreshold: number;
}

export interface TerminalState {
  prices: Record<Asset, Record<ExchangeName, number | null>>;
  signals: Signal[];
  pnl: number;
}

// L2 Order Book types
export type OrderBookLevel = [number, number]; // [price, quantity]
export interface OrderBook {
  asset: Asset;
  exchange: ExchangeName;
  bids: OrderBookLevel[]; // top 10 bids [price, qty] descending
  asks: OrderBookLevel[]; // top 10 asks [price, qty] ascending
  timestamp: number;
}

// Sentiment
export interface SentimentData {
  score: number;         // -100 to 100
  label: string;         // 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed'
  headline: string;      // most recent news headline that triggered the score
  timestamp: number;
}
