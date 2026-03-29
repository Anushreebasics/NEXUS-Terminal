import { useEffect, useState, useRef } from 'react';
import type { Signal } from '../types';

export function useNotifications(signals: Signal[]) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const prevSignalCount = useRef(0);

  useEffect(() => {
    // Request permission on mount
    if ('Notification' in window) {
      Notification.requestPermission().then(setPermission);
    }
  }, []);

  // Simple synthesized beep to avoid base64 decoding issues cross-browser if they have strict autoplay
  const playBeep = () => {
    try {
      if (!window.AudioContext && !(window as any).webkitAudioContext) return;
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); 
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error("Audio beep failed", e);
    }
  };

  useEffect(() => {
    if (signals.length === 0) return;
    
    // Check if there are NEW signals
    if (signals.length > prevSignalCount.current) {
      // The newest signal is at the top (index 0) because our hook prepends them
      const latestSignal = signals[0];
      
      if (latestSignal.type === 'ARBITRAGE' || latestSignal.type === 'ANOMALY') {
        // 1. Play audio
        playBeep();
        
        // 2. Show native desktop notification
        if (permission === 'granted') {
          const title = `${latestSignal.type === 'ARBITRAGE' ? '🟢 ARBITRAGE DETECTED' : '🔴 ANOMALY DETECTED'}`;
          const options: NotificationOptions = {
            body: `${latestSignal.asset}: ${latestSignal.message}`,
            icon: '/favicon.ico', // generic fallback icon
            tag: latestSignal.id, // prevent duplicate notifications
            silent: true // we play our own beep
          };
          
          new Notification(title, options);
        }
      }
    }
    
    prevSignalCount.current = signals.length;
  }, [signals, permission]);

  return { permission };
}
