import { createMMKV } from 'react-native-mmkv';

/** Global MMKV instance for app storage */
export const mmkvStorage = createMMKV({ id: 'cookmate-storage' });

/** Adapter for TanStack Query sync persister */
export const mmkvQueryStorage = {
  getItem: (key: string) => mmkvStorage.getString(key) ?? null,
  setItem: (key: string, value: string) => mmkvStorage.set(key, value),
  removeItem: (key: string) => mmkvStorage.remove(key),
};
