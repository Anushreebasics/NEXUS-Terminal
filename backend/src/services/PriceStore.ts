import { EventEmitter } from 'events';
import { Asset, ExchangeName, PriceUpdate } from '../types';

export class PriceStore extends EventEmitter {
  // Current latest prices: prices[Asset][Exchange] = price
  private prices: Record<Asset, Record<ExchangeName, number | null>> = {
    'BTC/USDT': { Binance: null, Coinbase: null, Uniswap: null },
    'ETH/USDT': { Binance: null, Coinbase: null, Uniswap: null },
    'SOL/USDT': { Binance: null, Coinbase: null, Uniswap: null },
  };

  // Keep a tumbling window of prices for spike detection. Array of {price, timestamp}
  private history: Record<Asset, Record<ExchangeName, { price: number; timestamp: number }[]>> = {
    'BTC/USDT': { Binance: [], Coinbase: [], Uniswap: [] },
    'ETH/USDT': { Binance: [], Coinbase: [], Uniswap: [] },
    'SOL/USDT': { Binance: [], Coinbase: [], Uniswap: [] },
  };

  // 30 seconds history window
  private readonly HISTORY_WINDOW_MS = 30 * 1000;

  constructor() {
    super();
  }

  public updatePrice(update: PriceUpdate) {
    const { asset, exchange, price, timestamp } = update;
    
    // Update current price
    this.prices[asset][exchange] = price;

    // Update history
    const historyList = this.history[asset][exchange];
    historyList.push({ price, timestamp });

    // Prune history
    const cutoff = timestamp - this.HISTORY_WINDOW_MS;
    while (historyList.length > 0 && historyList[0].timestamp < cutoff) {
      historyList.shift();
    }

    // Emit event for detection engine & clients
    this.emit('price_update', update);
  }

  public getPrices() {
    return this.prices;
  }

  public getPrice(asset: Asset, exchange: ExchangeName) {
    return this.prices[asset][exchange];
  }

  public getHistory(asset: Asset, exchange: ExchangeName) {
    return this.history[asset][exchange];
  }
}

export const priceStore = new PriceStore();
