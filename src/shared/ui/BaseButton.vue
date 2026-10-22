<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'gold';
    size?: 'sm' | 'md' | 'lg';
    to?: RouteLocationRaw;
    href?: string;
    type?: 'button' | 'submit';
    loading?: boolean;
    disabled?: boolean;
    block?: boolean;
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
);

const tag = computed(() => (props.to ? 'RouterLink' : props.href ? 'a' : 'button'));

const classes = computed(() => [
  'inline-flex select-none items-center justify-center gap-2 rounded-md font-semibold',
  'transition-[background-color,box-shadow,transform,color] duration-200 ease-out active:scale-[0.97]',
  'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
  {
    sm: 'h-9 px-3.5 text-sm',
    md: 'h-11 px-5 text-[15px]',
    lg: 'h-14 px-7 text-base',
  }[props.size],
  {
    primary: 'bg-accent text-white shadow-glow-sm hover:bg-accent-hover hover:shadow-glow',
    secondary: 'bg-raised text-text ring-1 ring-inset ring-text/10 hover:bg-text/10',
    ghost: 'text-text hover:bg-text/5',
    gold: 'bg-transparent text-gold ring-1 ring-inset ring-gold/60 hover:bg-gold/10',
  }[props.variant],
  props.block && 'w-full',
]);
</script>

<template>
  <component
    :is="tag"
    :to="to"
    :href="href"
    :type="tag === 'button' ? type : undefined"
    :disabled="tag === 'button' ? disabled || loading : undefined"
    :aria-disabled="tag !== 'button' && disabled ? 'true' : undefined"
    :aria-busy="loading || undefined"
    :class="classes"
  >
    <span
      v-if="loading"
      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </component>
</template>
