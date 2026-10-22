<script setup lang="ts">
import type { Order } from '@/api/types';
import Badge from '@/shared/ui/Badge.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import PosterArt from '@/shared/ui/PosterArt.vue';
import { formatLongDate, formatTime } from '@/shared/composables/useDateLabel';
import { formatMoney } from '@/shared/composables/useMoney';

defineProps<{ order: Order }>();

const zoneLabel = { STANDARD: 'Стандарт', COMFORT: 'Комфорт', LOVE: 'Love Seat' } as const;
</script>

<template>
  <BaseCard as="section" aria-labelledby="summary-title">
    <div class="flex gap-4 md:gap-5">
      <div class="w-24 shrink-0 overflow-hidden rounded-md ring-1 ring-inset ring-white/10 md:w-28">
        <PosterArt :title="order.event.title" :palette="order.event.movie.palette" size="sm" />
      </div>
      <div class="min-w-0">
        <h2 id="summary-title" class="text-[22px] leading-tight">{{ order.event.title }}</h2>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <Badge tone="age">{{ order.event.movie.ageRating }}</Badge>
          <Badge :tone="order.event.section.format === 'IMAX' ? 'gold' : 'neutral'">{{
            order.event.section.format
          }}</Badge>
        </div>
        <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt class="text-muted">Дата</dt>
          <dd class="first-letter:uppercase">{{ formatLongDate(order.event.startsAt) }}</dd>
          <dt class="text-muted">Час</dt>
          <dd class="num">{{ formatTime(order.event.startsAt) }}</dd>
          <dt class="text-muted">Зал</dt>
          <dd>{{ order.event.venue.name }}, {{ order.event.section.name }}</dd>
        </dl>
      </div>
    </div>

    <ul class="mt-6 divide-y divide-text/[0.06] border-y border-text/[0.06]" aria-label="Місця">
      <li v-for="s in order.seats" :key="s.id" class="flex items-center justify-between gap-4 py-3 text-sm">
        <span>
          Ряд <span class="num">{{ s.row }}</span
          >, місце <span class="num">{{ s.number }}</span>
          <span
            class="ml-2 text-xs font-semibold"
            :class="s.zone === 'LOVE' ? 'text-gold' : s.zone === 'COMFORT' ? 'text-accent-text' : 'text-muted'"
          >
            {{ zoneLabel[s.zone] }}
          </span>
        </span>
        <span class="num">{{ formatMoney(s.price) }}</span>
      </li>
    </ul>

    <div class="mt-4 flex items-baseline justify-between">
      <span class="font-semibold">До сплати</span>
      <span class="num text-[26px] text-text">{{ formatMoney(order.total) }}</span>
    </div>
  </BaseCard>
</template>
