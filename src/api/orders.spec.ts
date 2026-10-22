// Контрактні тести API-шару поверх мок-адаптера: те, на що покладається UI.
import { beforeAll, describe, expect, it } from 'vitest';
import axios from 'axios';
import * as authApi from './auth';
import { installAuthInterceptors } from './client';
import { fetchSeatMap, fetchSessions } from './events';
import { createOrder, fetchOrder } from './orders';
import type { CinemaEvent, SeatConflict } from './types';

let token: string | null = null;
let refreshCalls = 0;

beforeAll(async () => {
  const res = await authApi.login({ email: 'viewer@test.ua', password: 'secret123' });
  token = res.accessToken;
  installAuthInterceptors({
    getToken: () => token,
    refresh: async () => {
      refreshCalls++;
      token = (await authApi.refresh(res.refreshToken)).accessToken;
      return token;
    },
    onAuthFailed: () => {},
  });
});

async function freeSeats(n: number) {
  const events = await fetchSessions({});
  const event = events.find((e: CinemaEvent) => !e.id.includes('-zolota')) ?? events[0];
  const seats = (await fetchSeatMap(event.id)).filter((s) => s.status === 'FREE' && s.zone === 'STANDARD');
  return { event, seats: seats.slice(0, n) };
}

describe('POST /orders', () => {
  it('той самий Idempotency-Key повертає те саме замовлення', async () => {
    const { event, seats } = await freeSeats(2);
    const body = { eventId: event.id, seatIds: seats.map((s) => s.id) };
    const first = await createOrder(body, 'key-1');
    const again = await createOrder(body, 'key-1');
    expect(again.id).toBe(first.id);
    expect(first.status).toBe('RESERVED');
    expect(Date.parse(first.expiresAt) - Date.now()).toBeGreaterThan(9 * 60_000);
  });

  it('409 зі списком unavailableSeatIds, якщо місце вже зайняте', async () => {
    const { event, seats } = await freeSeats(2);
    await createOrder({ eventId: event.id, seatIds: [seats[0].id] }, 'key-2');

    const error = await createOrder({ eventId: event.id, seatIds: seats.map((s) => s.id) }, 'key-3').catch((e) => e);
    expect(axios.isAxiosError(error)).toBe(true);
    expect(error.response.status).toBe(409);
    expect((error.response.data as SeatConflict).unavailableSeatIds).toEqual([seats[0].id]);
  });

  it('при простроченому токені оновлює його один раз і повторює запити', async () => {
    const { event, seats } = await freeSeats(1);
    const order = await createOrder({ eventId: event.id, seatIds: [seats[0].id] }, 'key-4');

    token = 'acc.unknown.0'; // прострочений access-токен
    const before = refreshCalls;
    const [a, b] = await Promise.all([fetchOrder(order.id), fetchOrder(order.id)]);
    expect(a.id).toBe(order.id);
    expect(b.id).toBe(order.id);
    expect(refreshCalls - before).toBe(1);
  });
});
