import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDuration, relativeDay, dayOffset } from './useDateLabel';
import { formatMoney, moneyForSpeech } from './useMoney';

describe('formatMoney', () => {
  it('групує розряди і додає ₴ через нерозривний пробіл', () => {
    expect(formatMoney(180)).toBe('180 ₴');
    expect(formatMoney(1240).replace(/\s/g, ' ')).toBe('1 240 ₴');
  });
});

describe('moneyForSpeech', () => {
  it.each([
    [1, '1 гривня'],
    [21, '21 гривня'],
    [2, '2 гривні'],
    [180, '180 гривень'],
    [244, '244 гривні'],
    [11, '11 гривень'],
    [112, '112 гривень'],
    [420, '420 гривень'],
  ])('%i → %s', (n, expected) => {
    expect(moneyForSpeech(n)).toBe(expected);
  });
});

describe('дати', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 22, 15, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('називає сьогодні й завтра словами', () => {
    expect(relativeDay(new Date(2026, 9, 22, 23, 50))).toBe('Сьогодні');
    expect(relativeDay(new Date(2026, 9, 23, 0, 10))).toBe('Завтра');
    expect(relativeDay(new Date(2026, 9, 24, 12, 0))).toBeNull();
    expect(dayOffset(new Date(2026, 9, 21, 9, 0))).toBe(-1);
  });

  it('форматує тривалість фільму', () => {
    expect(formatDuration(92)).toBe('1 год 32 хв');
    expect(formatDuration(120)).toBe('2 год');
    expect(formatDuration(45)).toBe('45 хв');
  });
});
