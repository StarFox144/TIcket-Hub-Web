import { api } from './client';
import type { AdminEvent, CinemaEvent, EventInput, EventSales, EventSeat, Movie } from './types';

export interface SessionsQuery {
  from?: string;
  to?: string;
  q?: string;
  city?: string;
}

export async function fetchSessions(params: SessionsQuery = {}) {
  const { data } = await api.get<CinemaEvent[]>('/events', { params });
  return data;
}

export async function fetchSession(id: string) {
  const { data } = await api.get<CinemaEvent>(`/events/${id}`);
  return data;
}

export async function fetchSeatMap(id: string) {
  const { data } = await api.get<EventSeat[]>(`/events/${id}/seats`);
  return data;
}

// --- організатор ----------------------------------------------------------------

export async function fetchAdminSessions(params: { from: string; to: string; venueId?: string }) {
  const { data } = await api.get<AdminEvent[]>('/events', { params: { ...params, status: 'all' } });
  return data;
}

export async function createSession(body: EventInput) {
  const { data } = await api.post<AdminEvent>('/events', body);
  return data;
}

export async function updateSession(id: string, body: Partial<EventInput>) {
  const { data } = await api.patch<AdminEvent>(`/events/${id}`, body);
  return data;
}

export async function deleteSession(id: string) {
  await api.delete(`/events/${id}`);
}

export async function fetchSales(id: string) {
  const { data } = await api.get<EventSales>(`/events/${id}/sales`);
  return data;
}

/** Розширення API зі специфікації: каталог фільмів. */
export async function fetchMovies() {
  const { data } = await api.get<Movie[]>('/movies');
  return data;
}
