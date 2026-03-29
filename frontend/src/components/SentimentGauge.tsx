import React from 'react';
import type { SentimentData } from '../types';

interface SentimentGaugeProps {
  sentiment: SentimentData | null;
}

const GAUGE_COLORS: Record<string, { ring: string; text: string; bg: string }> = {
  'Extreme Fear': { ring: '#ef4444', text: 'text-red-400', bg: 'bg-red-900/20' },
  'Fear':         { ring: '#f97316', text: 'text-orange-400', bg: 'bg-orange-900/20' },
  'Neutral':      { ring: '#eab308', text: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  'Greed':        { ring: '#22c55e', text: 'text-green-400', bg: 'bg-green-900/20' },
  'Extreme Greed':{ ring: '#4ade80', text: 'text-emerald-400', bg: 'bg-emerald-900/20' },
};

export const SentimentGauge: React.FC<SentimentGaugeProps> = ({ sentiment }) => {
  if (!sentiment) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-darkSurface border border-darkBorder rounded-lg">
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
        <span className="text-xs text-gray-500 font-mono">LOADING SENTIMENT...</span>
      </div>
    );
  }

  const colors = GAUGE_COLORS[sentiment.label] || GAUGE_COLORS['Neutral'];
  // Map -100…100 to 0…100 for display
  const normalizedScore = Math.round((sentiment.score + 100) / 2);

  return (
    <div
      className={`flex items-center gap-3 px-3 py-1.5 border border-darkBorder rounded-lg ${colors.bg} transition-all duration-700`}
      title={`Latest headline: ${sentiment.headline}`}
    >
      {/* Mini gauge arc — CSS-based semicircle */}
      <div className="relative w-10 h-5 overflow-hidden shrink-0">
        <div
          className="absolute bottom-0 left-0 w-10 h-10 rounded-full border-4 border-darkBorder"
          style={{ borderTopColor: colors.ring, borderRightColor: colors.ring, transform: `rotate(${(normalizedScore / 100) * 180 - 90}deg)`, transition: 'transform 0.8s ease' }}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] font-bold font-mono" style={{ color: colors.ring }}>
          {sentiment.score > 0 ? '+' : ''}{sentiment.score}
        </div>
      </div>

      <div className="flex flex-col leading-tight min-w-0">
        <span className={`text-xs font-bold font-mono uppercase tracking-wider ${colors.text}`}>
          {sentiment.label}
        </span>
        <span className="text-[10px] text-gray-500 font-mono truncate max-w-[180px]" title={sentiment.headline}>
          {sentiment.headline.substring(0, 40)}{sentiment.headline.length > 40 ? '…' : ''}
        </span>
      </div>
    </div>
  );
};
