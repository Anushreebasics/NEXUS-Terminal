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

export type OrderBookLevel = [number, number];
export interface OrderBook {
  asset: Asset;
  exchange: ExchangeName;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

export interface SentimentData {
  score: number;    // -100 to 100
  label: string;   // 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed'
  headline: string;
  timestamp: number;
}
