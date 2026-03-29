import { useState } from 'react';
import { useTerminalWebSocket } from './hooks/useTerminalWebSocket';
import { useNotifications } from './hooks/useNotifications';
import { PriceTable } from './components/PriceTable';
import { SignalsFeed } from './components/SignalsFeed';
import { MiniChart } from './components/MiniChart';
import { MainChart } from './components/MainChart';
import { SettingsPanel } from './components/SettingsPanel';
import { OrderBookPanel } from './components/OrderBook';
import { SentimentGauge } from './components/SentimentGauge';
import { Activity, Radio, Settings2, Bell, BellOff } from 'lucide-react';

function App() {
  const { prices, signals, connected, history, pnl, orderBook, sentiment } = useTerminalWebSocket();
  const { permission } = useNotifications(signals);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col font-terminal">
      {/* Header */}
      <header className="h-16 border-b border-darkBorder bg-[#0b0e14] flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <Activity className="text-neonGreen animate-pulse" size={24} />
          <h1 className="text-xl font-bold tracking-widest text-gray-100">
            NEXUS <span className="font-light text-gray-500">TERMINAL</span>
          </h1>
        </div>

        <div className="flex items-center gap-4 text-sm font-mono">
          {/* Sentiment Gauge */}
          <SentimentGauge sentiment={sentiment} />

          {/* PnL Display */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-darkSurface border border-darkBorder rounded-lg">
            <span className="text-gray-400 text-xs">PAPER PNL:</span>
            <span className={`font-bold ${pnl > 0 ? 'text-neonGreen' : pnl < 0 ? 'text-neonRed' : 'text-gray-300'}`}>
              {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-500" title={`Notifications: ${permission}`}>
            {permission === 'granted' ? <Bell size={16} className="text-neonYellow" /> : <BellOff size={16} />}
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <Settings2 size={18} />
            <span>CONFIG</span>
          </button>

          <div className="flex items-center gap-2">
            <Radio size={16} className={connected ? 'text-neonGreen animate-pulse' : 'text-neonRed'} />
            <span className={connected ? 'text-neonGreen' : 'text-neonRed'}>
              {connected ? 'LIVE' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 p-6 flex flex-col gap-6 max-w-[1800px] w-full mx-auto overflow-hidden">

        {/* Top Row: Mini Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
          <MiniChart data={history['BTC/USDT']} asset="BTC/USDT" color="#ffcc00" />
          <MiniChart data={history['ETH/USDT']} asset="ETH/USDT" color="#627eea" />
          <MiniChart data={history['SOL/USDT']} asset="SOL/USDT" color="#14f195" />
        </div>

        {/* Middle Row: Main Chart + Order Book */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 shrink-0">
          <div className="xl:col-span-3">
            <MainChart history={history} />
          </div>
          <div className="min-h-[350px] xl:min-h-0">
            <OrderBookPanel orderBook={orderBook} />
          </div>
        </div>

        {/* Bottom Row: Price Matrix and Signals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
          <div className="lg:col-span-2 flex flex-col">
            <PriceTable prices={prices} />
          </div>
          <div className="flex flex-col h-[500px] lg:h-full">
            <SignalsFeed signals={signals} />
          </div>
        </div>
      </main>

      {isSettingsOpen && <SettingsPanel onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}

export default App;
