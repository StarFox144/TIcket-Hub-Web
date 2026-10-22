<script setup lang="ts">
import { computed, watch } from 'vue';
import { fetchSessions } from '@/api/events';
import { useCityStore } from '@/stores/city';
import { useAsync } from '@/shared/composables/useAsync';
import { addDays, formatLongDate, startOfDay } from '@/shared/composables/useDateLabel';
import Badge from '@/shared/ui/Badge.vue';
import PosterArt from '@/shared/ui/PosterArt.vue';
import Skeleton from '@/shared/ui/Skeleton.vue';
import StateBlock from '@/shared/ui/StateBlock.vue';
import { groupByMovie } from './grouping';

const cityStore = useCityStore();
const { data, loading, error, run, retry } = useAsync(() =>
  fetchSessions({ from: addDays(startOfDay(new Date()), 7).toISOString(), city: cityStore.city }),
);
watch(
  () => cityStore.city,
  () => run(),
  { immediate: true },
);

const upcoming = computed(() => groupByMovie(data.value ?? []));
</script>

<template>
  <section class="container-page py-10" aria-labelledby="soon-title">
    <h1 id="soon-title">Скоро в кіно</h1>
    <p class="mt-2 text-muted">Прем’єри найближчих тижнів — квитки на допрем’єрні покази вже у продажу.</p>

    <div v-if="loading && !data" class="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
      <Skeleton v-for="i in 4" :key="i" class="aspect-[2/3]" rounded="rounded-lg" />
    </div>
    <StateBlock
      v-else-if="error"
      class="mt-8"
      kind="error"
      title="Не вдалося завантажити"
      :text="error"
      @retry="retry"
    />
    <StateBlock v-else-if="!upcoming.length" class="mt-8" title="Поки без анонсів" text="Загляньте трохи згодом." />
    <ul v-else class="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
      <li v-for="g in upcoming" :key="g.movie.slug" class="group">
        <RouterLink
          :to="{ name: 'session', params: { id: g.sessions[0].id } }"
          class="block overflow-hidden rounded-lg ring-1 ring-inset ring-text/[0.06] transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:shadow-[0_18px_40px_-12px_rgba(200,16,46,0.45)]"
        >
          <PosterArt :title="g.movie.title" :palette="g.movie.palette" size="sm" caption="Прем’єра" />
        </RouterLink>
        <div class="mt-3 flex items-center gap-2">
          <Badge tone="gold">з {{ formatLongDate(g.sessions[0].startsAt).split(', ')[1] }}</Badge>
          <Badge tone="age">{{ g.movie.ageRating }}</Badge>
        </div>
        <h2 class="mt-2 text-lg">{{ g.movie.title }}</h2>
        <p class="text-[13px] text-muted">{{ g.movie.genres.join(' · ') }}</p>
        <p class="mt-2 text-sm text-text/75">{{ g.movie.description }}</p>
      </li>
    </ul>
  </section>
</template>
