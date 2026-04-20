import { useCallback, useEffect, useState } from 'react';
import { mmkvStorage } from '@/shared/api/mmkv-storage';
import { authEvents } from '@/shared/api/auth-events';
import { useAuthStore } from '@/features/auth/store';

const MAX_ENTRIES = 10;
const KEY_PREFIX = 'search.recent.';
const ANON_SUFFIX = 'anon';

// Exposed for unit testing — keep in sync with MAX_ENTRIES.
export const RECENT_SEARCHES_MAX = MAX_ENTRIES;

export function keyFor(userId: string | undefined): string {
  return `${KEY_PREFIX}${userId ?? ANON_SUFFIX}`;
}

/**
 * Compute the new recent-search list after adding `query`. Pure — no IO.
 * Case-insensitive dedup, newest-first, capped at {@link MAX_ENTRIES}.
 */
export function dedupAndCap(existing: string[], query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return existing;
  const lower = trimmed.toLocaleLowerCase();
  const filtered = existing.filter((s) => s.toLocaleLowerCase() !== lower);
  return [trimmed, ...filtered].slice(0, MAX_ENTRIES);
}

/** Corruption-safe read — returns [] on any parse error and clears the bad key. */
export function readAll(key: string): string[] {
  const raw = mmkvStorage.getString(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch (err) {
    console.warn('[recent-searches] corruption detected, resetting', err);
    mmkvStorage.remove(key);
    return [];
  }
}

function writeAll(key: string, entries: string[]): void {
  mmkvStorage.set(key, JSON.stringify(entries));
}

/**
 * Per-user recent search history persisted in MMKV. Keyed by user id so switching
 * accounts on the same device doesn't leak the previous user's queries. Clears on
 * logout via the `auth:logout` event bus.
 */
export function useRecentSearches() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const key = keyFor(userId);
  const [entries, setEntries] = useState<string[]>(() => readAll(key));

  useEffect(() => {
    setEntries(readAll(key));
  }, [key]);

  useEffect(() => {
    return authEvents.on('auth:logout', () => {
      mmkvStorage.remove(key);
      setEntries([]);
    });
  }, [key]);

  const add = useCallback(
    (query: string) => {
      const next = dedupAndCap(readAll(key), query);
      writeAll(key, next);
      setEntries(next);
    },
    [key],
  );

  const remove = useCallback(
    (query: string) => {
      const current = readAll(key);
      const next = current.filter((s) => s !== query);
      writeAll(key, next);
      setEntries(next);
    },
    [key],
  );

  const clear = useCallback(() => {
    mmkvStorage.remove(key);
    setEntries([]);
  }, [key]);

  return { entries, add, remove, clear };
}
