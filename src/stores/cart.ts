import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import type { EventSeat } from '@/api/types';

export const MAX_SEATS = 8;
const STORAGE_KEY = 'tickethub:cart';

interface Persisted {
  eventId: string | null;
  seats: EventSeat[];
  idempotencyKey: string | null;
}

function read(): Persisted {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Persisted;
  } catch {
    /* ігноруємо */
  }
  return { eventId: null, seats: [], idempotencyKey: null };
}

/** Love Seat — диван на двох, тож рахується як два місця. */
const weight = (seat: EventSeat) => (seat.zone === 'LOVE' ? 2 : 1);

export const useCartStore = defineStore('cart', () => {
  const initial = read();
  const eventId = ref<string | null>(initial.eventId);
  const seats = ref<EventSeat[]>(initial.seats);
  const idempotencyKey = ref<string | null>(initial.idempotencyKey);

  // Вибір переживає випадкове оновлення сторінки.
  watch(
    [eventId, seats, idempotencyKey],
    () => {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ eventId: eventId.value, seats: seats.value, idempotencyKey: idempotencyKey.value }),
        );
      } catch {
        /* ігноруємо */
      }
    },
    { deep: true },
  );

  const count = computed(() => seats.value.reduce((n, s) => n + weight(s), 0));
  const total = computed(() => seats.value.reduce((sum, s) => sum + s.price, 0));
  const selectedIds = computed(() => new Set(seats.value.map((s) => s.id)));

  /** Будь-яка зміна складу кошика — це вже інше замовлення з новим ключем. */
  function changed() {
    idempotencyKey.value = null;
  }

  function forEvent(id: string) {
    if (eventId.value !== id) {
      eventId.value = id;
      seats.value = [];
      changed();
    }
  }

  function toggle(seat: EventSeat): 'added' | 'removed' | 'limit' {
    if (selectedIds.value.has(seat.id)) {
      remove(seat.id);
      return 'removed';
    }
    if (count.value + weight(seat) > MAX_SEATS) return 'limit';
    seats.value = [...seats.value, seat].sort((a, b) => a.row - b.row || a.number - b.number);
    changed();
    return 'added';
  }

  function remove(id: string) {
    seats.value = seats.value.filter((s) => s.id !== id);
    changed();
  }

  /** Звіряє вибір зі свіжою картою; повертає місця, які встигли зайняти інші. */
  function reconcile(fresh: EventSeat[]) {
    const byId = new Map(fresh.map((s) => [s.id, s]));
    const lost = seats.value.filter((s) => byId.get(s.id)?.status !== 'FREE');
    if (lost.length) {
      const lostIds = new Set(lost.map((s) => s.id));
      seats.value = seats.value.filter((s) => !lostIds.has(s.id));
      changed();
    }
    return lost;
  }

  function removeMany(ids: string[]) {
    const set = new Set(ids);
    const lost = seats.value.filter((s) => set.has(s.id));
    seats.value = seats.value.filter((s) => !set.has(s.id));
    changed();
    return lost;
  }

  /** Ключ створюється при першому «Забронювати» і живе, доки склад не зміниться. */
  function ensureKey() {
    idempotencyKey.value ??= crypto.randomUUID();
    return idempotencyKey.value;
  }

  function clear() {
    seats.value = [];
    changed();
  }

  return {
    eventId,
    seats,
    count,
    total,
    selectedIds,
    forEvent,
    toggle,
    remove,
    removeMany,
    reconcile,
    ensureKey,
    clear,
  };
});
