import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { EventSeat } from '@/api/types';
import { MAX_SEATS, useCartStore } from './cart';

const seat = (row: number, number: number, extra: Partial<EventSeat> = {}): EventSeat => ({
  id: `ev:${row}-${number}`,
  section: 'Зал 1',
  row,
  number,
  zone: 'STANDARD',
  price: 180,
  status: 'FREE',
  ...extra,
});

describe('cart store', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('додає й знімає місце повторним кліком, рахує суму', () => {
    const cart = useCartStore();
    cart.forEvent('ev');
    expect(cart.toggle(seat(7, 8))).toBe('added');
    expect(cart.toggle(seat(7, 9, { zone: 'COMFORT', price: 240 }))).toBe('added');
    expect(cart.total).toBe(420);
    expect(cart.toggle(seat(7, 8))).toBe('removed');
    expect(cart.seats.map((s) => s.number)).toEqual([9]);
  });

  it(`не дає обрати більше ${MAX_SEATS} місць`, () => {
    const cart = useCartStore();
    cart.forEvent('ev');
    for (let n = 1; n <= MAX_SEATS; n++) expect(cart.toggle(seat(1, n))).toBe('added');
    expect(cart.toggle(seat(2, 1))).toBe('limit');
    expect(cart.count).toBe(MAX_SEATS);
  });

  it('Love Seat рахується як два місця', () => {
    const cart = useCartStore();
    cart.forEvent('ev');
    for (let n = 1; n <= 7; n++) cart.toggle(seat(1, n));
    expect(cart.toggle(seat(10, 1, { zone: 'LOVE', price: 420 }))).toBe('limit');
    cart.remove('ev:1-7');
    expect(cart.toggle(seat(10, 1, { zone: 'LOVE', price: 420 }))).toBe('added');
    expect(cart.count).toBe(8);
  });

  it('тримає один Idempotency-Key, доки склад кошика не зміниться', () => {
    const cart = useCartStore();
    cart.forEvent('ev');
    cart.toggle(seat(5, 5));
    const first = cart.ensureKey();
    expect(cart.ensureKey()).toBe(first); // подвійний клік — той самий ключ

    cart.toggle(seat(5, 6));
    const second = cart.ensureKey();
    expect(second).not.toBe(first);
  });

  it('очищує вибір при переході на інший сеанс', () => {
    const cart = useCartStore();
    cart.forEvent('ev');
    cart.toggle(seat(1, 1));
    cart.forEvent('ev');
    expect(cart.seats).toHaveLength(1);
    cart.forEvent('other');
    expect(cart.seats).toHaveLength(0);
  });

  it('reconcile знімає місця, які встиг зайняти хтось інший', () => {
    const cart = useCartStore();
    cart.forEvent('ev');
    cart.toggle(seat(7, 8));
    cart.toggle(seat(7, 9));
    const key = cart.ensureKey();

    const lost = cart.reconcile([seat(7, 8, { status: 'SOLD' }), seat(7, 9)]);
    expect(lost.map((s) => s.number)).toEqual([8]);
    expect(cart.seats.map((s) => s.number)).toEqual([9]);
    expect(cart.ensureKey()).not.toBe(key);
  });
});
