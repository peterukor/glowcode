/**
 * A tiny versioned key-value store. Today it sits on localStorage; an account-backed
 * service can replace it later behind the same read/write shape.
 *
 * Saved as: { "version": 1, "data": ... }
 * - Corrupted JSON or an unknown shape → the raw text is backed up under "<key>:backup"
 *   and an empty value is used, so a bad save never crashes the app.
 * - Older versions are passed to `parse` with their version number, which migrates them.
 * - Data from a newer app version is left untouched (backed up) rather than misread.
 */

export type KeyValueStorage = Pick<Storage, "getItem" | "setItem">;

export type VersionedStore<T> = {
  read(): T;
  write(value: T): void;
};

type Options<T> = {
  key: string;
  version: number;
  empty: () => T;
  /** Turn stored data (from `fromVersion`) into the current shape, or undefined if unusable. */
  parse: (data: unknown, fromVersion: number) => T | undefined;
  storage?: KeyValueStorage | undefined;
};

function defaultStorage(): KeyValueStorage | undefined {
  try {
    return typeof window !== "undefined" ? window.localStorage : undefined;
  } catch {
    return undefined; // e.g. storage disabled by browser settings
  }
}

export function createVersionedStore<T>({ key, version, empty, parse, storage = defaultStorage() }: Options<T>): VersionedStore<T> {
  const backup = (raw: string) => {
    try {
      storage?.setItem(`${key}:backup`, raw);
    } catch {
      /* best effort */
    }
  };

  return {
    read() {
      let raw: string | null = null;
      try {
        raw = storage?.getItem(key) ?? null;
      } catch {
        return empty();
      }
      if (raw === null) return empty();

      try {
        const saved = JSON.parse(raw) as { version?: unknown; data?: unknown };
        const savedVersion = typeof saved?.version === "number" ? saved.version : NaN;
        if (savedVersion > version || !(savedVersion >= 1)) {
          backup(raw);
          return empty();
        }
        const value = parse(saved.data, savedVersion);
        if (value === undefined) {
          backup(raw);
          return empty();
        }
        return value;
      } catch {
        backup(raw);
        return empty();
      }
    },

    write(value) {
      try {
        storage?.setItem(key, JSON.stringify({ version, data: value }));
      } catch {
        // Storage full or unavailable: progress lives in memory for this visit.
      }
    },
  };
}

/** A value kept in memory, saved on every change, and shared with anyone subscribed. */
export type SyncedState<T> = {
  get(): T;
  update(change: (current: T) => T): void;
  subscribe(listener: () => void): () => void;
  /** Re-read from storage (another tab changed it). */
  reload(): void;
};

export function createSyncedState<T>(store: VersionedStore<T>): SyncedState<T> {
  let value = store.read();
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    get: () => value,
    update(change) {
      const next = change(value);
      if (next === value) return;
      value = next;
      store.write(value);
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reload() {
      value = store.read();
      emit();
    },
  };
}

/** In-memory storage for tests. */
export function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { dump(): Record<string, string> } {
  const data = { ...initial };
  return {
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
    dump: () => ({ ...data }),
  };
}
