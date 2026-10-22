import { describe, expect, it } from 'vitest';
import { aislesFor } from '@/shared/hall/aisles';
import { parseTicketCode, ticketCode } from '@/api/ticketCode';
import { pluralSeats, seatAriaLabel, seatsSummary } from './seatText';

describe('seatsSummary', () => {
  it('стискає сусідні місця в діапазони', () => {
    expect(
      seatsSummary([
        { row: 7, number: 8 },
        { row: 7, number: 9 },
      ]),
    ).toBe('Ряд 7, місця 8–9');
    expect(seatsSummary([{ row: 7, number: 8 }])).toBe('Ряд 7, місце 8');
    expect(
      seatsSummary([
        { row: 8, number: 3 },
        { row: 7, number: 1 },
        { row: 7, number: 2 },
        { row: 7, number: 5 },
      ]),
    ).toBe('Ряд 7, місця 1–2, 5 · Ряд 8, місце 3');
  });
});

describe('pluralSeats', () => {
  it.each([
    [1, '1 місце'],
    [2, '2 місця'],
    [5, '5 місць'],
    [11, '11 місць'],
    [22, '22 місця'],
  ])('%i → %s', (n, s) => expect(pluralSeats(n)).toBe(s));
});

describe('seatAriaLabel', () => {
  it('озвучує ряд, місце, тип і ціну', () => {
    const seat = {
      id: 'x',
      section: 'Зал 1',
      row: 6,
      number: 8,
      zone: 'STANDARD',
      price: 180,
      status: 'FREE',
    } as const;
    expect(seatAriaLabel(seat, false)).toBe('Ряд 6, місце 8, Стандарт, 180 гривень');
    expect(seatAriaLabel({ ...seat, status: 'SOLD' }, false)).toBe('Ряд 6, місце 8, Стандарт, 180 гривень, зайняте');
  });
});

describe('aislesFor', () => {
  it('для 14 місць — проходи після 4-го і 10-го', () => expect(aislesFor(14)).toEqual([4, 10]));
  it('бічні блоки парні, щоб Love Seat не перетинав прохід', () => {
    for (const w of [10, 12, 16, 18, 20, 24]) expect(aislesFor(w).every((a) => a % 2 === 0)).toBe(true);
  });
  it('у маленькому залі проходів немає', () => expect(aislesFor(8)).toEqual([]));
});

describe('ticketCode', () => {
  it('кодує й розбирає замовлення, ряд і місце', () => {
    const code = ticketCode('a495de98', 3, 14);
    expect(code).toBe('TH-A495DE98-314');
    expect(parseTicketCode(code)).toEqual({ orderId: 'a495de98', row: 3, number: 14 });
    expect(parseTicketCode(' th-a495de98-1002 ')).toEqual({ orderId: 'a495de98', row: 10, number: 2 });
    expect(parseTicketCode('garbage')).toBeNull();
  });
});
