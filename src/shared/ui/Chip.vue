<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

/** Пігулка: чип часу сеансу, фільтр або вибране місце. */
const props = withDefaults(
  defineProps<{
    to?: RouteLocationRaw;
    active?: boolean;
    size?: 'sm' | 'md';
    /** Для фільтрів-перемикачів: виставляє aria-pressed. */
    toggle?: boolean;
  }>(),
  { size: 'md' },
);

defineEmits<{ click: [MouseEvent] }>();

const tag = computed(() => (props.to ? 'RouterLink' : 'button'));
</script>

<template>
  <component
    :is="tag"
    :to="to"
    :type="tag === 'button' ? 'button' : undefined"
    :aria-pressed="toggle ? active : undefined"
    :aria-current="to && active ? 'true' : undefined"
    class="relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill font-semibold ring-1 ring-inset transition-all duration-200 ease-out"
    :class="[
      size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-sm',
      active
        ? 'bg-accent text-white ring-accent shadow-glow-sm'
        : 'bg-raised text-text ring-text/10 hover:-translate-y-px hover:ring-accent/60 hover:text-white',
    ]"
    @click="$emit('click', $event)"
  >
    <slot />
  </component>
</template>
