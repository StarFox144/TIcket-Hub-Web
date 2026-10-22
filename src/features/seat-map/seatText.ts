import type { EventSeat, SeatZone } from '@/api/types';
import { formatMoney, moneyForSpeech } from '@/shared/composables/useMoney';

export const ZONE_LABEL: Record<SeatZone, string> = {
  STANDARD: 'Стандарт',
  COMFORT: 'Комфорт',
  LOVE: 'Love Seat',
};

export function pluralSeats(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} місце`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} місця`;
  return `${n} місць`;
}

export function seatAriaLabel(seat: EventSeat, selected: boolean) {
  const parts = [`Ряд ${seat.row}, місце ${seat.number}`, ZONE_LABEL[seat.zone], moneyForSpeech(seat.price)];
  if (seat.status !== 'FREE' && !selected) parts.push('зайняте');
  return parts.join(', ');
}

export function seatTooltip(seat: EventSeat) {
  return `Ряд ${seat.row}, місце ${seat.number} · ${formatMoney(seat.price)}`;
}

/** «Ряд 7, місця 8–9 · Ряд 8, місце 3» */
export function seatsSummary(seats: Pick<EventSeat, 'row' | 'number'>[]) {
  const byRow = new Map<number, number[]>();
  for (const s of seats) byRow.set(s.row, [...(byRow.get(s.row) ?? []), s.number]);

  return [...byRow.entries()]
    .sort(([a], [b]) => a - b)
    .map(([row, numbers]) => {
      const sorted = [...numbers].sort((a, b) => a - b);
      const ranges: string[] = [];
      let start = sorted[0];
      let prev = sorted[0];
      for (const n of [...sorted.slice(1), NaN]) {
        if (n === prev + 1) {
          prev = n;
          continue;
        }
        ranges.push(start === prev ? `${start}` : `${start}–${prev}`);
        start = prev = n;
      }
      return `Ряд ${row}, ${sorted.length === 1 ? 'місце' : 'місця'} ${ranges.join(', ')}`;
    })
    .join(' · ');
}
