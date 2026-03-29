import React from 'react';
import type { Asset, ExchangeName } from '../types';
import clsx from 'clsx';
import { ArrowUpRight, Minus } from 'lucide-react';

interface PriceTableProps {
  prices: Record<Asset, Record<ExchangeName, number | null>>;
}

const formatPrice = (price: number | null) => {
  if (price === null) return '---';
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const PriceTable: React.FC<PriceTableProps> = ({ prices }) => {
  const assets: Asset[] = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
  const exchanges: ExchangeName[] = ['Binance', 'Coinbase', 'Uniswap'];

  const getSpreadInfo = (asset: Asset) => {
    const assetPrices = prices[asset];
    const availableExchanges = Object.entries(assetPrices).filter(([, p]) => p !== null) as [ExchangeName, number][];
    
    if (availableExchanges.length < 2) return null;

    let minPrice = Infinity;
    let maxPrice = -Infinity;

    availableExchanges.forEach(([, price]) => {
      if (price < minPrice) minPrice = price;
      if (price > maxPrice) maxPrice = price;
    });

    const spreadFactor = maxPrice - minPrice;
    const spreadPercentage = (spreadFactor / minPrice) * 100;
    
    return { spreadPercentage, maxPrice, minPrice };
  };

  return (
    <div className="w-full bg-darkSurface border border-darkBorder rounded-lg overflow-hidden shadow-lg">
      <div className="p-4 border-b border-darkBorder bg-[#11141c]">
        <h2 className="text-lg font-semibold tracking-wide flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neonGreen animate-pulse"></div>
          Live Market Matrix
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0b0e14] text-terminalText border-b border-darkBorder text-sm">
              <th className="py-3 px-4 font-medium uppercase tracking-wider">Asset</th>
              {exchanges.map(ex => (
                <th key={ex} className="py-3 px-4 font-medium uppercase tracking-wider">{ex}</th>
              ))}
              <th className="py-3 px-4 font-medium uppercase tracking-wider border-l border-darkBorder bg-[#11141c]">Spread</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-darkBorder">
            {assets.map((asset) => {
              const spreadInfo = getSpreadInfo(asset);
              const isArbitrage = spreadInfo && spreadInfo.spreadPercentage >= 0.5;

              return (
                <tr key={asset} className="hover:bg-[#181c25] transition-colors group">
                  <td className="py-4 px-4 font-bold text-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-darkBorder flex items-center justify-center text-xs">
                        {asset.split('/')[0]}
                      </span>
                      {asset}
                    </div>
                  </td>
                  
                  {exchanges.map((ex) => {
                    const price = prices[asset][ex];
                    const isMin = spreadInfo && price === spreadInfo.minPrice;
                    const isMax = spreadInfo && price === spreadInfo.maxPrice;

                    return (
                      <td key={ex} className="py-4 px-4 font-mono">
                        <span className={clsx(
                          "transition-colors duration-300",
                          isMin && isArbitrage ? "text-neonGreen" : "",
                          isMax && isArbitrage ? "text-neonRed" : "",
                          !isMin && !isMax && price !== null ? "text-gray-300" : ""
                        )}>
                          {formatPrice(price)}
                        </span>
                        {isMin && isArbitrage && (
                          <span className="ml-2 text-xs text-neonGreen font-semibold border border-neonGreen px-1 rounded bg-neonGreen/10">BUY</span>
                        )}
                        {isMax && isArbitrage && (
                          <span className="ml-2 text-xs text-neonRed font-semibold border border-neonRed px-1 rounded bg-neonRed/10">SELL</span>
                        )}
                      </td>
                    );
                  })}
                  
                  <td className={clsx(
                    "py-4 px-4 font-mono font-bold border-l border-darkBorder bg-[#11141c]",
                    isArbitrage ? 'text-neonYellow shimmer' : 'text-gray-400'
                  )}>
                    {spreadInfo ? (
                      <div className="flex items-center gap-1">
                        {spreadInfo.spreadPercentage.toFixed(3)}%
                        {isArbitrage ? <ArrowUpRight size={16} /> : <Minus size={16} />}
                      </div>
                    ) : '---'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
