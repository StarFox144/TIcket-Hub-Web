<script setup lang="ts">
import { computed } from 'vue';
import type { EventSeat, SeatZone } from '@/api/types';
import { formatMoney } from '@/shared/composables/useMoney';
import { ZONE_LABEL } from './seatText';

const props = defineProps<{ seats: EventSeat[] }>();

const prices = computed(() => {
  const map = new Map<SeatZone, number>();
  for (const s of props.seats) map.set(s.zone, Math.min(map.get(s.zone) ?? Infinity, s.price));
  return map;
});

const items = computed(() => [
  ...(['STANDARD', 'COMFORT', 'LOVE'] as SeatZone[])
    .filter((z) => prices.value.has(z))
    .map((z) => ({ key: z, label: ZONE_LABEL[z], price: prices.value.get(z)!, cls: `swatch-${z.toLowerCase()}` })),
  { key: 'selected', label: 'Вибране', price: null, cls: 'swatch-selected' },
  { key: 'taken', label: 'Зайняте', price: null, cls: 'swatch-taken' },
]);
</script>

<template>
  <ul class="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm" aria-label="Легенда схеми">
    <li v-for="i in items" :key="i.key" class="flex items-center gap-2.5">
      <span class="swatch" :class="i.cls" aria-hidden="true" />
      <span class="text-text/85">{{ i.label }}</span>
      <span v-if="i.price" class="num text-text">{{ formatMoney(i.price) }}</span>
    </li>
  </ul>
</template>

<style scoped>
.swatch {
  display: inline-block;
  width: 22px;
  height: 20px;
  border-radius: 9px 9px 4px 4px;
  background: rgb(var(--c-seat-free));
}
.swatch-comfort {
  background: rgb(var(--c-seat-comfort));
}
.swatch-love {
  width: 38px;
  box-shadow: inset 0 0 0 1px rgb(var(--c-gold) / 0.8);
}
.swatch-selected {
  background: rgb(var(--c-accent));
  box-shadow: 0 0 10px rgb(var(--c-accent) / 0.6);
}
.swatch-taken {
  background: rgb(var(--c-seat-taken));
  box-shadow: inset 0 0 0 1px rgb(var(--c-text) / 0.08);
}
</style>
