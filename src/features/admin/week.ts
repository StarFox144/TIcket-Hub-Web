import { addDays, dayKey, startOfDay } from '@/shared/composables/useDateLabel';

/** Понеділок тижня, в який потрапляє дата. */
export function startOfWeek(date: Date | string) {
  const d = startOfDay(date);
  const shift = (d.getDay() + 6) % 7;
  return addDays(d, -shift);
}

export function weekDays(monday: Date) {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

const rangeFmt = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short' });

export function weekLabel(monday: Date) {
  return `${rangeFmt.format(monday)} — ${rangeFmt.format(addDays(monday, 6))}`;
}

/** Значення для <input type="date"> і <input type="time"> у локальній зоні. */
export function toDateInput(date: Date | string) {
  return dayKey(date);
}

export function toTimeInput(date: Date | string) {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function fromInputs(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}
