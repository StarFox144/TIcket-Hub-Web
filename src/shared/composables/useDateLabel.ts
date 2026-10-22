const LOCALE = 'uk-UA';

const timeFmt = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' });
const weekdayFmt = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' });
const monthFmt = new Intl.DateTimeFormat(LOCALE, { month: 'short' });
const fullFmt = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
const shortFmt = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' });

export function startOfDay(date: Date | string | number) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** 0 — сьогодні, 1 — завтра, -1 — вчора. */
export function dayOffset(date: Date | string) {
  return Math.round((startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / 86_400_000);
}

/** ISO-ключ дня у локальній зоні: «2026-10-24». */
export function dayKey(date: Date | string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatTime(iso: string) {
  return timeFmt.format(new Date(iso));
}

export function relativeDay(date: Date | string) {
  const offset = dayOffset(date);
  if (offset === 0) return 'Сьогодні';
  if (offset === 1) return 'Завтра';
  return null;
}

/** Для стрічки дат: «пт», «24», «жовт.». */
export function dayChip(date: Date) {
  return {
    label: relativeDay(date) ?? weekdayFmt.format(date),
    day: date.getDate(),
    month: monthFmt.format(date),
    full: fullFmt.format(date),
  };
}

/** «Сьогодні, 19:40» або «пт, 24 жовт., 19:40». */
export function formatSession(iso: string) {
  return `${relativeDay(iso) ?? shortFmt.format(new Date(iso))}, ${formatTime(iso)}`;
}

/** «п’ятниця, 24 жовтня» */
export function formatLongDate(iso: string) {
  return fullFmt.format(new Date(iso));
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} год ${m ? `${m} хв` : ''}`.trim() : `${m} хв`;
}

export function useDateLabel() {
  return { formatTime, formatSession, formatLongDate, formatDuration, dayChip, relativeDay };
}
