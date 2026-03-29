import Database from 'better-sqlite3';
import path from 'path';
import type { Signal } from '../types';

const DB_PATH = path.join(__dirname, '../../prisma/dev.db');

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL'); // Better concurrent write performance
    this.db.pragma('synchronous = NORMAL');
    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS terminal_state (
        id      INTEGER PRIMARY KEY DEFAULT 1,
        total_pnl REAL NOT NULL DEFAULT 0.0
      );
      INSERT OR IGNORE INTO terminal_state (id, total_pnl) VALUES (1, 0.0);

      CREATE TABLE IF NOT EXISTS processed_signals (
        id        TEXT PRIMARY KEY,
        type      TEXT NOT NULL,
        asset     TEXT NOT NULL,
        message   TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        data      TEXT NOT NULL DEFAULT '{}'
      );
    `);
    console.log('[Database] SQLite ready at', DB_PATH);
  }

  // ── PnL ────────────────────────────────────────────────────────

  public getPersistedPnl(): number {
    const row = this.db.prepare('SELECT total_pnl FROM terminal_state WHERE id = 1').get() as any;
    return row ? row.total_pnl : 0.0;
  }

  public updatePnl(pnl: number): void {
    this.db.prepare('UPDATE terminal_state SET total_pnl = ? WHERE id = 1').run(pnl);
  }

  // ── Signals ─────────────────────────────────────────────────────

  public saveSignal(signal: Signal): void {
    // Fire-and-forget — ignore duplicate ids
    try {
      this.db.prepare(`
        INSERT OR IGNORE INTO processed_signals (id, type, asset, message, timestamp, data)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        signal.id,
        signal.type,
        signal.asset,
        signal.message,
        signal.timestamp,
        JSON.stringify(signal.data || {})
      );
    } catch {
      // Silently ignore
    }
  }

  public getRecentSignals(limit = 50): Signal[] {
    const rows = this.db.prepare(
      'SELECT * FROM processed_signals ORDER BY timestamp DESC LIMIT ?'
    ).all(limit) as any[];

    return rows.map(r => ({
      id: r.id,
      type: r.type as any,
      asset: r.asset as any,
      message: r.message,
      timestamp: r.timestamp,
      data: JSON.parse(r.data)
    })).reverse();
  }
}

export const db = new DatabaseService();
