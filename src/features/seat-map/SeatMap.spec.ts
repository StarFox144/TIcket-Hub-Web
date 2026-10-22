import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import type { EventSeat } from '@/api/types';
import SeatMap from './SeatMap.vue';

/** Маленький зал: 2 ряди по 4 місця + ряд із двома Love Seat. */
function hall(): EventSeat[] {
  const seats: EventSeat[] = [];
  for (const row of [1, 2]) {
    for (let number = 1; number <= 4; number++) {
      seats.push({
        id: `${row}-${number}`,
        section: 'Зал 1',
        row,
        number,
        zone: 'STANDARD',
        price: 180,
        status: 'FREE',
      });
    }
  }
  seats[1].status = 'SOLD'; // ряд 1, місце 2
  seats.push(
    { id: '3-1', section: 'Зал 1', row: 3, number: 1, zone: 'LOVE', price: 420, status: 'FREE' },
    { id: '3-2', section: 'Зал 1', row: 3, number: 2, zone: 'LOVE', price: 420, status: 'FREE' },
  );
  return seats;
}

function render(selected: string[] = []) {
  return mount(SeatMap, {
    props: { seats: hall(), selectedIds: new Set(selected), flashIds: new Set<string>() },
    attachTo: document.body,
  });
}

const seatButton = (w: ReturnType<typeof render>, id: string) => w.get(`[data-seat-id="${id}"]`);

describe('SeatMap', () => {
  it('кожне місце — кнопка з доступною назвою і станом', () => {
    const w = render(['1-1']);
    const first = seatButton(w, '1-1');
    expect(first.element.tagName).toBe('BUTTON');
    expect(first.attributes('aria-label')).toBe('Ряд 1, місце 1, Стандарт, 180 гривень');
    expect(first.attributes('aria-pressed')).toBe('true');
    expect(first.text()).toBe('1'); // номер усередині вибраного місця
    expect(seatButton(w, '1-3').attributes('aria-pressed')).toBe('false');
    w.unmount();
  });

  it('клік по вільному місцю повідомляє про вибір', async () => {
    const w = render();
    await seatButton(w, '1-3').trigger('click');
    expect(w.emitted('toggle')?.[0]?.[0]).toMatchObject({ id: '1-3' });
    w.unmount();
  });

  it('зайняте місце не вибирається', async () => {
    const w = render();
    const taken = seatButton(w, '1-2');
    expect(taken.attributes('aria-disabled')).toBe('true');
    expect(taken.attributes('aria-label')).toContain('зайняте');
    await taken.trigger('click');
    expect(w.emitted('toggle')).toBeUndefined();
    w.unmount();
  });

  it('Love Seat має подвійну ширину', () => {
    const w = render();
    const cell = seatButton(w, '3-2').element.parentElement as HTMLElement;
    expect(cell.style.gridColumn).toMatch(/span 2/);
    w.unmount();
  });

  it('roving tabindex: у Tab-порядку лише одне місце', () => {
    const w = render();
    const focusable = w.findAll('button.seat').filter((b) => b.attributes('tabindex') === '0');
    expect(focusable).toHaveLength(1);
    w.unmount();
  });

  it('стрілки переміщують фокус між місцями й рядами', async () => {
    const w = render();
    const start = seatButton(w, '1-1');
    (start.element as HTMLElement).focus();

    await start.trigger('keydown', { key: 'ArrowRight' });
    await new Promise((r) => setTimeout(r));
    expect(document.activeElement?.getAttribute('data-seat-id')).toBe('1-2');

    await seatButton(w, '1-2').trigger('keydown', { key: 'ArrowDown' });
    await new Promise((r) => setTimeout(r));
    expect(document.activeElement?.getAttribute('data-seat-id')).toBe('2-2');

    await seatButton(w, '2-2').trigger('keydown', { key: 'End' });
    await new Promise((r) => setTimeout(r));
    expect(document.activeElement?.getAttribute('data-seat-id')).toBe('2-4');

    // з місця 4 вниз — на Love Seat, що його накриває (позиції 3–4)
    await seatButton(w, '2-4').trigger('keydown', { key: 'ArrowDown' });
    await new Promise((r) => setTimeout(r));
    expect(document.activeElement?.getAttribute('data-seat-id')).toBe('3-2');
    w.unmount();
  });
});
