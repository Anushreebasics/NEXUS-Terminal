import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, AreaSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import type { Asset } from '../types';

interface MainChartProps {
  history: Record<Asset, { time: number; price: number }[]>;
}

export const MainChart: React.FC<MainChartProps> = ({ history }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  
  const [selectedAsset, setSelectedAsset] = useState<Asset>('BTC/USDT');

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(42, 46, 57, 0.5)',
      },
      timeScale: {
        borderColor: 'rgba(42, 46, 57, 0.5)',
        timeVisible: true,
        secondsVisible: true,
      },
      crosshair: {
        mode: 0, // Normal crosshair
        vertLine: { width: 1, color: '#9ca3af', style: 1 },
        horzLine: { width: 1, color: '#9ca3af', style: 1 },
      },
    });

    const newSeries = chart.addSeries(AreaSeries, {
      lineColor: '#14f195',
      topColor: 'rgba(20, 241, 149, 0.4)',
      bottomColor: 'rgba(20, 241, 149, 0.0)',
      lineWidth: 2,
    });

    chartInstanceRef.current = chart;
    lineSeriesRef.current = newSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []); // Run once to initialize

  useEffect(() => {
    if (!lineSeriesRef.current) return;
    
    // Change color based on asset
    const colors: Record<Asset, string> = {
      'BTC/USDT': '#ffcc00', // Yellow
      'ETH/USDT': '#627eea', // Blue
      'SOL/USDT': '#14f195', // Green
    };
    
    const color = colors[selectedAsset];
    lineSeriesRef.current.applyOptions({
      lineColor: color,
      topColor: color.replace(')', ', 0.4)').replace('rgb', 'rgba'), // weak attempt at alpha, but we use hex, so let's just use CSS vars
    });
    // Actually, hex to rgba is tricky, let's just use fixed strings
    const topColor = selectedAsset === 'BTC/USDT' ? 'rgba(255, 204, 0, 0.4)' 
      : selectedAsset === 'ETH/USDT' ? 'rgba(98, 126, 234, 0.4)'
      : 'rgba(20, 241, 149, 0.4)';

    lineSeriesRef.current.applyOptions({
      topColor,
      bottomColor: 'rgba(0,0,0,0)',
    });

    const data = history[selectedAsset];
    if (!data || data.length === 0) return;

    const chartData = data
      .map(d => ({
        time: Math.floor(d.time / 1000) as UTCTimestamp,
        value: d.price
      }))
      .sort((a, b) => (a.time as number) - (b.time as number));

    const uniqueTimeData = chartData.filter((item, index, self) => 
      index === 0 || item.time !== self[index - 1].time
    );

    if (uniqueTimeData.length > 0) {
      lineSeriesRef.current.setData(uniqueTimeData);
      
      // Only fit content on the very first load or when switching assets, otherwise let user pan freely
      chartInstanceRef.current?.timeScale().fitContent();
    }
    
  }, [history, selectedAsset]);

  return (
    <div className="bg-darkSurface border border-darkBorder rounded-xl p-4 flex flex-col h-[400px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-gray-200">Interactive Chart Analysis</h2>
        <div className="flex bg-[#0b0e14] border border-darkBorder rounded-lg p-1 gap-1">
          {(['BTC/USDT', 'ETH/USDT', 'SOL/USDT'] as Asset[]).map(asset => (
            <button
              key={asset}
              onClick={() => setSelectedAsset(asset)}
              className={`px-3 py-1 text-xs font-mono rounded ${selectedAsset === asset ? 'bg-darkBorder text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {asset}
            </button>
          ))}
        </div>
      </div>
      <div className="relative flex-1 w-full" ref={chartContainerRef} />
    </div>
  );
};
