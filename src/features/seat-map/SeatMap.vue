<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import type { EventSeat } from '@/api/types';
import { aislesFor } from '@/shared/hall/aisles';
import Icon from '@/shared/ui/Icon.vue';
import ScreenArc from './ScreenArc.vue';
import SeatCell from './SeatCell.vue';
import { seatTooltip } from './seatText';

const props = defineProps<{
  seats: EventSeat[];
  selectedIds: Set<string>;
  flashIds: Set<string>;
}>();
const emit = defineEmits<{ toggle: [EventSeat] }>();

const SEAT_W = 28;
const SEAT_H = 26;
const GAP = 6;
const AISLE = 22;
const LABEL = 26;

// --- геометрія: усе рахується з номера ряду й місця -----------------------

interface Cell {
  seat: EventSeat;
  /** Позиція в «одиничних» місцях, з 1. Love Seat займає дві. */
  pos: number;
  span: number;
}

const rows = computed(() => {
  const byRow = new Map<number, EventSeat[]>();
  for (const s of props.seats) byRow.set(s.row, [...(byRow.get(s.row) ?? []), s]);
  return [...byRow.entries()]
    .sort(([a], [b]) => a - b)
    .map(([row, seats]) => ({
      row,
      cells: seats
        .sort((a, b) => a.number - b.number)
        .map<Cell>((seat) =>
          seat.zone === 'LOVE' ? { seat, pos: seat.number * 2 - 1, span: 2 } : { seat, pos: seat.number, span: 1 },
        ),
    }));
});

const width = computed(() => Math.max(0, ...rows.value.flatMap((r) => r.cells.map((c) => c.pos + c.span - 1))));

/** Проходи рахуються з ширини залу: для 14 місць — після 4-го і 10-го. */
const aisles = computed(() => aislesFor(width.value));

/** Колонка CSS Grid для позиції: мітка ряду + місця + проходи. */
function column(pos: number) {
  return 1 + pos + aisles.value.filter((a) => pos > a).length;
}

const template = computed(() => {
  const cols = [`var(--label)`];
  for (let p = 1; p <= width.value; p++) {
    cols.push('var(--seat-w)');
    if (aisles.value.includes(p)) cols.push('var(--aisle)');
  }
  cols.push('var(--label)');
  return cols.join(' ');
});

// --- масштаб ----------------------------------------------------------------

const zoom = ref(1);
const scroller = ref<HTMLElement | null>(null);
const naturalWidth = computed(
  () => width.value * (SEAT_W + GAP) + aisles.value.length * (AISLE + GAP) + 2 * (LABEL + GAP) + 32,
);

const vars = computed(() => ({
  '--seat-w': `${SEAT_W * zoom.value}px`,
  '--seat-h': `${SEAT_H * zoom.value}px`,
  '--gap': `${GAP * zoom.value}px`,
  '--aisle': `${AISLE * zoom.value}px`,
  '--label': `${LABEL * zoom.value}px`,
}));

function setZoom(value: number) {
  zoom.value = Math.min(1.6, Math.max(0.6, Math.round(value * 100) / 100));
  nextTick(centerScroll);
}

function centerScroll() {
  const el = scroller.value;
  if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
}

/** За замовчуванням зал вписаний у ширину (але не дрібніше 0.7 — далі горизонтальний скрол). */
function fit() {
  const available = scroller.value?.clientWidth ?? naturalWidth.value;
  setZoom(Math.min(1.25, Math.max(0.7, available / naturalWidth.value)));
}

onMounted(fit);
watch(width, (w, old) => !old && w && nextTick(fit));

// --- тултіп -----------------------------------------------------------------

const stage = ref<HTMLElement | null>(null);
const tip = ref<{ text: string; x: number; y: number } | null>(null);

function showTip(seat: EventSeat, el: HTMLElement | null) {
  if (!el || !stage.value || (seat.status !== 'FREE' && !props.selectedIds.has(seat.id))) {
    tip.value = null;
    return;
  }
  const base = stage.value.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  // тултіп не виходить за видиму частину схеми, коли вона прокручена вбік
  const view = scroller.value?.getBoundingClientRect() ?? base;
  const HALF = 85;
  const min = Math.max(view.left, base.left) - base.left + HALF;
  const max = Math.min(view.right, base.right) - base.left - HALF;
  const x = Math.min(Math.max(r.left - base.left + r.width / 2, min), Math.max(min, max));
  tip.value = { text: seatTooltip(seat), x, y: r.top - base.top };
}

// --- клавіатура: roving tabindex, стрілки, Home/End ---------------------------

const activeId = ref<string | null>(null);
const focusableId = computed(() => {
  const all = rows.value.flatMap((r) => r.cells);
  if (activeId.value && all.some((c) => c.seat.id === activeId.value)) return activeId.value;
  return (all.find((c) => props.selectedIds.has(c.seat.id)) ?? all.find((c) => c.seat.status === 'FREE') ?? all[0])
    ?.seat.id;
});

function focusSeat(id: string) {
  activeId.value = id;
  nextTick(() =>
    [...(stage.value?.querySelectorAll<HTMLElement>('[data-seat-id]') ?? [])]
      .find((el) => el.dataset.seatId === id)
      ?.focus(),
  );
}

function onKeydown(e: KeyboardEvent) {
  const id = (e.target as HTMLElement).dataset.seatId;
  if (!id) return;
  const ri = rows.value.findIndex((r) => r.cells.some((c) => c.seat.id === id));
  const row = rows.value[ri];
  const ci = row.cells.findIndex((c) => c.seat.id === id);
  const cell = row.cells[ci];
  let target: Cell | undefined;

  switch (e.key) {
    case 'ArrowLeft':
      target = row.cells[ci - 1];
      break;
    case 'ArrowRight':
      target = row.cells[ci + 1];
      break;
    case 'Home':
      target = row.cells[0];
      break;
    case 'End':
      target = row.cells[row.cells.length - 1];
      break;
    case 'ArrowUp':
    case 'ArrowDown': {
      const next = rows.value[ri + (e.key === 'ArrowUp' ? -1 : 1)];
      if (next) {
        const center = cell.pos + (cell.span - 1) / 2;
        target = [...next.cells].sort(
          (a, b) => Math.abs(a.pos + (a.span - 1) / 2 - center) - Math.abs(b.pos + (b.span - 1) / 2 - center),
        )[0];
      }
      break;
    }
    default:
      return;
  }
  e.preventDefault();
  if (target) focusSeat(target.seat.id);
}

defineExpose({ fit });
</script>

<template>
  <div class="relative">
    <div
      class="absolute right-0 top-0 z-10 flex gap-1 rounded-pill bg-raised/90 p-1 ring-1 ring-inset ring-text/10 backdrop-blur"
    >
      <button type="button" class="zoom-btn" aria-label="Зменшити схему" @click="setZoom(zoom - 0.15)">
        <Icon name="minus" :size="16" />
      </button>
      <button type="button" class="zoom-btn w-auto px-2 text-xs font-bold" @click="fit">
        {{ Math.round(zoom * 100) }}%<span class="sr-only"> — вписати схему в екран</span>
      </button>
      <button type="button" class="zoom-btn" aria-label="Збільшити схему" @click="setZoom(zoom + 0.15)">
        <Icon name="plus" :size="16" />
      </button>
    </div>

    <div
      ref="scroller"
      class="overflow-x-auto overscroll-x-contain pb-2 pt-12 [scrollbar-color:rgb(var(--c-seat-free))_transparent]"
    >
      <div ref="stage" class="relative mx-auto w-max px-4" :style="vars">
        <ScreenArc class="mb-8" />

        <div role="group" aria-label="Схема залу. Стрілки — перехід між місцями, пробіл — вибір." @keydown="onKeydown">
          <div
            v-for="r in rows"
            :key="r.row"
            role="group"
            :aria-label="`Ряд ${r.row}`"
            class="grid items-center"
            :style="{
              gridTemplateColumns: template,
              columnGap: 'var(--gap)',
              marginBottom: 'calc(var(--gap) * 1.5)',
              marginTop: r.cells[0]?.seat.zone === 'LOVE' ? 'calc(var(--gap) * 2.5)' : undefined,
            }"
          >
            <span class="row-label" aria-hidden="true" style="grid-column: 1">{{ r.row }}</span>
            <div v-for="c in r.cells" :key="c.seat.id" :style="{ gridColumn: `${column(c.pos)} / span ${c.span}` }">
              <SeatCell
                :seat="c.seat"
                :selected="selectedIds.has(c.seat.id)"
                :flashing="flashIds.has(c.seat.id)"
                :focusable="c.seat.id === focusableId"
                @toggle="emit('toggle', c.seat)"
                @hover="showTip(c.seat, $event)"
                @focus="activeId = c.seat.id"
              />
            </div>
            <span class="row-label" aria-hidden="true" style="grid-column: -2">{{ r.row }}</span>
          </div>
        </div>

        <Transition name="tip">
          <div
            v-if="tip"
            class="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-sm bg-text px-2.5 py-1.5 text-xs font-bold text-bg shadow-card"
            :style="{ left: `${tip.x}px`, top: `${tip.y - 8}px` }"
            aria-hidden="true"
          >
            {{ tip.text }}
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.row-label {
  text-align: center;
  font-size: max(10px, calc(var(--seat-h) * 0.45));
  font-weight: 700;
  color: rgb(var(--c-text-muted));
  font-variant-numeric: tabular-nums;
}
.zoom-btn {
  display: grid;
  place-items: center;
  height: 32px;
  min-width: 32px;
  border-radius: 999px;
  color: rgb(var(--c-text));
  transition: background-color 200ms var(--ease-out);
}
.zoom-btn:hover {
  background: rgb(var(--c-text) / 0.08);
}
.tip-enter-active,
.tip-leave-active {
  transition: opacity 150ms var(--ease-out);
}
.tip-enter-from,
.tip-leave-to {
  opacity: 0;
}
</style>
