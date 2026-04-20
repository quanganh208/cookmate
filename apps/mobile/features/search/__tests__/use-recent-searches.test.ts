/**
 * Tests for the pure helpers powering `useRecentSearches` (`dedupAndCap`, `readAll`, `keyFor`).
 * The hook itself is a thin state wrapper over these helpers — we skip rendering it to sidestep
 * a jest-expo / react-test-renderer version pin mismatch.
 */

type MMKVMock = {
  _store: Record<string, string>;
  getString: jest.Mock;
  set: jest.Mock;
  remove: jest.Mock;
};

jest.mock('@/shared/api/mmkv-storage', () => {
  const store: Record<string, string> = {};
  const mock: MMKVMock = {
    _store: store,
    getString: jest.fn((key: string) => store[key]),
    set: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    remove: jest.fn((key: string) => {
      delete store[key];
    }),
  };
  return { mmkvStorage: mock };
});

import { mmkvStorage } from '@/shared/api/mmkv-storage';
import {
  dedupAndCap,
  keyFor,
  readAll,
  RECENT_SEARCHES_MAX,
} from '@/features/search/hooks/use-recent-searches';

const storage = mmkvStorage as unknown as MMKVMock;

describe('dedupAndCap', () => {
  it('prepends new entry newest-first', () => {
    expect(dedupAndCap(['b', 'c'], 'a')).toEqual(['a', 'b', 'c']);
  });

  it('removes case-insensitive duplicate and hoists the new casing', () => {
    expect(dedupAndCap(['Pizza', 'Salad'], 'PIZZA')).toEqual(['PIZZA', 'Salad']);
  });

  it('caps at RECENT_SEARCHES_MAX', () => {
    const existing = Array.from({ length: RECENT_SEARCHES_MAX }, (_, i) => `q${i}`);
    const next = dedupAndCap(existing, 'new');
    expect(next).toHaveLength(RECENT_SEARCHES_MAX);
    expect(next[0]).toBe('new');
    expect(next).not.toContain(`q${RECENT_SEARCHES_MAX - 1}`);
  });

  it('ignores blank / whitespace-only input', () => {
    expect(dedupAndCap(['a'], '   ')).toEqual(['a']);
    expect(dedupAndCap(['a'], '')).toEqual(['a']);
  });

  it('trims the incoming query', () => {
    expect(dedupAndCap([], '  phở  ')).toEqual(['phở']);
  });
});

describe('keyFor', () => {
  it('uses a stable per-user namespace', () => {
    expect(keyFor('u1')).toBe('search.recent.u1');
    expect(keyFor('u2')).toBe('search.recent.u2');
  });

  it('falls back to an anon bucket when user id is undefined', () => {
    expect(keyFor(undefined)).toBe('search.recent.anon');
  });
});

describe('readAll', () => {
  beforeEach(() => {
    Object.keys(storage._store).forEach((k) => delete storage._store[k]);
    storage.getString.mockClear();
    storage.remove.mockClear();
  });

  it('returns [] when the key is absent', () => {
    expect(readAll('search.recent.u1')).toEqual([]);
  });

  it('parses a valid JSON array of strings', () => {
    storage._store['search.recent.u1'] = JSON.stringify(['a', 'b']);
    expect(readAll('search.recent.u1')).toEqual(['a', 'b']);
  });

  it('strips non-string elements defensively', () => {
    storage._store['search.recent.u1'] = JSON.stringify(['a', 42, null, 'b']);
    expect(readAll('search.recent.u1')).toEqual(['a', 'b']);
  });

  it('treats a corrupt payload as empty and removes the bad key', () => {
    storage._store['search.recent.u1'] = 'not-json';
    // Silence the expected warning for this negative-path assertion.
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(readAll('search.recent.u1')).toEqual([]);
    expect(storage.remove).toHaveBeenCalledWith('search.recent.u1');
    spy.mockRestore();
  });

  it('treats a JSON non-array value as empty without clearing', () => {
    storage._store['search.recent.u1'] = JSON.stringify({ not: 'an array' });
    expect(readAll('search.recent.u1')).toEqual([]);
  });
});
