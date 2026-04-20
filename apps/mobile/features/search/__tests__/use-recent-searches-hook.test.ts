/**
 * Hook-level tests for {@code useRecentSearches} — pair with the pure-helper tests in
 * {@code use-recent-searches.test.ts}. Covers the React-lifecycle behaviour: read-on-mount,
 * per-user re-read when the user changes, logout-triggered clear.
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

import { act, renderHook } from '@testing-library/react-native';
import { mmkvStorage } from '@/shared/api/mmkv-storage';
import { authEvents } from '@/shared/api/auth-events';
import { useAuthStore } from '@/features/auth/store';
import { useRecentSearches } from '@/features/search/hooks/use-recent-searches';

const storage = mmkvStorage as unknown as MMKVMock;

function setUser(id: string | undefined) {
  if (!id) {
    useAuthStore.setState({ session: null, status: 'anonymous' });
    return;
  }
  useAuthStore.setState({
    session: {
      user: {
        id,
        email: `${id}@example.com`,
        displayName: id,
        authProvider: 'LOCAL',
        emailVerified: true,
      },
      accessToken: 'tok',
    },
    status: 'authenticated',
  });
}

describe('useRecentSearches (hook lifecycle)', () => {
  beforeEach(() => {
    Object.keys(storage._store).forEach((k) => delete storage._store[k]);
    storage.getString.mockClear();
    storage.set.mockClear();
    storage.remove.mockClear();
    setUser('u1');
  });

  it('reads the bucket on mount and exposes add() that hoists the newest entry', () => {
    storage._store['search.recent.u1'] = JSON.stringify(['phở']);
    const { result } = renderHook(() => useRecentSearches());

    expect(result.current.entries).toEqual(['phở']);

    act(() => result.current.add('bún chả'));
    expect(result.current.entries).toEqual(['bún chả', 'phở']);
  });

  it('swaps to a different bucket when the signed-in user changes', () => {
    storage._store['search.recent.u1'] = JSON.stringify(['alpha']);
    storage._store['search.recent.u2'] = JSON.stringify(['beta']);

    const { result: r1 } = renderHook(() => useRecentSearches());
    expect(r1.current.entries).toEqual(['alpha']);

    act(() => setUser('u2'));
    const { result: r2 } = renderHook(() => useRecentSearches());
    expect(r2.current.entries).toEqual(['beta']);
  });

  it('empties entries when auth:logout fires', () => {
    storage._store['search.recent.u1'] = JSON.stringify(['a', 'b']);
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.entries).toEqual(['a', 'b']);

    act(() => authEvents.emit('auth:logout'));
    expect(result.current.entries).toEqual([]);
    expect(storage.remove).toHaveBeenCalledWith('search.recent.u1');
  });

  it('remove() drops a single entry and persists the new list', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.add('a'));
    act(() => result.current.add('b'));
    act(() => result.current.remove('a'));
    expect(result.current.entries).toEqual(['b']);
    expect(storage.set).toHaveBeenLastCalledWith('search.recent.u1', JSON.stringify(['b']));
  });

  it('clear() wipes both in-memory state and MMKV', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.add('x'));
    act(() => result.current.clear());
    expect(result.current.entries).toEqual([]);
    expect(storage.remove).toHaveBeenCalledWith('search.recent.u1');
  });
});
