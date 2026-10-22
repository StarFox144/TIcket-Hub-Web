import type { CinemaEvent, Movie } from '@/api/types';
import { dayKey } from '@/shared/composables/useDateLabel';

export type FormatFilter = 'all' | '2D' | 'IMAX' | 'kids';

export const FORMAT_FILTERS: { value: FormatFilter; label: string }[] = [
  { value: 'all', label: 'Усі' },
  { value: '2D', label: '2D' },
  { value: 'IMAX', label: 'IMAX' },
  { value: 'kids', label: 'Для дітей' },
];

const KIDS_RATINGS = new Set(['0+', '6+']);

export function matchesFilter(event: CinemaEvent, filter: FormatFilter) {
  if (filter === 'all') return true;
  if (filter === 'kids') return KIDS_RATINGS.has(event.movie.ageRating);
  return event.section.format === filter;
}

export interface MovieGroup {
  movie: Movie;
  sessions: CinemaEvent[];
}

/** Поки в API немає сутності Movie, сеанси групуються за фільмом (title / slug). */
export function groupByMovie(events: CinemaEvent[]): MovieGroup[] {
  const map = new Map<string, MovieGroup>();
  for (const e of events) {
    const key = e.movie?.slug ?? e.title;
    const group = map.get(key) ?? { movie: e.movie, sessions: [] };
    group.sessions.push(e);
    map.set(key, group);
  }
  return [...map.values()];
}

export function sessionsOnDay(events: CinemaEvent[], day: string) {
  return events.filter((e) => dayKey(e.startsAt) === day);
}

/** Сеанси одного дня, згруповані за кінотеатром і залом. */
export function groupByHall(events: CinemaEvent[]) {
  const map = new Map<string, { title: string; format: string; sessions: CinemaEvent[] }>();
  for (const e of events) {
    const key = `${e.venue.id}:${e.section.id}`;
    const group = map.get(key) ?? {
      title: `${e.venue.name} · ${e.section.name}`,
      format: e.section.format,
      sessions: [],
    };
    group.sessions.push(e);
    map.set(key, group);
  }
  return [...map.values()];
}
