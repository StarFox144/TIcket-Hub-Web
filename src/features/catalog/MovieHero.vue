<script setup lang="ts">
import { computed } from 'vue';
import type { CinemaEvent, Movie } from '@/api/types';
import Badge from '@/shared/ui/Badge.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
import Icon from '@/shared/ui/Icon.vue';
import PosterArt from '@/shared/ui/PosterArt.vue';
import { formatDuration } from '@/shared/composables/useDateLabel';
import SessionChips from './SessionChips.vue';

const props = withDefaults(defineProps<{ movie: Movie; sessions: CinemaEvent[]; sessionsLabel?: string }>(), {
  sessionsLabel: 'Сеанси сьогодні',
});

const next = computed(() => props.sessions[0]);
</script>

<template>
  <section class="hero relative isolate overflow-hidden" aria-labelledby="hero-title">
    <div class="curtain absolute inset-0 -z-10" aria-hidden="true" />
    <div class="container-page grid items-center gap-8 py-10 md:grid-cols-[minmax(0,300px)_1fr] md:gap-12 md:py-16">
      <RouterLink
        :to="{ name: 'movie', params: { slug: movie.slug } }"
        class="mx-auto block w-48 overflow-hidden rounded-lg shadow-[0_30px_60px_-20px_rgba(200,16,46,0.55)] ring-1 ring-inset ring-white/10 transition-transform duration-300 ease-out hover:-translate-y-1 sm:w-56 md:w-full"
        tabindex="-1"
        aria-hidden="true"
      >
        <PosterArt :title="movie.title" :palette="movie.palette" size="lg" />
      </RouterLink>

      <div>
        <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-gold">
          <span class="h-px w-8 bg-gold/60" aria-hidden="true" /> Фільм дня
        </p>
        <h1 id="hero-title" class="mt-3 text-[34px] md:text-[52px]">{{ movie.title }}</h1>

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

        <p class="mt-5 max-w-xl leading-relaxed text-text/80">{{ movie.description }}</p>

        <div v-if="sessions.length" class="mt-7">
          <p class="mb-3 text-sm font-semibold text-muted">{{ sessionsLabel }}</p>
          <SessionChips :sessions="sessions" :limit="6" />
        </div>

        <div class="mt-8 flex flex-wrap gap-3">
          <BaseButton v-if="next" :to="{ name: 'session', params: { id: next.id } }" size="lg">
            <Icon name="sofa" /> Обрати місця
          </BaseButton>
          <BaseButton :to="{ name: 'movie', params: { slug: movie.slug } }" variant="secondary" size="lg">
            <Icon name="play" :size="18" /> Про фільм
          </BaseButton>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Світло від червоної завіси: градієнт лише в hero. */
.curtain {
  background:
    radial-gradient(70% 90% at 15% 0%, rgb(var(--c-accent) / 0.45) 0%, transparent 65%),
    radial-gradient(50% 60% at 100% 10%, rgb(var(--c-accent-dark) / 0.6) 0%, transparent 70%),
    linear-gradient(180deg, rgb(var(--c-accent-dark) / 0.55) 0%, rgb(var(--c-bg)) 92%);
}
/* М'які складки оксамиту */
.curtain::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    90deg,
    rgb(0 0 0 / 0.18) 0px,
    rgb(255 255 255 / 0.025) 28px,
    rgb(0 0 0 / 0.18) 56px
  );
  mask-image: linear-gradient(180deg, black 0%, transparent 70%);
}
.curtain::after {
  content: '';
  position: absolute;
  inset: auto 0 0 0;
  height: 120px;
  background: linear-gradient(180deg, transparent, rgb(var(--c-bg)));
}
</style>
