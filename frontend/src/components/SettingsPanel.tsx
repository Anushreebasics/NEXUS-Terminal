import React, { useState, useEffect } from 'react';
import { X, Settings2, Save } from 'lucide-react';
import type { TerminalSettings } from '../types';

interface SettingsPanelProps {
  onClose: () => void;
}

const API_BASE = 'http://localhost:3001/api';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<TerminalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then(res => res.json())
      .then((data: TerminalSettings) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load settings', err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      onClose(); // close on success
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="text-neonGreen animate-pulse font-mono tracking-widest">LOADING SETTINGS...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-darkSurface border border-darkBorder w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-darkBorder bg-[#0b0e14]">
          <h2 className="text-lg font-bold flex items-center gap-2 text-gray-200">
            <Settings2 className="text-neonGreen" size={20} />
            Terminal Settings
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-semibold text-gray-300">Arbitrage Spread Threshold</label>
                <span className="text-sm text-neonYellow font-mono">{settings.arbitrageThreshold.toFixed(2)}%</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">Triggers when spread between exchanges exceeds this.</p>
              <input 
                type="range" min="0.1" max="5" step="0.1" 
                value={settings.arbitrageThreshold}
                onChange={e => setSettings({...settings, arbitrageThreshold: parseFloat(e.target.value)})}
                className="w-full h-2 bg-darkBorder rounded-lg appearance-none cursor-pointer accent-neonYellow"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-semibold text-gray-300">Anomaly Deviation Threshold</label>
                <span className="text-sm text-neonRed font-mono">{settings.anomalyThreshold.toFixed(2)}%</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">Triggers when exchange price deviates from global avg.</p>
              <input 
                type="range" min="0.5" max="10" step="0.5" 
                value={settings.anomalyThreshold}
                onChange={e => setSettings({...settings, anomalyThreshold: parseFloat(e.target.value)})}
                className="w-full h-2 bg-darkBorder rounded-lg appearance-none cursor-pointer accent-neonRed"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-semibold text-gray-300">Spike/Drop Detection Threshold</label>
                <span className="text-sm text-neonGreen font-mono">{settings.spikeThreshold.toFixed(2)}%</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">Triggers when asset changes rapidly in a 30s tumble window.</p>
              <input 
                type="range" min="0.5" max="10" step="0.5" 
                value={settings.spikeThreshold}
                onChange={e => setSettings({...settings, spikeThreshold: parseFloat(e.target.value)})}
                className="w-full h-2 bg-darkBorder rounded-lg appearance-none cursor-pointer accent-neonGreen"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-darkBorder bg-[#0b0e14] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-bold bg-white text-darkBg hover:bg-gray-200 transition-colors rounded flex items-center gap-2"
          >
            {saving ? 'Saving...' : <><Save size={16} /> Apply Settings</>}
          </button>
        </div>
      </div>
    </div>
  );
};
