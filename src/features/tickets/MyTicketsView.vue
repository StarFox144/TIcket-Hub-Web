<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fetchOrders } from '@/api/orders';
import { useAsync } from '@/shared/composables/useAsync';
import BaseButton from '@/shared/ui/BaseButton.vue';
import Skeleton from '@/shared/ui/Skeleton.vue';
import StateBlock from '@/shared/ui/StateBlock.vue';
import TicketCard from './TicketCard.vue';

const { data, loading, error, run, retry } = useAsync(fetchOrders);
onMounted(run);

/** Квиток вважається майбутнім ще 3 години після початку сеансу. */
const GRACE_MS = 3 * 3600_000;

const tickets = computed(() =>
  (data.value ?? [])
    .filter((o) => o.status === 'PAID')
    .flatMap((o) => o.seats.map((seat) => ({ key: seat.id + o.id, orderId: o.id, event: o.event, seat }))),
);
const upcoming = computed(() =>
  tickets.value
    .filter((t) => Date.parse(t.event.startsAt) + GRACE_MS > Date.now())
    .sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt)),
);
const past = computed(() => tickets.value.filter((t) => Date.parse(t.event.startsAt) + GRACE_MS <= Date.now()));

const tab = ref<'upcoming' | 'past'>('upcoming');
const shown = computed(() => (tab.value === 'upcoming' ? upcoming.value : past.value));
</script>

<template>
  <section class="container-page max-w-4xl py-8 md:py-10" aria-labelledby="tickets-title">
    <h1 id="tickets-title">Мої квитки</h1>

    <div
      role="tablist"
      aria-label="Квитки"
      class="mt-6 inline-flex rounded-pill bg-surface p-1 ring-1 ring-inset ring-text/[0.06]"
    >
      <button
        v-for="t in [
          { key: 'upcoming', label: 'Майбутні', count: upcoming.length },
          { key: 'past', label: 'Архів', count: past.length },
        ] as const"
        :key="t.key"
        role="tab"
        type="button"
        :aria-selected="tab === t.key"
        class="h-10 rounded-pill px-5 text-sm font-semibold transition-all duration-200"
        :class="tab === t.key ? 'bg-accent text-white shadow-glow-sm' : 'text-muted hover:text-text'"
        @click="tab = t.key"
      >
        {{ t.label }} <span class="num ml-1 opacity-70">{{ t.count }}</span>
      </button>
    </div>

    <div class="mt-8">
      <div v-if="loading && !data" class="space-y-6" aria-busy="true" aria-label="Завантаження квитків">
        <Skeleton v-for="i in 2" :key="i" class="h-60" rounded="rounded-lg" />
      </div>
      <StateBlock v-else-if="error" kind="error" title="Не вдалося завантажити квитки" :text="error" @retry="retry" />
      <StateBlock
        v-else-if="!shown.length"
        icon="ticket"
        :title="tab === 'upcoming' ? 'Поки жодного квитка' : 'Архів порожній'"
        :text="
          tab === 'upcoming'
            ? 'Оберіть фільм в афіші — квиток з’явиться тут одразу після оплати.'
            : 'Тут будуть квитки на сеанси, що вже минули.'
        "
      >
        <BaseButton v-if="tab === 'upcoming'" to="/">До афіші</BaseButton>
      </StateBlock>
      <TransitionGroup v-else tag="ul" name="list" class="space-y-8">
        <li v-for="t in shown" :key="t.key">
          <TicketCard :order-id="t.orderId" :event="t.event" :seat="t.seat" :past="tab === 'past'" />
        </li>
      </TransitionGroup>
    </div>
  </section>
</template>

<style scoped>
.list-enter-active {
  transition: all 300ms var(--ease-out);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
</style>
