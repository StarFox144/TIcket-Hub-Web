<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'neutral' | 'accent' | 'gold' | 'age' | 'success' }>(), {
  tone: 'neutral',
});
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-bold uppercase tracking-wide"
    :class="
      {
        neutral: 'bg-text/[0.08] text-text',
        accent: 'bg-accent/20 text-accent-text',
        gold: 'bg-gold/15 text-gold',
        age: 'bg-transparent text-text ring-1 ring-inset ring-text/40',
        success: 'bg-success/15 text-success',
      }[tone]
    "
  >
    <slot />
  </span>
</template>
