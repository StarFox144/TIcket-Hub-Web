<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { fetchSeatMap, fetchSession, fetchSessions } from '@/api/events';
import { createOrder } from '@/api/orders';
import { errorMessage } from '@/api/client';
import type { EventSeat, SeatConflict } from '@/api/types';
import { useAuthStore } from '@/stores/auth';
import { MAX_SEATS, useCartStore } from '@/stores/cart';
import { useToastStore } from '@/stores/toast';
import { useAsync } from '@/shared/composables/useAsync';
import { addDays, formatDuration, formatSession, formatTime, startOfDay } from '@/shared/composables/useDateLabel';
import Badge from '@/shared/ui/Badge.vue';
import Chip from '@/shared/ui/Chip.vue';
import Icon from '@/shared/ui/Icon.vue';
import PosterArt from '@/shared/ui/PosterArt.vue';
import Skeleton from '@/shared/ui/Skeleton.vue';
import StateBlock from '@/shared/ui/StateBlock.vue';
import CartBar from './CartBar.vue';
import Legend from './Legend.vue';
import SeatMap from './SeatMap.vue';

const POLL_MS = 4000;

const props = defineProps<{ id: string }>();
const router = useRouter();
const auth = useAuthStore();
const cart = useCartStore();
const toast = useToastStore();

const session = useAsync(fetchSession);
const seatMap = useAsync(fetchSeatMap);
const others = useAsync(fetchSessions);

const event = computed(() => session.data.value);
const seats = computed(() => seatMap.data.value ?? []);

// --- завантаження й polling -------------------------------------------------

async function load(id: string) {
  cart.forEvent(id);
  const [ev] = await Promise.all([session.run(id), seatMap.run(id)]);
  if (seatMap.data.value) reconcile(seatMap.data.value);
  if (ev) {
    const day = startOfDay(ev.startsAt);
    others.run({ q: ev.movie.slug, city: ev.venue.city, from: day.toISOString(), to: addDays(day, 1).toISOString() });
  }
}

watch(() => props.id, load, { immediate: true });

let timer: ReturnType<typeof setInterval> | undefined;

async function poll() {
  if (document.visibilityState !== 'visible' || !event.value) return;
  const fresh = await seatMap.silent(props.id);
  if (fresh) reconcile(fresh);
}

function onVisibility() {
  if (document.visibilityState === 'visible') poll();
}

onMounted(() => {
  timer = setInterval(poll, POLL_MS);
  document.addEventListener('visibilitychange', onVisibility);
});
onBeforeUnmount(() => {
  clearInterval(timer);
  document.removeEventListener('visibilitychange', onVisibility);
});

// --- «щойно перехоплені» місця -------------------------------------------------

const flashIds = ref(new Set<string>());

function flash(lost: Pick<EventSeat, 'id'>[]) {
  flashIds.value = new Set([...flashIds.value, ...lost.map((s) => s.id)]);
  setTimeout(() => {
    const next = new Set(flashIds.value);
    lost.forEach((s) => next.delete(s.id));
    flashIds.value = next;
  }, 1300);
}

function lostMessage(lost: EventSeat[]) {
  const list = lost.map((s) => `${s.row}/${s.number}`).join(', ');
  return lost.length === 1
    ? `Хтось встиг раніше — місце ${list} вже зайняте`
    : `Хтось встиг раніше — місця ${list} вже зайняті`;
}

function reconcile(fresh: EventSeat[]) {
  const lost = cart.reconcile(fresh);
  if (lost.length) {
    flash(lost);
    toast.error(lostMessage(lost));
  }
}

// --- вибір ------------------------------------------------------------------

function toggle(seat: EventSeat) {
  if (cart.toggle(seat) === 'limit') {
    toast.info(`Можна обрати не більше ${MAX_SEATS} місць за одне замовлення`);
  }
}

// --- бронювання -----------------------------------------------------------------

const booking = ref(false);

async function book() {
  if (!cart.seats.length || booking.value) return;
  if (!auth.isLoggedIn) {
    toast.info('Увійдіть, щоб забронювати — вибрані місця збережуться');
    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
    return;
  }

  booking.value = true;
  try {
    const order = await createOrder({ eventId: props.id, seatIds: cart.seats.map((s) => s.id) }, cart.ensureKey());
    cart.clear();
    router.push({ name: 'checkout', params: { orderId: order.id } });
  } catch (e) {
    if (axios.isAxiosError<SeatConflict>(e) && e.response?.status === 409) {
      const lost = cart.removeMany(e.response.data.unavailableSeatIds ?? []);
      flash(lost);
      toast.error(lost.length ? lostMessage(lost) : 'Частину місць уже зайняли — оберіть інші');
      seatMap.silent(props.id);
    } else {
      toast.error(errorMessage(e, 'Не вдалося забронювати. Спробуйте ще раз.'));
    }
  } finally {
    booking.value = false;
  }
}

const freeCount = computed(() => seats.value.filter((s) => s.status === 'FREE').length);
</script>

<template>
  <div>
    <!-- інформація про сеанс -->
    <section class="border-b border-text/[0.06] bg-surface/60">
      <div class="container-page py-5 md:py-6">
        <div v-if="session.loading.value && !event" class="flex gap-4" aria-busy="true">
          <Skeleton class="h-24 w-16" rounded="rounded-md" />
          <div class="flex-1 space-y-3 pt-1"><Skeleton class="h-7 w-1/2" /><Skeleton class="h-4 w-1/3" /></div>
        </div>
        <StateBlock
          v-else-if="session.error.value"
          kind="error"
          title="Сеанс не знайдено"
          :text="session.error.value"
          @retry="load(id)"
        />

        <div v-else-if="event" class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center gap-4">
            <RouterLink
              :to="{ name: 'movie', params: { slug: event.movie.slug } }"
              class="w-16 shrink-0 overflow-hidden rounded-md ring-1 ring-inset ring-white/10 md:w-[72px]"
              :aria-label="`Про фільм «${event.title}»`"
            >
              <PosterArt :title="event.title" :palette="event.movie.palette" size="sm" bare />
            </RouterLink>
            <div class="min-w-0">
              <h1 class="text-[24px] md:text-[30px]">{{ event.title }}</h1>
              <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-text/85">
                <Badge tone="age">{{ event.movie.ageRating }}</Badge>
                <span class="flex items-center gap-1.5"
                  ><Icon name="clock" :size="15" class="text-muted" /> {{ formatSession(event.startsAt) }}</span
                >
                <span class="text-muted" aria-hidden="true">•</span>
                <span>{{ event.venue.name }}, {{ event.section.name }}</span>
                <Badge :tone="event.section.format === 'IMAX' ? 'gold' : 'neutral'">{{ event.section.format }}</Badge>
                <span class="hidden text-muted sm:inline">{{ formatDuration(event.movie.durationMin) }}</span>
              </div>
            </div>
          </div>

          <div v-if="(others.data.value?.length ?? 0) > 1" class="min-w-0">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Інші сеанси цього дня</p>
            <ul
              class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:max-w-[560px] lg:flex-wrap lg:px-0"
            >
              <li v-for="s in others.data.value" :key="s.id">
                <Chip :to="{ name: 'session', params: { id: s.id } }" size="sm" :active="s.id === id">
                  <span class="num">{{ formatTime(s.startsAt) }}</span>
                  <span class="text-[11px] font-semibold" :class="s.id === id ? 'text-white' : 'text-muted'">{{
                    s.section.name
                  }}</span>
                  <span class="sr-only">, {{ s.venue.name }}</span>
                </Chip>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- схема залу -->
    <section class="container-page pt-6 md:pt-8" aria-labelledby="hall-title">
      <div class="flex items-baseline justify-between gap-4">
        <h2 id="hall-title" class="text-[22px]">Оберіть місця</h2>
        <p v-if="seats.length" class="text-sm text-muted">
          Вільно <span class="num text-text">{{ freeCount }}</span> з {{ seats.length }}
        </p>
      </div>

      <div
        class="relative mt-4 overflow-hidden rounded-lg bg-surface px-2 pb-6 pt-4 ring-1 ring-inset ring-text/[0.06] md:px-6"
      >
        <div
          class="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(255,255,255,0.06),transparent)]"
          aria-hidden="true"
        />

        <div
          v-if="seatMap.loading.value && !seatMap.data.value"
          class="space-y-2 px-4 pt-14"
          aria-busy="true"
          aria-label="Завантаження схеми залу"
        >
          <Skeleton class="mx-auto mb-8 h-6 w-3/4" rounded="rounded-pill" />
          <Skeleton v-for="i in 10" :key="i" class="mx-auto h-6 w-full max-w-[540px]" />
        </div>
        <StateBlock
          v-else-if="seatMap.error.value"
          kind="error"
          title="Не вдалося завантажити схему залу"
          :text="seatMap.error.value"
          @retry="seatMap.retry"
        />
        <SeatMap v-else :seats="seats" :selected-ids="cart.selectedIds" :flash-ids="flashIds" @toggle="toggle" />

        <div v-if="seats.length" class="mt-6 border-t border-text/[0.06] pt-5">
          <Legend :seats="seats" />
        </div>
      </div>

      <p class="mt-4 flex items-start gap-2 text-sm text-muted">
        <Icon name="info" :size="16" class="mt-0.5 shrink-0" />
        Схема оновлюється автоматично. Після бронювання місця тримаються за вами 10 хвилин до оплати.
      </p>
    </section>

    <CartBar
      :seats="cart.seats"
      :count="cart.count"
      :total="cart.total"
      :loading="booking"
      @remove="cart.remove"
      @book="book"
    />
  </div>
</template>
