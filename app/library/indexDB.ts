import Dexie, { Table, liveQuery } from 'dexie';

const DB_NAME = "MySecretMemoDB";
const STORE_NAME = "MemoStore";
const HISTORY_STORE_NAME = "HistoryStore";
const DB_VERSION = 2;

export class MySecretMemoDB extends Dexie {
  MemoStore!: Table<any, string>;
  HistoryStore!: Table<any, string>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      [STORE_NAME]: '',
      [HISTORY_STORE_NAME]: ''
    });
  }
}

const db = new MySecretMemoDB();

export class IndexedDBLibrary {
  async setItem<T>(key: string, value: T): Promise<void> {
    await db.table(STORE_NAME).put(value, key);
  }

  async getItem<T>(key: string): Promise<T | null> {
    const record = await db.table(STORE_NAME).get(key);
    return record !== undefined ? record : null;
  }

  async deleteItem(key: string): Promise<void> {
    await db.table(STORE_NAME).delete(key);
  }

  // ── History methods ──
  async setHistoryItem<T>(dateKey: string, value: T): Promise<void> {
    await db.table(HISTORY_STORE_NAME).put(value, dateKey);
  }

  async getHistoryItem<T>(dateKey: string): Promise<T | null> {
    const record = await db.table(HISTORY_STORE_NAME).get(dateKey);
    return record !== undefined ? record : null;
  }

  async deleteHistoryItem(dateKey: string): Promise<void> {
    await db.table(HISTORY_STORE_NAME).delete(dateKey);
  }

  async getAllHistoryKeys(): Promise<string[]> {
    const keys = await db.table(HISTORY_STORE_NAME).toCollection().primaryKeys();
    return keys.map(k => String(k)).sort();
  }

  async clearHistory(): Promise<void> {
    await db.table(HISTORY_STORE_NAME).clear();
  }

  // Observable for sync across tabs
  observeItem<T>(key: string) {
    return liveQuery(() => this.getItem<T>(key));
  }
}

export const memoDB = new IndexedDBLibrary();
