<script setup lang="ts">
import { computed } from 'vue';
import type { EventSeat } from '@/api/types';
import { aislesFor } from '@/shared/hall/aisles';

/** Компактна схема залу для адмінки: лише кольори статусів, без взаємодії. */
const props = defineProps<{ seats: Pick<EventSeat, 'id' | 'row' | 'number' | 'zone' | 'status'>[] }>();

const rows = computed(() => {
  const map = new Map<number, typeof props.seats>();
  for (const s of props.seats) map.set(s.row, [...(map.get(s.row) ?? []), s]);
  return [...map.entries()].sort(([a], [b]) => a - b);
});

const width = computed(() => Math.max(0, ...props.seats.map((s) => (s.zone === 'LOVE' ? s.number * 2 : s.number))));
const aisles = computed(() => aislesFor(width.value));

function column(pos: number) {
  return pos + aisles.value.filter((a) => pos > a).length;
}

const template = computed(() => {
  const cols: string[] = [];
  for (let p = 1; p <= width.value; p++) {
    cols.push('var(--cell)');
    if (aisles.value.includes(p)) cols.push('calc(var(--cell) * 0.8)');
  }
  return cols.join(' ');
});
</script>

<template>
  <div class="mini overflow-x-auto" role="img" :aria-label="`Схема залу: ${seats.length} місць`">
    <div class="mx-auto w-max">
      <div class="mx-auto mb-4 h-1 w-3/4 rounded-full bg-text/60 shadow-[0_0_12px_rgba(255,255,255,0.5)]" />
      <div
        v-for="[row, list] in rows"
        :key="row"
        class="mb-[3px] grid gap-[3px]"
        :style="{ gridTemplateColumns: template }"
      >
        <span
          v-for="s in list"
          :key="s.id"
          class="cell"
          :class="[`st-${s.status.toLowerCase()}`, s.zone === 'LOVE' && 'love', s.zone === 'COMFORT' && 'comfort']"
          :style="{
            gridColumn: `${column(s.zone === 'LOVE' ? s.number * 2 - 1 : s.number)} / span ${s.zone === 'LOVE' ? 2 : 1}`,
          }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.mini {
  --cell: 14px;
}
@media (min-width: 768px) {
  .mini {
    --cell: 18px;
  }
}
.cell {
  height: calc(var(--cell) * 0.85);
  border-radius: 5px 5px 2px 2px;
  background: rgb(var(--c-seat-free));
}
.cell.comfort.st-free {
  background: rgb(var(--c-seat-comfort));
}
.cell.love {
  box-shadow: inset 0 0 0 1px rgb(var(--c-gold) / 0.7);
}
.cell.st-sold {
  background: rgb(var(--c-accent));
}
.cell.st-reserved {
  background: rgb(var(--c-gold));
}
</style>
