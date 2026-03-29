import { EventEmitter } from 'events';
import { priceStore } from './PriceStore';
import { db } from './Database';
import { Asset, ExchangeName, PriceUpdate, Signal, SignalType } from '../types';
import crypto from 'crypto';

import type { TerminalSettings } from '../types';

export class DetectionEngine extends EventEmitter {
  public settings: TerminalSettings = {
    arbitrageThreshold: 0.5,
    anomalyThreshold: 2.0, // Now represents Z-Score threshold (standard deviations)
    spikeThreshold: 1.5
  };

  public totalPnl: number = 0; // Virtual portfolio profit
  
  // Rolling window of last 100 prices for Z-Score math
  private zScoreHistory: Record<Asset, Record<ExchangeName, number[]>> = {
    'BTC/USDT': { Binance: [], Coinbase: [], Uniswap: [] },
    'ETH/USDT': { Binance: [], Coinbase: [], Uniswap: [] },
    'SOL/USDT': { Binance: [], Coinbase: [], Uniswap: [] },
  };

  public updateSettings(newSettings: Partial<TerminalSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.emit('settings_updated', this.settings);
  }

  constructor() {
    super();
    priceStore.on('price_update', this.handlePriceUpdate.bind(this));
  }

  private handlePriceUpdate(update: PriceUpdate) {
    // 1. Update rolling window for Z-Score
    const history = this.zScoreHistory[update.asset][update.exchange];
    history.push(update.price);
    if (history.length > 100) {
      history.shift();
    }

    // 2. Run detection sweeps
    this.checkArbitrage(update.asset, update.timestamp);
    this.checkAnomalies(update.asset, update.exchange, update.price, update.timestamp);
    this.checkSpikes(update.asset, update.exchange, update.timestamp);
  }

  private emitSignal(type: SignalType, asset: Asset, message: string, timestamp: number, data?: any) {
    const signal: Signal = {
      id: crypto.randomUUID(),
      type,
      asset,
      message,
      timestamp,
      data
    };
    db.saveSignal(signal); // Fire and forget persist to DB
    this.emit('signal', signal);
  }

  private checkArbitrage(asset: Asset, timestamp: number) {
    const prices = priceStore.getPrices()[asset];
    const availableExchanges = Object.entries(prices).filter(([, p]) => p !== null) as [ExchangeName, number][];
    
    if (availableExchanges.length < 2) return;

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let minEx = '';
    let maxEx = '';

    availableExchanges.forEach(([ex, price]) => {
      if (price < minPrice) {
        minPrice = price;
        minEx = ex;
      }
      if (price > maxPrice) {
        maxPrice = price;
        maxEx = ex;
      }
    });

    const spreadFactor = maxPrice - minPrice;
    const spreadPercentage = (spreadFactor / minPrice) * 100;

    if (spreadPercentage >= this.settings.arbitrageThreshold) {
      // General Alert
      this.emitSignal(
        'ARBITRAGE',
        asset,
        `Arbitrage opportunity: Buy on ${minEx} ($${minPrice.toFixed(2)}), Sell on ${maxEx} ($${maxPrice.toFixed(2)}). Spread: ${spreadPercentage.toFixed(2)}%`,
        timestamp,
        { minEx, maxEx, minPrice, maxPrice, spreadPercentage }
      );

      // Paper Trading Execution Logic
      const TRADE_SIZE_USD = 10000;
      const tokensBought = TRADE_SIZE_USD / minPrice;
      const grossReturn = tokensBought * maxPrice;
      const profit = grossReturn - TRADE_SIZE_USD;
      
      // Simulate 0.1% maker/taker exchange fees
      const feeBuy = TRADE_SIZE_USD * 0.001;
      const feeSell = grossReturn * 0.001;
      const netProfit = profit - (feeBuy + feeSell);

      // Only execute if strictly profitable
      if (netProfit > 0) {
        this.totalPnl += netProfit;
        db.updatePnl(this.totalPnl); // Persist updated PNL
        
        this.emitSignal(
          'EXECUTION',
          asset,
          `EXECUTED $10k ARBITRAGE: Buy ${minEx} -> Sell ${maxEx}. Net Profit: +$${netProfit.toFixed(2)}`,
          timestamp,
          { netProfit, totalPnl: this.totalPnl, tradeSize: TRADE_SIZE_USD }
        );
      }
    }
  }

  private checkAnomalies(asset: Asset, exchange: ExchangeName, currentPrice: number, timestamp: number) {
    const history = this.zScoreHistory[asset][exchange];
    // Need minimum 10 points for statistical significance
    if (history.length < 10) return;

    const sum = history.reduce((a, b) => a + b, 0);
    const mean = sum / history.length;
    
    const squaredDiffs = history.map(p => Math.pow(p - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / history.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return;

    // Calculate Z-Score
    const zScore = Math.abs(currentPrice - mean) / stdDev;

    // Check against standard deviation threshold (default 2.0σ)
    if (zScore >= this.settings.anomalyThreshold) {
      this.emitSignal(
        'ANOMALY',
        asset,
        `Statistical Anomaly on ${exchange}: $${currentPrice.toFixed(2)} is ${zScore.toFixed(1)}σ away from moving avg $${mean.toFixed(2)}`,
        timestamp,
        { exchange, currentPrice, mean, stdDev, zScore }
      );
    }
  }

  private checkSpikes(asset: Asset, exchange: ExchangeName, timestamp: number) {
    const history = priceStore.getHistory(asset, exchange);
    if (history.length < 2) return;

    const currentPrice = history[history.length - 1].price;
    const oldestPrice = history[0].price;

    const diff = currentPrice - oldestPrice;
    const diffPercentage = (Math.abs(diff) / oldestPrice) * 100;

    if (diffPercentage >= this.settings.spikeThreshold) {
      const type: SignalType = diff > 0 ? 'SPIKE' : 'DROP';
      const dirWord = diff > 0 ? 'Spike' : 'Drop';
      
      this.emitSignal(
        type,
        asset,
        `Rapid ${dirWord} on ${exchange}: ${diffPercentage.toFixed(2)}% in the last 30s. Current: $${currentPrice.toFixed(2)}`,
        timestamp,
        { exchange, diffPercentage, oldPrice: oldestPrice, currentPrice }
      );
    }
  }
}

export const detectionEngine = new DetectionEngine();
