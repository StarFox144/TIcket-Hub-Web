<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import { fetchSales, fetchSeatMap, fetchSession } from '@/api/events';
import { useAsync } from '@/shared/composables/useAsync';
import { formatSession } from '@/shared/composables/useDateLabel';
import { formatMoney } from '@/shared/composables/useMoney';
import Badge from '@/shared/ui/Badge.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import Icon from '@/shared/ui/Icon.vue';
import Skeleton from '@/shared/ui/Skeleton.vue';
import StateBlock from '@/shared/ui/StateBlock.vue';
import MiniHallMap from './MiniHallMap.vue';

const REFRESH_MS = 10_000;
const props = defineProps<{ id: string }>();

const event = useAsync(fetchSession);
const sales = useAsync(fetchSales);
const seats = useAsync(fetchSeatMap);

function load() {
  event.run(props.id);
  sales.run(props.id);
  seats.run(props.id);
}
watch(() => props.id, load, { immediate: true });

// Продажі оновлюються у фоні, поки сторінка відкрита.
const timer = setInterval(() => {
  sales.silent(props.id);
  seats.silent(props.id);
}, REFRESH_MS);
onBeforeUnmount(() => clearInterval(timer));

const s = computed(() => sales.data.value);
const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);
const zoneLabel = { STANDARD: 'Стандарт', COMFORT: 'Комфорт', LOVE: 'Love Seat' } as const;
</script>

<template>
  <div class="mx-auto max-w-[1280px]">
    <RouterLink to="/admin/sessions" class="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
      <Icon name="chevron-left" :size="16" /> Розклад
    </RouterLink>

    <div v-if="event.loading.value && !event.data.value" class="mt-4 space-y-3" aria-busy="true">
      <Skeleton class="h-9 w-1/3" /><Skeleton class="h-4 w-1/4" />
    </div>
    <StateBlock
      v-else-if="event.error.value"
      class="mt-4"
      kind="error"
      title="Сеанс не знайдено"
      :text="event.error.value"
      @retry="load"
    />
    <div v-else-if="event.data.value" class="mt-3">
      <h1 class="text-[28px]">{{ event.data.value.title }}</h1>
      <p class="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
        {{ formatSession(event.data.value.startsAt) }} · {{ event.data.value.venue.name }},
        {{ event.data.value.section.name }}
        <Badge :tone="event.data.value.status === 'DRAFT' ? 'neutral' : 'success'">
          {{ event.data.value.status === 'DRAFT' ? 'Чернетка' : 'В афіші' }}
        </Badge>
      </p>
    </div>

    <StateBlock
      v-if="sales.error.value"
      class="mt-6"
      kind="error"
      title="Не вдалося завантажити продажі"
      :text="sales.error.value"
      @retry="load"
    />
    <template v-else>
      <!-- ключові цифри -->
      <dl class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <BaseCard
          v-for="card in [
            {
              label: 'Продано',
              value: s ? `${s.sold} з ${s.capacity}` : null,
              hint: s ? `${pct(s.sold, s.capacity)}% залу` : '',
            },
            { label: 'Виручка', value: s ? formatMoney(s.revenue) : null, hint: 'оплачені квитки' },
            { label: 'У резерві', value: s ? String(s.reserved) : null, hint: 'чекають на оплату' },
            { label: 'Вільно', value: s ? String(s.free) : null, hint: s ? `${pct(s.free, s.capacity)}% залу` : '' },
          ]"
          :key="card.label"
          class="!p-4 md:!p-5"
        >
          <dt class="text-xs font-bold uppercase tracking-wider text-muted">{{ card.label }}</dt>
          <dd class="mt-2">
            <Skeleton v-if="!card.value" class="h-8 w-24" />
            <span v-else class="num text-[26px] leading-none">{{ card.value }}</span>
            <span class="mt-1 block text-xs text-muted">{{ card.hint }}</span>
          </dd>
        </BaseCard>
      </dl>

      <div class="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <BaseCard as="section" aria-labelledby="map-title">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 id="map-title" class="text-xl">Заповненість залу</h2>
            <ul class="flex flex-wrap gap-4 text-xs text-muted" aria-label="Легенда">
              <li class="flex items-center gap-1.5"><span class="h-2.5 w-3 rounded-sm bg-accent" /> Продано</li>
              <li class="flex items-center gap-1.5"><span class="h-2.5 w-3 rounded-sm bg-gold" /> Резерв</li>
              <li class="flex items-center gap-1.5"><span class="h-2.5 w-3 rounded-sm bg-seat-free" /> Вільне</li>
            </ul>
          </div>
          <div class="mt-6">
            <Skeleton v-if="!seats.data.value" class="mx-auto h-48 max-w-md" />
            <MiniHallMap v-else :seats="seats.data.value" />
          </div>
          <div v-if="s" class="mt-6">
            <div class="flex h-2.5 overflow-hidden rounded-full bg-seat-free" aria-hidden="true">
              <div class="bg-accent transition-all duration-500" :style="{ width: `${pct(s.sold, s.capacity)}%` }" />
              <div class="bg-gold transition-all duration-500" :style="{ width: `${pct(s.reserved, s.capacity)}%` }" />
            </div>
            <p class="mt-2 text-xs text-muted">Оновлюється автоматично кожні 10 секунд.</p>
          </div>
        </BaseCard>

        <BaseCard as="section" aria-labelledby="zones-title">
          <h2 id="zones-title" class="text-xl">За типами місць</h2>
          <table class="mt-4 w-full text-sm">
            <thead class="text-xs uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" class="pb-2 text-left font-semibold">Тип</th>
                <th scope="col" class="pb-2 text-right font-semibold">Продано</th>
                <th scope="col" class="pb-2 text-right font-semibold">Виручка</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-text/[0.06]">
              <tr v-for="z in s?.byZone ?? []" :key="z.zone">
                <th scope="row" class="py-3 text-left font-semibold">
                  {{ zoneLabel[z.zone] }}
                  <span class="block text-xs font-normal text-muted">{{ z.capacity }} місць</span>
                </th>
                <td class="num py-3 text-right">
                  {{ z.sold }} <span class="text-xs font-normal text-muted">({{ pct(z.sold, z.capacity) }}%)</span>
                </td>
                <td class="num py-3 text-right">{{ formatMoney(z.revenue) }}</td>
              </tr>
            </tbody>
          </table>
        </BaseCard>
      </div>
    </template>
  </div>
</template>
