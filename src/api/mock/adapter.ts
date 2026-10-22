// Axios-адаптер, що відповідає замість бекенду. Поведінка повторює контракт
// TicketHub API: Idempotency-Key, 409 з unavailableSeatIds, 401 + refresh,
// резерв на 10 хвилин, webhook оплати, що «доходить» із запізненням,
// CRUD сеансів, статистика продажів і сканування квитків для організатора.
import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type {
  AdminEvent,
  AuthResponse,
  CinemaEvent,
  CreateOrderRequest,
  EventInput,
  EventSales,
  EventSeat,
  HallLayout,
  Order,
  ScanResult,
  Section,
  SeatZone,
  User,
} from '../types';
import { parseTicketCode, ticketCode } from '../ticketCode';
import {
  buildSchedule,
  buildSeats,
  DEFAULT_LAYOUT,
  halls,
  movies,
  seededRandom,
  seatPrice,
  upcomingMovies,
  venues,
} from './data';

const RESERVE_MS = 10 * 60 * 1000;
const PAYMENT_DELAY_MS = 2500;
const ACCESS_TTL_MS = 5 * 60 * 1000;
const STORAGE_KEY = 'tickethub:mock-db';

interface StoredUser extends User {
  password: string;
}

type StoredOrder = Order & { userId: string; paidAt?: number };

interface Db {
  users: StoredUser[];
  orders: StoredOrder[];
  idempotency: Record<string, string>;
  /** Місця, змінені поверх згенерованої схеми: seatId → статус. */
  seatOverrides: Record<string, EventSeat['status']>;
  /** Сеанси, створені організатором. */
  customEvents: CinemaEvent[];
  /** Зміни згенерованого розкладу: перенесені, зняті з публікації, видалені. */
  eventPatches: Record<string, Partial<Pick<CinemaEvent, 'startsAt' | 'status'>> & { deleted?: boolean }>;
  /** Схеми залів: `${venueId}:${sectionId}` → layout. */
  layouts: Record<string, HallLayout>;
  /** Проскановані квитки: код → час проходу. */
  usedTickets: Record<string, string>;
}

const allMovies = [...movies, ...upcomingMovies];
const schedule = buildSchedule();
const db: Db = load();

function load(): Db {
  const empty: Db = {
    users: [],
    orders: [],
    idempotency: {},
    seatOverrides: {},
    customEvents: [],
    eventPatches: {},
    layouts: {},
    usedTickets: {},
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...empty, ...(JSON.parse(raw) as Partial<Db>) };
  } catch {
    /* сховище недоступне — працюємо в пам'яті */
  }
  return empty;
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* ігноруємо */
  }
}

// --- відповіді ---------------------------------------------------------------

class HttpError {
  constructor(
    public status: number,
    public body: unknown,
  ) {}
}

const fail = (status: number, message: string, extra: object = {}) => new HttpError(status, { message, ...extra });

function respond<T>(config: InternalAxiosRequestConfig, status: number, data: T): AxiosResponse<T> {
  return { data, status, statusText: String(status), headers: new AxiosHeaders(), config };
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const body = <T>(config: InternalAxiosRequestConfig) => JSON.parse((config.data as string) || '{}') as T;

// --- токени й ролі -------------------------------------------------------------

/** Демо-ролі за email: org@… — організатор, admin@… — адміністратор. */
function roleFor(email: string): User['role'] {
  const local = email.toLowerCase().split('@')[0];
  if (local === 'admin') return 'ADMIN';
  if (local === 'org' || local === 'organizer') return 'ORGANIZER';
  return 'USER';
}

function issueTokens(user: StoredUser): AuthResponse {
  const { password: _password, ...publicUser } = user;
  return {
    accessToken: `acc.${user.id}.${Date.now() + ACCESS_TTL_MS}`,
    refreshToken: `ref.${user.id}.${crypto.randomUUID()}`,
    user: publicUser,
  };
}

function currentUser(config: InternalAxiosRequestConfig): StoredUser {
  const header = String(config.headers?.Authorization ?? '');
  const [, kind, userId, exp] = header.match(/^Bearer (acc)\.([^.]+)\.(\d+)$/) ?? [];
  if (!kind) throw fail(401, 'Потрібна авторизація');
  if (Number(exp) < Date.now()) throw fail(401, 'Токен прострочено');
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw fail(401, 'Користувача не знайдено');
  return user;
}

function requireOrganizer(config: InternalAxiosRequestConfig) {
  const user = currentUser(config);
  if (user.role === 'USER') throw fail(403, 'Доступ лише для організаторів');
  return user;
}

function requireAdmin(config: InternalAxiosRequestConfig) {
  const user = currentUser(config);
  if (user.role !== 'ADMIN') throw fail(403, 'Доступ лише для адміністратора');
  return user;
}

// --- сеанси ------------------------------------------------------------------

function allEvents(): CinemaEvent[] {
  return [...schedule, ...db.customEvents]
    .filter((e) => !db.eventPatches[e.id]?.deleted)
    .map((e) => {
      const patch = db.eventPatches[e.id];
      return {
        ...e,
        startsAt: patch?.startsAt ?? e.startsAt,
        status: patch?.status ?? e.status ?? 'PUBLISHED',
      };
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

function findEvent(id: string) {
  return allEvents().find((e) => e.id === id);
}

function layoutFor(event: Pick<CinemaEvent, 'venue' | 'section'>) {
  return db.layouts[`${event.venue.id}:${event.section.id}`] ?? DEFAULT_LAYOUT;
}

function toAdmin(event: CinemaEvent): AdminEvent {
  const seats = seatsFor(event);
  const weight = (s: EventSeat) => (s.zone === 'LOVE' ? 2 : 1);
  return {
    ...event,
    status: event.status ?? 'PUBLISHED',
    capacity: seats.reduce((n, s) => n + weight(s), 0),
    sold: seats.filter((s) => s.status === 'SOLD').reduce((n, s) => n + weight(s), 0),
  };
}

function eventFromInput(input: EventInput, id: string): CinemaEvent {
  const movie = allMovies.find((m) => m.slug === input.movieSlug);
  const venue = venues.find((v) => v.id === input.venueId);
  const section = halls.find((h) => h.id === input.sectionId);
  if (!movie || !venue || !section) throw fail(400, 'Оберіть фільм, кінотеатр і зал');
  if (Number.isNaN(Date.parse(input.startsAt))) throw fail(400, 'Некоректний час сеансу');
  return {
    id,
    title: movie.title,
    startsAt: new Date(input.startsAt).toISOString(),
    venue,
    section,
    movie,
    minPrice: seatPrice('STANDARD', section.format),
    status: input.status,
  };
}

/** Сеанси в одному залі не можуть перетинатися (з урахуванням 20 хв на прибирання). */
function assertNoOverlap(event: CinemaEvent, ignoreId?: string) {
  const start = Date.parse(event.startsAt);
  const end = start + (event.movie.durationMin + 20) * 60_000;
  const clash = allEvents().find((e) => {
    if (e.id === ignoreId || e.venue.id !== event.venue.id || e.section.id !== event.section.id) return false;
    const s = Date.parse(e.startsAt);
    const f = s + (e.movie.durationMin + 20) * 60_000;
    return start < f && s < end;
  });
  if (clash) {
    const time = new Date(clash.startsAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    throw fail(409, `Зал зайнятий: о ${time} іде «${clash.title}»`);
  }
}

// --- місця й замовлення ------------------------------------------------------

const seatCache = new Map<string, EventSeat[]>();

function seatsFor(event: CinemaEvent): EventSeat[] {
  let seats = seatCache.get(event.id);
  if (!seats) {
    seats = buildSeats(event, layoutFor(event));
    seatCache.set(event.id, seats);
  }
  for (const seat of seats) {
    const override = db.seatOverrides[seat.id];
    if (override) seat.status = override;
  }
  return seats;
}

/** Імітує інших глядачів: час від часу хтось займає вільне місце. */
let competition = true;

function simulateCompetition(seats: EventSeat[], eventId: string) {
  if (!competition || eventId.startsWith('custom-')) return;
  const rand = seededRandom(`${eventId}:${Math.floor(Date.now() / 4000)}`);
  if (rand() > 0.25) return;
  const free = seats.filter((s) => s.status === 'FREE');
  if (free.length < 20) return;
  const seat = free[Math.floor(rand() * free.length)];
  seat.status = 'SOLD';
  db.seatOverrides[seat.id] = 'SOLD';
  save();
}

function refreshOrder(order: StoredOrder) {
  if (order.status === 'RESERVED' && order.paidAt && Date.now() >= order.paidAt) {
    order.status = 'PAID';
    for (const s of order.seats) db.seatOverrides[s.id] = 'SOLD';
  }
  if (order.status === 'RESERVED' && !order.paidAt && Date.parse(order.expiresAt) < Date.now()) {
    order.status = 'EXPIRED';
    for (const s of order.seats) delete db.seatOverrides[s.id];
  }
  return order;
}

function publicOrder(order: StoredOrder): Order {
  const { userId: _userId, paidAt: _paidAt, ...rest } = refreshOrder(order);
  return rest;
}

/** Нового користувача зустрічають квитками, щоб «Мої квитки» не були порожні. */
function seedDemoOrders(user: StoredUser) {
  const make = (event: CinemaEvent, row: number, numbers: number[]): StoredOrder => {
    const seats = numbers.map((number) => ({
      id: `${event.id}:${row}-${number}`,
      row,
      number,
      zone: 'STANDARD' as const,
      price: seatPrice('STANDARD', event.section.format),
    }));
    for (const s of seats) db.seatOverrides[s.id] = 'SOLD';
    return {
      id: `demo${crypto.randomUUID().slice(0, 6)}`,
      userId: user.id,
      eventId: event.id,
      event,
      seats,
      total: seats.reduce((sum, s) => sum + s.price, 0),
      status: 'PAID',
      email: user.email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
    };
  };

  const tomorrow = schedule.find(
    (e) => Date.parse(e.startsAt) > Date.now() + 20 * 3600_000 && e.section.format === 'IMAX',
  );
  const past = new Date();
  past.setDate(past.getDate() - 6);
  past.setHours(20, 10, 0, 0);
  const pastEvent: CinemaEvent = {
    id: 'kyiv-center.h1.past.2010',
    title: movies[5].title,
    startsAt: past.toISOString(),
    venue: venues[0],
    section: halls[0],
    movie: movies[5],
    minPrice: 180,
  };

  if (tomorrow) db.orders.push(make(tomorrow, 6, [7, 8]));
  db.orders.push(make(pastEvent, 4, [3]));
}

function createUser(email: string, password: string, name: string) {
  const user: StoredUser = { id: crypto.randomUUID().slice(0, 8), email, password, name, role: roleFor(email) };
  db.users.push(user);
  if (user.role === 'USER') seedDemoOrders(user);
  return user;
}

// --- продажі й сканування -------------------------------------------------------

function salesFor(event: CinemaEvent): EventSales {
  const seats = seatsFor(event);
  const zones = new Map<SeatZone, EventSales['byZone'][number]>();
  for (const s of seats) {
    const z = zones.get(s.zone) ?? { zone: s.zone, capacity: 0, sold: 0, reserved: 0, revenue: 0 };
    z.capacity += 1;
    if (s.status === 'SOLD') {
      z.sold += 1;
      z.revenue += s.price;
    }
    if (s.status === 'RESERVED') z.reserved += 1;
    zones.set(s.zone, z);
  }
  const byZone = [...zones.values()];
  const sum = (k: 'capacity' | 'sold' | 'reserved' | 'revenue') => byZone.reduce((n, z) => n + z[k], 0);
  return {
    eventId: event.id,
    capacity: sum('capacity'),
    sold: sum('sold'),
    reserved: sum('reserved'),
    free: sum('capacity') - sum('sold') - sum('reserved'),
    revenue: sum('revenue'),
    byZone,
  };
}

const SCAN_MESSAGES = {
  NOT_FOUND: 'Квиток не знайдено',
  NOT_PAID: 'Квиток не оплачено',
  ALREADY_USED: 'Квиток уже використано',
  WRONG_DAY: 'Квиток на інший сеанс',
} as const;

function scan(code: string): ScanResult {
  const parsed = parseTicketCode(code);
  const order = parsed && db.orders.find((o) => o.id === parsed.orderId);
  const seat = order?.seats.find((s) => s.row === parsed!.row && s.number === parsed!.number);
  if (!order || !seat) return { valid: false, reason: 'NOT_FOUND', message: SCAN_MESSAGES.NOT_FOUND };

  refreshOrder(order);
  const normalized = ticketCode(order.id, seat.row, seat.number);
  const ticket = {
    code: normalized,
    title: order.event.title,
    startsAt: order.event.startsAt,
    hall: order.event.section.name,
    venue: order.event.venue.name,
    row: seat.row,
    number: seat.number,
    zone: seat.zone,
  };
  if (order.status !== 'PAID') return { valid: false, reason: 'NOT_PAID', message: SCAN_MESSAGES.NOT_PAID, ticket };

  const usedAt = db.usedTickets[normalized];
  if (usedAt) return { valid: false, reason: 'ALREADY_USED', message: SCAN_MESSAGES.ALREADY_USED, usedAt, ticket };

  // Пускаємо за годину до початку і до кінця сеансу.
  const start = Date.parse(order.event.startsAt);
  const end = start + order.event.movie.durationMin * 60_000;
  if (Date.now() < start - 3600_000 || Date.now() > end) {
    return { valid: false, reason: 'WRONG_DAY', message: SCAN_MESSAGES.WRONG_DAY, ticket };
  }

  db.usedTickets[normalized] = new Date().toISOString();
  save();
  return { valid: true, message: 'Квиток дійсний', ticket };
}

// --- маршрути ----------------------------------------------------------------

type Handler = (config: InternalAxiosRequestConfig, params: string[]) => unknown;

const routes: [string, RegExp, Handler][] = [
  [
    'GET',
    /^\/events$/,
    (config) => {
      const { from, to, q, city, status, venueId } = (config.params ?? {}) as Record<string, string | undefined>;
      const admin = status === 'all';
      if (admin) requireOrganizer(config);
      const fromMs = from ? Date.parse(from) : Date.now();
      const toMs = to ? Date.parse(to) : Infinity;
      const query = q?.trim().toLowerCase();
      const list = allEvents().filter((e) => {
        if (!admin && e.status === 'DRAFT') return false;
        const t = Date.parse(e.startsAt);
        if (t < fromMs || t > toMs) return false;
        if (city && e.venue.city !== city) return false;
        if (venueId && e.venue.id !== venueId) return false;
        if (query && !e.title.toLowerCase().includes(query) && e.movie.slug !== query) return false;
        return true;
      });
      return admin ? list.map(toAdmin) : list;
    },
  ],
  [
    'POST',
    /^\/events$/,
    (config) => {
      requireOrganizer(config);
      const event = eventFromInput(body<EventInput>(config), `custom-${crypto.randomUUID().slice(0, 8)}`);
      assertNoOverlap(event);
      db.customEvents.push(event);
      save();
      return [201, toAdmin(event)];
    },
  ],
  ['GET', /^\/events\/([^/]+)$/, (_c, [id]) => findEvent(id) ?? fail(404, 'Сеанс не знайдено')],
  [
    'PATCH',
    /^\/events\/([^/]+)$/,
    (config, [id]) => {
      requireOrganizer(config);
      const current = findEvent(id);
      if (!current) throw fail(404, 'Сеанс не знайдено');
      const input = body<Partial<EventInput>>(config);
      const custom = db.customEvents.findIndex((e) => e.id === id);
      if (custom >= 0) {
        const next = eventFromInput(
          {
            movieSlug: input.movieSlug ?? current.movie.slug,
            venueId: input.venueId ?? current.venue.id,
            sectionId: input.sectionId ?? current.section.id,
            startsAt: input.startsAt ?? current.startsAt,
            status: input.status ?? current.status ?? 'DRAFT',
          },
          id,
        );
        assertNoOverlap(next, id);
        db.customEvents[custom] = next;
        seatCache.delete(id);
      } else {
        if (input.startsAt) assertNoOverlap({ ...current, startsAt: input.startsAt }, id);
        db.eventPatches[id] = {
          ...db.eventPatches[id],
          ...(input.startsAt && { startsAt: input.startsAt }),
          ...(input.status && { status: input.status }),
        };
      }
      save();
      return toAdmin(findEvent(id)!);
    },
  ],
  [
    'DELETE',
    /^\/events\/([^/]+)$/,
    (config, [id]) => {
      requireOrganizer(config);
      const event = findEvent(id);
      if (!event) throw fail(404, 'Сеанс не знайдено');
      if (seatsFor(event).some((s) => s.status !== 'FREE')) {
        throw fail(409, 'На сеанс уже є продані квитки — його можна лише зняти з публікації');
      }
      db.customEvents = db.customEvents.filter((e) => e.id !== id);
      db.eventPatches[id] = { ...db.eventPatches[id], deleted: true };
      save();
      return [204, null];
    },
  ],
  [
    'GET',
    /^\/events\/([^/]+)\/seats$/,
    (_c, [id]) => {
      const event = findEvent(id);
      if (!event) throw fail(404, 'Сеанс не знайдено');
      db.orders.forEach(refreshOrder);
      const seats = seatsFor(event);
      simulateCompetition(seats, id);
      return seats.map((s) => ({ ...s }));
    },
  ],
  [
    'GET',
    /^\/events\/([^/]+)\/sales$/,
    (config, [id]) => {
      requireOrganizer(config);
      const event = findEvent(id);
      if (!event) throw fail(404, 'Сеанс не знайдено');
      db.orders.forEach(refreshOrder);
      return salesFor(event);
    },
  ],
  ['GET', /^\/movies$/, () => allMovies],
  ['GET', /^\/venues$/, () => venues],
  [
    'GET',
    /^\/venues\/([^/]+)\/sections$/,
    (_c, [venueId]) => {
      const venue = venues.find((v) => v.id === venueId);
      if (!venue) throw fail(404, 'Кінотеатр не знайдено');
      return halls.map<Section>((h) => ({ ...h, venueId, layout: layoutFor({ venue, section: h }) }));
    },
  ],
  [
    'PUT',
    /^\/venues\/([^/]+)\/sections\/([^/]+)$/,
    (config, [venueId, sectionId]) => {
      requireAdmin(config);
      const venue = venues.find((v) => v.id === venueId);
      const hall = halls.find((h) => h.id === sectionId);
      if (!venue || !hall) throw fail(404, 'Зал не знайдено');
      const { layout } = body<{ layout: HallLayout }>(config);
      if (layout.rows < 3 || layout.rows > 30 || layout.seatsPerRow < 4 || layout.seatsPerRow > 40) {
        throw fail(400, 'Від 3 до 30 рядів і від 4 до 40 місць у ряду');
      }
      db.layouts[`${venueId}:${sectionId}`] = layout;
      // Схема діє для сеансів, які ще не продавались.
      for (const key of seatCache.keys()) {
        const event = findEvent(key);
        if (
          event?.venue.id === venueId &&
          event.section.id === sectionId &&
          !Object.keys(db.seatOverrides).some((s) => s.startsWith(key))
        ) {
          seatCache.delete(key);
        }
      }
      save();
      return { ...hall, venueId, layout };
    },
  ],
  [
    'POST',
    /^\/tickets\/scan$/,
    (config) => {
      requireOrganizer(config);
      return scan(body<{ code: string }>(config).code ?? '');
    },
  ],
  [
    'POST',
    /^\/orders$/,
    (config) => {
      const user = currentUser(config);
      const key = String(config.headers?.['Idempotency-Key'] ?? '');
      if (!key) throw fail(400, 'Потрібен заголовок Idempotency-Key');

      const existingId = db.idempotency[key];
      const existing = existingId && db.orders.find((o) => o.id === existingId);
      if (existing) return publicOrder(existing);

      const req = body<CreateOrderRequest>(config);
      const event = findEvent(req.eventId);
      if (!event || event.status === 'DRAFT') throw fail(404, 'Сеанс не знайдено');
      if (!req.seatIds.length || req.seatIds.length > 8) throw fail(400, 'Можна обрати від 1 до 8 місць');

      const seats = seatsFor(event);
      const picked = req.seatIds.map((id) => seats.find((s) => s.id === id));
      const unavailableSeatIds = req.seatIds.filter((_id, i) => picked[i]?.status !== 'FREE');
      if (unavailableSeatIds.length) {
        throw fail(409, 'Деякі місця вже зайняли', { unavailableSeatIds });
      }

      const orderSeats = picked.map((s) => {
        const seat = s!;
        seat.status = 'RESERVED';
        db.seatOverrides[seat.id] = 'RESERVED';
        return { id: seat.id, row: seat.row, number: seat.number, zone: seat.zone, price: seat.price };
      });
      const order: StoredOrder = {
        id: crypto.randomUUID().slice(0, 8),
        userId: user.id,
        eventId: event.id,
        event,
        seats: orderSeats,
        total: orderSeats.reduce((sum, s) => sum + s.price, 0),
        status: 'RESERVED',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + RESERVE_MS).toISOString(),
      };
      db.orders.push(order);
      db.idempotency[key] = order.id;
      save();
      return [201, publicOrder(order)];
    },
  ],
  [
    'GET',
    /^\/orders$/,
    (config) => {
      const user = currentUser(config);
      const list = db.orders.filter((o) => o.userId === user.id).map(publicOrder);
      save();
      return list.sort((a, b) => b.event.startsAt.localeCompare(a.event.startsAt));
    },
  ],
  [
    'GET',
    /^\/orders\/([^/]+)$/,
    (config, [id]) => {
      const user = currentUser(config);
      const order = db.orders.find((o) => o.id === id && o.userId === user.id);
      if (!order) throw fail(404, 'Замовлення не знайдено');
      const result = publicOrder(order);
      save();
      return result;
    },
  ],
  [
    'POST',
    /^\/orders\/([^/]+)\/pay$/,
    (config, [id]) => {
      const user = currentUser(config);
      const order = db.orders.find((o) => o.id === id && o.userId === user.id);
      if (!order) throw fail(404, 'Замовлення не знайдено');
      refreshOrder(order);
      if (order.status !== 'RESERVED') throw fail(409, 'Резерв уже неактивний');
      order.email = body<{ email?: string }>(config).email ?? user.email;
      order.paidAt = Date.now() + PAYMENT_DELAY_MS;
      save();
      return { redirectUrl: `/checkout/${order.id}/result` };
    },
  ],
  [
    'POST',
    /^\/auth\/login$/,
    (config) => {
      const { email, password } = body<{ email: string; password: string }>(config);
      let user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      // Демо-режим: невідомий email реєструється автоматично.
      if (!user) user = createUser(email, password, email.split('@')[0]);
      else if (user.password !== password) throw fail(401, 'Невірний email або пароль');
      save();
      return issueTokens(user);
    },
  ],
  [
    'POST',
    /^\/auth\/register$/,
    (config) => {
      const { email, password, name } = body<{ email: string; password: string; name: string }>(config);
      if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        throw fail(409, 'Користувач з таким email уже існує');
      }
      const user = createUser(email, password, name);
      save();
      return [201, issueTokens(user)];
    },
  ],
  [
    'POST',
    /^\/auth\/refresh$/,
    (config) => {
      const { refreshToken } = body<{ refreshToken: string }>(config);
      const userId = refreshToken?.split('.')[1];
      const user = db.users.find((u) => u.id === userId);
      if (!user) throw fail(401, 'Сесія завершилась');
      return issueTokens(user);
    },
  ],
];

export const mockAdapter: AxiosAdapter = async (config) => {
  await delay(mockLatency());
  const method = (config.method ?? 'get').toUpperCase();
  const url = (config.url ?? '').split('?')[0];

  for (const [m, pattern, handler] of routes) {
    if (m !== method) continue;
    const match = url.match(pattern);
    if (!match) continue;
    try {
      const result = handler(config, match.slice(1).map(decodeURIComponent));
      if (result instanceof HttpError) throw result;
      if (Array.isArray(result) && typeof result[0] === 'number' && result.length === 2) {
        return respond(config, result[0], result[1]);
      }
      return respond(config, 200, result);
    } catch (e) {
      if (!(e instanceof HttpError)) throw e;
      const response = respond(config, e.status, e.body);
      throw new AxiosError(`Request failed with status code ${e.status}`, String(e.status), config, null, response);
    }
  }

  const response = respond(config, 404, { message: `Mock: немає маршруту ${method} ${url}` });
  throw new AxiosError('Not found', '404', config, null, response);
};

function mockLatency() {
  return import.meta.env.MODE === 'test' ? 0 : 250 + Math.random() * 350;
}

/** Хуки для e2e-тестів: дозволяють відтворити гонку за місце (409) і вимкнути «конкурентів». */
if (typeof window !== 'undefined' && import.meta.env.VITE_USE_MOCKS !== 'false') {
  (window as unknown as { __tickethubMock: object }).__tickethubMock = {
    takeSeat(seatId: string) {
      db.seatOverrides[seatId] = 'SOLD';
      for (const seats of seatCache.values()) {
        const seat = seats.find((s) => s.id === seatId);
        if (seat) seat.status = 'SOLD';
      }
      save();
    },
    setCompetition(enabled: boolean) {
      competition = enabled;
    },
  };
}
