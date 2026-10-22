<script setup lang="ts">
import type { EventSeat } from '@/api/types';
import BaseButton from '@/shared/ui/BaseButton.vue';
import Icon from '@/shared/ui/Icon.vue';
import { formatMoney } from '@/shared/composables/useMoney';
import { MAX_SEATS } from '@/stores/cart';
import { pluralSeats, seatsSummary, ZONE_LABEL } from './seatText';

defineProps<{ seats: EventSeat[]; count: number; total: number; loading: boolean }>();
defineEmits<{ remove: [string]; book: [] }>();
</script>

<template>
  <div
    class="fixed inset-x-0 z-30 border-t border-text/[0.08] bg-raised/95 shadow-[0_-12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl md:bottom-0"
    style="bottom: var(--bottom-nav-h)"
    role="region"
    aria-label="Кошик"
  >
    <div class="container-page flex flex-col gap-3 py-3 md:flex-row md:items-center md:gap-6 md:py-4">
      <div class="min-w-0 flex-1">
        <p v-if="!seats.length" class="py-2 text-sm text-muted">
          Оберіть місця на схемі — до {{ MAX_SEATS }} за замовлення.
        </p>
        <TransitionGroup
          v-else
          tag="ul"
          name="chip"
          class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]"
          aria-label="Вибрані місця"
        >
          <li v-for="s in seats" :key="s.id" class="shrink-0">
            <span
              class="inline-flex h-9 items-center gap-1.5 rounded-pill bg-accent/15 pl-3 pr-1 text-sm font-semibold ring-1 ring-inset ring-accent/40"
              :class="s.zone === 'LOVE' && 'ring-gold/60'"
            >
              <span class="whitespace-nowrap">Ряд {{ s.row }} · {{ s.number }}</span>
              <span
                v-if="s.zone !== 'STANDARD'"
                class="text-[11px] font-bold"
                :class="s.zone === 'LOVE' ? 'text-gold' : 'text-accent-text'"
              >
                {{ ZONE_LABEL[s.zone] }}
              </span>
              <button
                type="button"
                class="grid h-7 w-7 place-items-center rounded-full text-text/70 transition-colors hover:bg-accent hover:text-white"
                :aria-label="`Прибрати ряд ${s.row}, місце ${s.number}`"
                @click="$emit('remove', s.id)"
              >
                <Icon name="x" :size="14" />
              </button>
            </span>
          </li>
        </TransitionGroup>
      </div>

      <div class="flex items-center justify-between gap-4 md:justify-end">
        <div class="min-w-0" aria-live="polite">
          <p class="num text-[22px] leading-none">{{ formatMoney(total) }}</p>
          <p class="mt-1 truncate text-xs text-muted">
            <template v-if="seats.length">{{ pluralSeats(count) }} · {{ seatsSummary(seats) }}</template>
            <template v-else>0 місць</template>
          </p>
        </div>
        <BaseButton size="lg" class="shrink-0" :disabled="!seats.length" :loading="loading" @click="$emit('book')">
          Забронювати
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chip-enter-active,
.chip-leave-active {
  transition: all 220ms var(--ease-out);
}
.chip-enter-from,
.chip-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
@media (min-width: 768px) {
  div[role='region'] {
    bottom: 0 !important;
  }
}
</style>
