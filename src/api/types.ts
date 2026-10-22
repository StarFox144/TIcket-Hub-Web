// Типи TicketHub API. Після підключення бекенду їх можна замінити
// згенерованими з Swagger (openapi-typescript → schema.d.ts).

export type Format = '2D' | '3D' | 'IMAX';
export type SeatZone = 'STANDARD' | 'COMFORT' | 'LOVE';
export type SeatStatus = 'FREE' | 'RESERVED' | 'SOLD';
export type OrderStatus = 'RESERVED' | 'PAID' | 'EXPIRED' | 'REFUNDED';

/** Розширення API, яке пропонує специфікація: Event → Movie. */
export interface Movie {
  slug: string;
  title: string;
  genres: string[];
  ageRating: string;
  durationMin: number;
  description: string;
  /** Два відтінки для градієнтного постера-плейсхолдера. */
  palette: [string, string];
  rating?: number;
}

export interface Hall {
  id: string;
  name: string;
  format: Format;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  address: string;
}

/** Сеанс. title = назва фільму, startsAt = час сеансу. */
export interface CinemaEvent {
  id: string;
  title: string;
  startsAt: string;
  venue: Venue;
  section: Hall;
  movie: Movie;
  minPrice: number;
  /** Чернетки бачить лише організатор. */
  status?: 'DRAFT' | 'PUBLISHED';
}

export interface EventSeat {
  id: string;
  section: string;
  row: number;
  number: number;
  zone: SeatZone;
  price: number;
  status: SeatStatus;
}

export interface OrderSeat {
  id: string;
  row: number;
  number: number;
  zone: SeatZone;
  price: number;
}

export interface Order {
  id: string;
  eventId: string;
  event: CinemaEvent;
  seats: OrderSeat[];
  total: number;
  status: OrderStatus;
  email?: string;
  createdAt: string;
  expiresAt: string;
}

export interface CreateOrderRequest {
  eventId: string;
  seatIds: string[];
}

export interface PayOrderResponse {
  /** Адреса фейкового платіжного провайдера, який повертає на /checkout/:id/result. */
  redirectUrl: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ORGANIZER' | 'ADMIN';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
}

/** Тіло помилки 409 при POST /orders. */
export interface SeatConflict {
  message: string;
  unavailableSeatIds: string[];
}

// --- адмінка -----------------------------------------------------------------

export type EventStatus = 'DRAFT' | 'PUBLISHED';

export interface AdminEvent extends CinemaEvent {
  status: EventStatus;
  sold: number;
  capacity: number;
}

export interface EventInput {
  movieSlug: string;
  venueId: string;
  sectionId: string;
  startsAt: string;
  status: EventStatus;
}

export interface ZoneSales {
  zone: SeatZone;
  capacity: number;
  sold: number;
  reserved: number;
  revenue: number;
}

export interface EventSales {
  eventId: string;
  capacity: number;
  sold: number;
  reserved: number;
  free: number;
  revenue: number;
  byZone: ZoneSales[];
}

export type ScanReason = 'NOT_FOUND' | 'NOT_PAID' | 'ALREADY_USED' | 'WRONG_DAY';

export interface ScanResult {
  valid: boolean;
  reason?: ScanReason;
  message: string;
  usedAt?: string;
  ticket?: {
    code: string;
    title: string;
    startsAt: string;
    hall: string;
    venue: string;
    row: number;
    number: number;
    zone: SeatZone;
  };
}

/** Схема залу для генератора: з неї бекенд будує місця сеансу. */
export interface HallLayout {
  rows: number;
  seatsPerRow: number;
  /** Ряди «Комфорт», включно: [від, до]. null — без зони. */
  comfortRows: [number, number] | null;
  /** Місця «Комфорт» у ряду, включно: [від, до]. */
  comfortSeats: [number, number];
  /** Останній ряд — дивани Love Seat. */
  loveRow: boolean;
}

export interface Section extends Hall {
  venueId: string;
  layout: HallLayout;
}
