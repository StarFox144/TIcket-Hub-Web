<script setup lang="ts">
withDefaults(defineProps<{ as?: string; padded?: boolean; raised?: boolean }>(), {
  as: 'div',
  padded: true,
});
</script>

<template>
  <component
    :is="as"
    class="rounded-lg ring-1 ring-inset ring-text/[0.06]"
    :class="[raised ? 'bg-raised shadow-card' : 'bg-surface', padded && 'p-5 md:p-6']"
  >
    <slot />
  </component>
</template>
