/**
 * Timer-driven test for the trailing-edge debounce. Uses jest fake timers to drive the hook's
 * internal {@code setTimeout} so CI doesn't actually wait 300ms.
 */

import { act, renderHook } from '@testing-library/react-native';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the initial value synchronously', () => {
    const { result } = renderHook(() => useDebouncedValue('seed', 300));
    expect(result.current).toBe('seed');
  });

  it('returns the latest value only after the delay elapses', () => {
    const { result, rerender } = renderHook(
      (props: { value: string }) => useDebouncedValue(props.value, 300),
      {
        initialProps: { value: 'a' },
      },
    );
    rerender({ value: 'b' });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('b');
  });

  it('cancels the pending timeout when the value keeps changing', () => {
    const { result, rerender } = renderHook(
      (props: { value: string }) => useDebouncedValue(props.value, 300),
      {
        initialProps: { value: 'a' },
      },
    );
    rerender({ value: 'b' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender({ value: 'c' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('c');
  });
});
