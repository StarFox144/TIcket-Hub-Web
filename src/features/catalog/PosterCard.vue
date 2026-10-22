<script setup lang="ts">
import type { CinemaEvent, Movie } from '@/api/types';
import Badge from '@/shared/ui/Badge.vue';
import Icon from '@/shared/ui/Icon.vue';
import PosterArt from '@/shared/ui/PosterArt.vue';
import SessionChips from './SessionChips.vue';

defineProps<{ movie: Movie; sessions: CinemaEvent[] }>();
</script>

<template>
  <article class="group flex flex-col">
    <RouterLink
      :to="{ name: 'movie', params: { slug: movie.slug } }"
      class="relative block overflow-hidden rounded-lg ring-1 ring-inset ring-text/[0.06] transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:shadow-[0_18px_40px_-12px_rgba(200,16,46,0.45)]"
    >
      <PosterArt :title="movie.title" :palette="movie.palette" size="sm" />
      <div class="absolute left-3 top-3 flex gap-1.5">
        <Badge tone="age" class="bg-black/50 backdrop-blur">{{ movie.ageRating }}</Badge>
      </div>
      <span
        v-if="movie.rating"
        class="absolute right-3 top-3 flex items-center gap-1 rounded-sm bg-black/60 px-2 py-0.5 text-xs font-bold text-gold backdrop-blur"
      >
        <Icon name="star" :size="12" /> {{ movie.rating.toFixed(1) }}
      </span>
    </RouterLink>

    <div class="mt-3 flex flex-1 flex-col">
      <h3 class="text-lg leading-snug">
        <RouterLink
          :to="{ name: 'movie', params: { slug: movie.slug } }"
          class="transition-colors hover:text-accent-hover"
        >
          {{ movie.title }}
        </RouterLink>
      </h3>
      <p class="mt-0.5 text-[13px] text-muted">{{ movie.genres.join(' · ') }}</p>
      <div class="mt-3">
        <SessionChips :sessions="sessions" :limit="4" size="sm" />
      </div>
    </div>
  </article>
</template>
