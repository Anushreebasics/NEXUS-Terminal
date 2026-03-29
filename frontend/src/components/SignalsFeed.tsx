import React from 'react';
import type { Signal } from '../types';
import { AlertTriangle, TrendingUp, TrendingDown, Zap, Activity, DollarSign } from 'lucide-react';
import clsx from 'clsx';

interface SignalsFeedProps {
  signals: Signal[];
}

export const SignalsFeed: React.FC<SignalsFeedProps> = ({ signals }) => {
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'EXECUTION': return <DollarSign className="text-neonGreen" size={20} />;
      case 'ARBITRAGE': return <Zap className="text-neonYellow" size={20} />;
      case 'ANOMALY': return <AlertTriangle className="text-neonRed" size={20} />;
      case 'SPIKE': return <TrendingUp className="text-neonGreen" size={20} />;
      case 'DROP': return <TrendingDown className="text-neonRed" size={20} />;
      default: return <Activity className="text-terminalText" size={20} />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'EXECUTION': return 'border-l-neonGreen';
      case 'ARBITRAGE': return 'border-l-neonYellow';
      case 'ANOMALY': return 'border-l-neonRed';
      case 'SPIKE': return 'border-l-neonGreen';
      case 'DROP': return 'border-l-neonRed';
      default: return 'border-l-terminalText';
    }
  };

  return (
    <div className="w-full h-full bg-darkSurface border border-darkBorder rounded-lg flex flex-col shadow-lg overflow-hidden">
      <div className="p-4 border-b border-darkBorder bg-[#11141c]">
        <h2 className="text-lg font-semibold tracking-wide flex items-center gap-2">
          <Activity className="text-blue-400 animate-pulse" size={20} />
          Detection Engine Alerts
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {signals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-terminalText gap-3">
            <Activity size={48} className="opacity-20" />
            <p>Scanning markets...</p>
          </div>
        ) : (
          signals.map((signal) => (
            <div 
              key={signal.id} 
              className={clsx(
                "p-3 rounded border border-darkBorder border-l-4 shadow-sm transition-all animate-in slide-in-from-right-4 fade-in duration-300",
                getBorderColor(signal.type),
                signal.type === 'EXECUTION' ? 'bg-[#1a2f26]' : 'bg-[#181c25]'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(signal.type)}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm text-gray-200">
                      [{signal.asset}] {signal.type}
                    </span>
                    <span className="text-xs font-mono text-terminalText">
                      {new Date(signal.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 font-mono leading-relaxed">
                    {signal.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
