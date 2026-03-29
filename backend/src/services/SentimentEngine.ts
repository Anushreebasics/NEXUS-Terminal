import { EventEmitter } from 'events';
import type { SentimentData } from '../types';

// Use dynamic import for ESM-only rss-parser
let RSSParser: any;
async function getRSSParser() {
  if (!RSSParser) {
    const mod = await import('rss-parser');
    RSSParser = mod.default || mod;
  }
  return RSSParser;
}

// Lightweight local sentiment scoring without external ML models
// Uses financial keyword-based lexicon for accuracy in crypto context
const BULLISH_WORDS = [
  'surge', 'rally', 'soar', 'gain', 'rise', 'bull', 'bullish', 'record', 'high',
  'up', 'jump', 'spike', 'breakout', 'approve', 'adoption', 'growth', 'strong',
  'positive', 'exceed', 'beat', 'launch', 'partnership', 'buy', 'upgrade',
  'institutional', 'inflow', 'etf', 'green', 'profit', 'milestone', 'win',
];

const BEARISH_WORDS = [
  'crash', 'drop', 'fall', 'decline', 'bear', 'bearish', 'low', 'down', 'plunge',
  'sell', 'hack', 'fraud', 'scam', 'ban', 'regulate', 'warning', 'loss', 'fear',
  'panic', 'dump', 'breakdown', 'liquidation', 'collapse', 'fail', 'risk',
  'lawsuit', 'investigation', 'outflow', 'red', 'penalty', 'illegal',
];

function scoreLine(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const word of BULLISH_WORDS) {
    if (lower.includes(word)) score += 10;
  }
  for (const word of BEARISH_WORDS) {
    if (lower.includes(word)) score -= 10;
  }
  return Math.max(-100, Math.min(100, score));
}

function getLabel(score: number): string {
  if (score <= -60) return 'Extreme Fear';
  if (score <= -20) return 'Fear';
  if (score <= 20) return 'Neutral';
  if (score <= 60) return 'Greed';
  return 'Extreme Greed';
}

const CRYPTO_RSS_FEEDS = [
  'https://feeds.feedburner.com/CoinDesk',
  'https://cointelegraph.com/rss',
  'https://decrypt.co/feed',
];

export class SentimentEngine extends EventEmitter {
  private currentSentiment: SentimentData = {
    score: 0,
    label: 'Neutral',
    headline: 'Initializing market sentiment analysis...',
    timestamp: Date.now(),
  };

  private pollInterval?: NodeJS.Timeout;

  constructor() {
    super();
    // Initial fetch after 3 seconds, then every 2 minutes
    setTimeout(() => this.fetchAndAnalyze(), 3000);
    this.pollInterval = setInterval(() => this.fetchAndAnalyze(), 120_000);
  }

  public getSentiment(): SentimentData {
    return this.currentSentiment;
  }

  private async fetchAndAnalyze() {
    try {
      const Parser = await getRSSParser();
      const parser = new Parser({ timeout: 10000 });

      // Try feeds in order, stop when we get headlines
      let headlines: string[] = [];
      for (const feedUrl of CRYPTO_RSS_FEEDS) {
        try {
          const feed = await parser.parseURL(feedUrl);
          const items = feed.items?.slice(0, 15) || [];
          headlines = items.map((item: any) => `${item.title || ''} ${item.contentSnippet || ''}`);
          if (headlines.length > 0) break;
        } catch {
          // Try next feed
        }
      }

      if (headlines.length === 0) {
        console.log('[Sentiment] No headlines retrieved from feeds');
        return;
      }

      // Calculate aggregate score across all headlines
      const scores = headlines.map(h => scoreLine(h));
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const roundedScore = Math.round(avgScore);

      // Find the headline with the highest absolute impact
      let topHeadline = headlines[0];
      let topAbsScore = 0;
      for (let i = 0; i < headlines.length; i++) {
        if (Math.abs(scores[i]) > topAbsScore) {
          topAbsScore = Math.abs(scores[i]);
          topHeadline = headlines[i];
        }
      }

      // Truncate headline if too long
      const shortHeadline = topHeadline.trim().substring(0, 120);

      this.currentSentiment = {
        score: roundedScore,
        label: getLabel(roundedScore),
        headline: shortHeadline || 'No headline available',
        timestamp: Date.now(),
      };

      console.log(`[Sentiment] Score: ${roundedScore} (${getLabel(roundedScore)}) | Headlines analyzed: ${headlines.length}`);
      this.emit('sentiment_update', this.currentSentiment);
    } catch (err) {
      console.error('[Sentiment] Error fetching headlines:', err);
    }
  }

  public stop() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }
}

export const sentimentEngine = new SentimentEngine();
