import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { useCountdown } from './useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-22T18:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  function setup(expiresAt: string | undefined) {
    const scope = effectScope();
    const target = ref(expiresAt);
    const result = scope.run(() => useCountdown(target))!;
    return { ...result, target, stop: () => scope.stop() };
  }

  it('рахує від expiresAt сервера і форматує мм:сс', () => {
    const { label, left, stop } = setup('2026-10-22T18:10:00Z');
    expect(label.value).toBe('10:00');
    expect(left.value).toBe(600_000);

    vi.advanceTimersByTime(61_000);
    expect(label.value).toBe('08:59');
    stop();
  });

  it('стає expired на нулі й не йде в мінус', () => {
    const { label, expired, left, stop } = setup('2026-10-22T18:00:05Z');
    expect(expired.value).toBe(false);

    vi.advanceTimersByTime(10_000);
    expect(left.value).toBe(0);
    expect(label.value).toBe('00:00');
    expect(expired.value).toBe(true);
    stop();
  });

  it('перезавантаження не подовжує резерв: важить лише серверний час', () => {
    vi.setSystemTime(new Date('2026-10-22T18:07:30Z'));
    const { label, stop } = setup('2026-10-22T18:10:00Z');
    expect(label.value).toBe('02:30');
    stop();
  });

  it('без expiresAt не вважається простроченим', async () => {
    const { expired, target, stop } = setup(undefined);
    expect(expired.value).toBe(false);
    target.value = '2026-10-22T17:00:00Z';
    await nextTick();
    expect(expired.value).toBe(true);
    stop();
  });
});
