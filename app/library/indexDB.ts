/**
 * IndexedDB Wrapper for My Secret Memo
 */

const DB_NAME = "MySecretMemoDB";
const STORE_NAME = "MemoStore";
const HISTORY_STORE_NAME = "HistoryStore";
const DB_VERSION = 2;

export class IndexedDBLibrary {
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
        if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) {
          db.createObjectStore(HISTORY_STORE_NAME);
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve(this.db!);
      };

      request.onerror = (event: any) => {
        reject(event.target.error);
      };
    });
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getItem<T>(key: string): Promise<T | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteItem(key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ── History methods ──

  /** Save a history snapshot for a given date key (e.g. "2026-04-26") */
  async setHistoryItem<T>(dateKey: string, value: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(HISTORY_STORE_NAME, "readwrite");
      const store = transaction.objectStore(HISTORY_STORE_NAME);
      const request = store.put(value, dateKey);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /** Get a history snapshot for a given date key */
  async getHistoryItem<T>(dateKey: string): Promise<T | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(HISTORY_STORE_NAME, "readonly");
      const store = transaction.objectStore(HISTORY_STORE_NAME);
      const request = store.get(dateKey);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /** Delete a history snapshot for a given date key */
  async deleteHistoryItem(dateKey: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(HISTORY_STORE_NAME, "readwrite");
      const store = transaction.objectStore(HISTORY_STORE_NAME);
      const request = store.delete(dateKey);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /** Get all history date keys, sorted ascending */
  async getAllHistoryKeys(): Promise<string[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(HISTORY_STORE_NAME, "readonly");
      const store = transaction.objectStore(HISTORY_STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const keys = (request.result as string[]).sort();
        resolve(keys);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /** Clear all history items */
  async clearHistory(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(HISTORY_STORE_NAME, "readwrite");
      const store = transaction.objectStore(HISTORY_STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const memoDB = new IndexedDBLibrary();
