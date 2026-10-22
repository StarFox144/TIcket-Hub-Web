<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchSessions } from '@/api/events';
import { useCityStore } from '@/stores/city';
import { useAsync } from '@/shared/composables/useAsync';
import { addDays, dayKey, relativeDay, startOfDay } from '@/shared/composables/useDateLabel';
import Chip from '@/shared/ui/Chip.vue';
import Skeleton from '@/shared/ui/Skeleton.vue';
import StateBlock from '@/shared/ui/StateBlock.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
import DateStrip from './DateStrip.vue';
import MovieHero from './MovieHero.vue';
import PosterCard from './PosterCard.vue';
import { FORMAT_FILTERS, groupByMovie, matchesFilter, sessionsOnDay, type FormatFilter } from './grouping';

const route = useRoute();
const router = useRouter();
const cityStore = useCityStore();

const day = ref(dayKey(new Date()));
const filter = ref<FormatFilter>('all');
const search = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''));

const {
  data: events,
  loading,
  error,
  run,
  retry,
} = useAsync(() =>
  fetchSessions({
    from: new Date().toISOString(),
    to: addDays(startOfDay(new Date()), 7).toISOString(),
    city: cityStore.city,
    q: search.value || undefined,
  }),
);

watch([() => cityStore.city, search], () => run(), { immediate: true });

/** Фільм дня — найвище оцінений із тих, що ще йдуть найближчим часом. */
const hero = computed(() => {
  const groups = groupByMovie(events.value ?? []);
  if (!groups.length || search.value) return null;
  const best = [...groups].sort((a, b) => (b.movie.rating ?? 0) - (a.movie.rating ?? 0))[0];
  const firstDay = dayKey(best.sessions[0].startsAt);
  const label = relativeDay(best.sessions[0].startsAt);
  return {
    ...best,
    sessions: sessionsOnDay(best.sessions, firstDay),
    label: label ? `Сеанси ${label.toLowerCase()}` : 'Найближчі сеанси',
  };
});

const daySessions = computed(() =>
  sessionsOnDay(events.value ?? [], day.value).filter((e) => matchesFilter(e, filter.value)),
);
const movies = computed(() => groupByMovie(daySessions.value));

function clearSearch() {
  router.push({ name: 'home' });
}
</script>

<template>
  <div>
    <template v-if="loading && !events">
      <div
        class="container-page grid gap-8 py-10 md:grid-cols-[300px_1fr] md:py-16"
        aria-busy="true"
        aria-label="Завантаження афіші"
      >
        <Skeleton class="mx-auto aspect-[2/3] w-48 sm:w-56 md:w-full" rounded="rounded-lg" />
        <div class="space-y-4 self-center">
          <Skeleton class="h-4 w-28" />
          <Skeleton class="h-12 w-3/4" />
          <Skeleton class="h-4 w-1/2" />
          <Skeleton class="h-20 w-full max-w-xl" />
          <div class="flex gap-2"><Skeleton v-for="i in 4" :key="i" class="h-10 w-20" rounded="rounded-pill" /></div>
        </div>
      </div>
    </template>
    <MovieHero v-else-if="hero" :movie="hero.movie" :sessions="hero.sessions" :sessions-label="hero.label" />

    <section class="container-page" :class="hero ? 'mt-2' : 'mt-10'" aria-labelledby="schedule-title">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <h2 id="schedule-title">
          <template v-if="search">Результати для «{{ search }}»</template>
          <template v-else>Розклад у місті {{ cityStore.city }}</template>
        </h2>
        <BaseButton v-if="search" variant="ghost" size="sm" @click="clearSearch">Скинути пошук</BaseButton>
      </div>

      <div class="mt-5 space-y-4">
        <DateStrip v-model="day" />
        <div
          role="group"
          aria-label="Формат"
          class="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0"
        >
          <Chip
            v-for="f in FORMAT_FILTERS"
            :key="f.value"
            toggle
            size="sm"
            :active="filter === f.value"
            @click="filter = f.value"
          >
            {{ f.label }}
          </Chip>
        </div>
      </div>

      <div class="mt-8">
        <div
          v-if="loading && !events"
          class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4"
          aria-hidden="true"
        >
          <div v-for="i in 8" :key="i">
            <Skeleton class="aspect-[2/3] w-full" rounded="rounded-lg" />
            <Skeleton class="mt-3 h-5 w-3/4" />
            <Skeleton class="mt-2 h-3 w-1/2" />
            <div class="mt-3 flex gap-2">
              <Skeleton v-for="j in 3" :key="j" class="h-8 w-14" rounded="rounded-pill" />
            </div>
          </div>
        </div>

        <StateBlock v-else-if="error" kind="error" title="Не вдалося завантажити афішу" :text="error" @retry="retry" />

        <StateBlock
          v-else-if="!movies.length"
          title="На цю дату сеансів немає"
          :text="
            filter !== 'all'
              ? 'Спробуйте інший формат або гляньте завтра.'
              : 'Гляньте завтра — розклад оновлюється щодня.'
          "
          icon="film"
        >
          <BaseButton v-if="filter !== 'all'" variant="secondary" @click="filter = 'all'">Показати всі</BaseButton>
        </StateBlock>

        <TransitionGroup
          v-else
          tag="div"
          name="grid"
          class="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6"
        >
          <PosterCard v-for="g in movies" :key="g.movie.slug" :movie="g.movie" :sessions="g.sessions" />
        </TransitionGroup>
      </div>
    </section>
  </div>
</template>

<style scoped>
.grid-enter-active {
  transition:
    opacity 300ms var(--ease-out),
    transform 300ms var(--ease-out);
}
.grid-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
</style>
