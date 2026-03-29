import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, LineSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';

interface MiniChartProps {
  data: { time: number; price: number }[];
  asset: string;
  color: string;
}

export const MiniChart: React.FC<MiniChartProps> = ({ data, asset, color }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af', // gray-400
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: true,
      },
      crosshair: {
        vertLine: {
          color: color,
          width: 1,
          style: 1,
          labelBackgroundColor: color,
        },
        horzLine: {
          color: color,
          width: 1,
          style: 1,
          labelBackgroundColor: color,
        },
      },
      handleScroll: false,
      handleScale: false,
    });

    // Add Area Line Series
    const newSeries = chart.addSeries(LineSeries, {
      color: color,
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
    });

    chartInstanceRef.current = chart;
    lineSeriesRef.current = newSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Initial size
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [color]);

  useEffect(() => {
    if (!lineSeriesRef.current || data.length === 0) return;

    // Map your custom data to the format that lightweight charts needs.
    // Ensure chronological order and cast time to UTCTimestamp
    const chartData = data
      .map(d => ({
        time: Math.floor(d.time / 1000) as UTCTimestamp, // Convert ms to exact seconds
        value: d.price
      }))
      // lightweight-charts requires strictly ascending time arrays
      .sort((a, b) => (a.time as number) - (b.time as number));

    // Fallback filter to remove exact duplicates which cause lightweight-charts errors
    const uniqueTimeData = chartData.filter((item, index, self) => 
      index === 0 || item.time !== self[index - 1].time
    );

    if (uniqueTimeData.length > 0) {
      lineSeriesRef.current.setData(uniqueTimeData);
      chartInstanceRef.current?.timeScale().fitContent();
    }
    
  }, [data]);

  const latestPrice = data.length > 0 ? data[data.length - 1].price : 0;
  const startPrice = data.length > 0 ? data[0].price : 0;
  const change = latestPrice - startPrice;
  const changePercent = startPrice !== 0 ? (change / startPrice) * 100 : 0;

  return (
    <div className="bg-darkSurface border border-darkBorder rounded-xl p-4 flex flex-col h-48">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-gray-400 font-mono text-xs">{asset} 1-Min</h3>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm font-bold" style={{ color }}>
            ${latestPrice.toFixed(2)}
          </div>
          <div className={`font-mono text-xs ${change >= 0 ? 'text-neonGreen' : 'text-neonRed'}`}>
            {change >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
          </div>
        </div>
      </div>
      
      {/* Chart container needs relative positioning and full height */}
      <div className="relative flex-1 w-full" ref={chartContainerRef} />
    </div>
  );
};
