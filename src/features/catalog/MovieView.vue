<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fetchSessions } from '@/api/events';
import { useCityStore } from '@/stores/city';
import { useAsync } from '@/shared/composables/useAsync';
import { dayKey, formatDuration } from '@/shared/composables/useDateLabel';
import Badge from '@/shared/ui/Badge.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
import Icon from '@/shared/ui/Icon.vue';
import PosterArt from '@/shared/ui/PosterArt.vue';
import Skeleton from '@/shared/ui/Skeleton.vue';
import StateBlock from '@/shared/ui/StateBlock.vue';
import DateStrip from './DateStrip.vue';
import SessionChips from './SessionChips.vue';
import { groupByHall, sessionsOnDay } from './grouping';

const props = defineProps<{ slug: string }>();
const cityStore = useCityStore();

const {
  data: events,
  loading,
  error,
  run,
  retry,
} = useAsync(() => fetchSessions({ q: props.slug, city: cityStore.city }));
watch([() => props.slug, () => cityStore.city], () => run(), { immediate: true });

const movie = computed(() => events.value?.[0]?.movie ?? null);
const day = ref(dayKey(new Date()));

// Якщо сьогодні сеансів уже немає — відкриваємо перший день, коли вони є.
watch(events, (list) => {
  if (list?.length && !sessionsOnDay(list, day.value).length) day.value = dayKey(list[0].startsAt);
});

const halls = computed(() => groupByHall(sessionsOnDay(events.value ?? [], day.value)));
</script>

<template>
  <div>
    <div v-if="loading && !events" class="container-page grid gap-8 py-10 md:grid-cols-[280px_1fr]" aria-busy="true">
      <Skeleton class="aspect-[2/3] w-full max-w-[280px]" rounded="rounded-lg" />
      <div class="space-y-4">
        <Skeleton class="h-12 w-2/3" />
        <Skeleton class="h-4 w-1/3" />
        <Skeleton class="h-24 w-full" />
      </div>
    </div>

    <div v-else-if="error" class="container-page py-10">
      <StateBlock kind="error" title="Не вдалося завантажити фільм" :text="error" @retry="retry" />
    </div>

    <div v-else-if="!movie" class="container-page py-10">
      <StateBlock
        title="Сеансів цього фільму немає"
        text="Можливо, прокат уже завершився або фільм іде в іншому місті."
      >
        <BaseButton to="/">До афіші</BaseButton>
      </StateBlock>
    </div>

    <template v-else>
      <section class="relative isolate overflow-hidden">
        <div
          class="absolute inset-0 -z-10 opacity-60 blur-3xl"
          :style="{ background: `radial-gradient(60% 80% at 20% 0%, ${movie.palette[1]}88, transparent 70%)` }"
          aria-hidden="true"
        />
        <div class="container-page grid gap-8 py-8 md:grid-cols-[280px_1fr] md:gap-12 md:py-14">
          <div class="mx-auto w-52 overflow-hidden rounded-lg shadow-card ring-1 ring-inset ring-white/10 md:w-full">
            <PosterArt :title="movie.title" :palette="movie.palette" size="lg" />
          </div>
          <div>
            <RouterLink to="/" class="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
              <Icon name="chevron-left" :size="16" /> Афіша
            </RouterLink>
            <h1 class="mt-3 md:text-[48px]">{{ movie.title }}</h1>
            <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text/85">
              <Badge tone="age">{{ movie.ageRating }}</Badge>
              <span>{{ movie.genres.join(', ') }}</span>
              <span class="flex items-center gap-1.5"
                ><Icon name="clock" :size="16" class="text-muted" /> {{ formatDuration(movie.durationMin) }}</span
              >
              <span v-if="movie.rating" class="flex items-center gap-1 font-bold text-gold">
                <Icon name="star" :size="16" /> {{ movie.rating.toFixed(1) }}
              </span>
            </div>
            <p class="mt-5 max-w-2xl leading-relaxed text-text/80">{{ movie.description }}</p>

            <div
              class="mt-6 grid aspect-video max-w-xl place-items-center rounded-lg bg-surface ring-1 ring-inset ring-text/[0.06]"
              :style="{ background: `linear-gradient(135deg, ${movie.palette[0]}, #0b0b0d)` }"
            >
              <button
                type="button"
                class="grid h-16 w-16 place-items-center rounded-full bg-accent text-white shadow-glow transition-transform duration-200 hover:scale-105"
                :aria-label="`Дивитися трейлер «${movie.title}»`"
              >
                <Icon name="play" :size="26" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="container-page" aria-labelledby="sessions-title">
        <h2 id="sessions-title">Сеанси</h2>
        <div class="mt-4"><DateStrip v-model="day" /></div>
        <div class="mt-6 space-y-4">
          <StateBlock v-if="!halls.length" title="На цю дату сеансів немає" text="Оберіть інший день у стрічці вище." />
          <div
            v-for="h in halls"
            :key="h.title"
            class="flex flex-col gap-3 rounded-lg bg-surface p-5 ring-1 ring-inset ring-text/[0.06] md:flex-row md:items-center md:gap-6"
          >
            <div class="md:w-64">
              <p class="font-semibold">{{ h.title }}</p>
              <p class="text-sm text-muted">{{ h.format }}</p>
            </div>
            <SessionChips :sessions="h.sessions" />
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
