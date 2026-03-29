import React, { useMemo } from 'react';
import type { OrderBook } from '../types';

interface OrderBookProps {
  orderBook: OrderBook | null;
}

export const OrderBookPanel: React.FC<OrderBookProps> = ({ orderBook }) => {
  const maxQty = useMemo(() => {
    if (!orderBook) return 1;
    const allQty = [
      ...orderBook.bids.map(([, q]) => q),
      ...orderBook.asks.map(([, q]) => q),
    ];
    return Math.max(...allQty, 1);
  }, [orderBook]);

  const formatPrice = (p: number) => p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatQty = (q: number) => q.toFixed(4);

  if (!orderBook) {
    return (
      <div className="w-full h-full bg-darkSurface border border-darkBorder rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm font-mono animate-pulse">Connecting to order book stream...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-darkSurface border border-darkBorder rounded-lg flex flex-col overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-darkBorder bg-[#11141c] flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-widest text-gray-200 uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neonGreen animate-pulse inline-block" />
          BTC/USDT — L2 Order Book
        </h2>
        <span className="text-xs text-gray-500 font-mono">{orderBook.exchange}</span>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 text-[10px] text-gray-500 font-mono px-3 py-1 border-b border-darkBorder uppercase tracking-wider">
        <span>Price (USD)</span>
        <span className="text-center">Quantity</span>
        <span className="text-right">Depth %</span>
      </div>

      {/* Asks — displayed top to bottom (lowest ask first = closest to market) */}
      <div className="flex-1 overflow-y-auto">
        {[...orderBook.asks].reverse().map(([price, qty], i) => {
          const pct = (qty / maxQty) * 100;
          return (
            <div key={`ask-${i}`} className="relative grid grid-cols-3 text-xs font-mono px-3 py-[3px] hover:bg-[#1a1e2a] transition-colors">
              <div
                className="absolute inset-y-0 right-0 bg-neonRed/10"
                style={{ width: `${pct}%` }}
              />
              <span className="text-neonRed z-10">{formatPrice(price)}</span>
              <span className="text-center text-gray-300 z-10">{formatQty(qty)}</span>
              <span className="text-right text-gray-500 z-10">{pct.toFixed(1)}%</span>
            </div>
          );
        })}

        {/* Spread indicator */}
        {orderBook.asks.length > 0 && orderBook.bids.length > 0 && (() => {
          const bestAsk = orderBook.asks[0][0];
          const bestBid = orderBook.bids[0][0];
          const spread = bestAsk - bestBid;
          const spreadPct = (spread / bestBid) * 100;
          return (
            <div className="flex items-center justify-center py-1 bg-[#11141c] border-y border-darkBorder">
              <span className="text-[10px] font-mono text-neonYellow tracking-wider">
                SPREAD: ${spread.toFixed(2)} ({spreadPct.toFixed(3)}%)
              </span>
            </div>
          );
        })()}

        {/* Bids */}
        {orderBook.bids.map(([price, qty], i) => {
          const pct = (qty / maxQty) * 100;
          return (
            <div key={`bid-${i}`} className="relative grid grid-cols-3 text-xs font-mono px-3 py-[3px] hover:bg-[#1a1e2a] transition-colors">
              <div
                className="absolute inset-y-0 left-0 bg-neonGreen/10"
                style={{ width: `${pct}%` }}
              />
              <span className="text-neonGreen z-10">{formatPrice(price)}</span>
              <span className="text-center text-gray-300 z-10">{formatQty(qty)}</span>
              <span className="text-right text-gray-500 z-10">{pct.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
