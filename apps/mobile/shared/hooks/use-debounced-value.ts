import { useEffect, useState } from 'react';

/**
 * Trailing-edge debounce on a rapidly changing value (e.g., search input).
 * Returns the most recent `value` that has held stable for `delayMs` milliseconds.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
