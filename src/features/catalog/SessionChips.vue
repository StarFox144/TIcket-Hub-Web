<script setup lang="ts">
import type { CinemaEvent } from '@/api/types';
import Chip from '@/shared/ui/Chip.vue';
import { formatTime } from '@/shared/composables/useDateLabel';
import { moneyForSpeech } from '@/shared/composables/useMoney';

withDefaults(defineProps<{ sessions: CinemaEvent[]; limit?: number; size?: 'sm' | 'md'; activeId?: string }>(), {
  limit: Infinity,
  size: 'md',
});
</script>

<template>
  <ul class="flex flex-wrap gap-2">
    <li v-for="s in sessions.slice(0, limit)" :key="s.id">
      <Chip :to="{ name: 'session', params: { id: s.id } }" :size="size" :active="s.id === activeId">
        <span class="num tabular-nums">{{ formatTime(s.startsAt) }}</span>
        <span
          v-if="s.section.format !== '2D'"
          class="text-[10px] font-extrabold tracking-wider"
          :class="s.id === activeId ? 'text-white' : 'text-gold'"
          >{{ s.section.format }}</span
        >
        <span class="sr-only">, {{ s.section.name }}, від {{ moneyForSpeech(s.minPrice) }}</span>
      </Chip>
    </li>
    <li v-if="sessions.length > limit" class="flex items-center px-1 text-sm text-muted">
      +{{ sessions.length - limit }}
    </li>
  </ul>
</template>
