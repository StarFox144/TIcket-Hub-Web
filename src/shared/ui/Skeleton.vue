<script setup lang="ts">
withDefaults(defineProps<{ rounded?: string }>(), { rounded: 'rounded-md' });
</script>

<template>
  <div class="skeleton" :class="rounded" aria-hidden="true" />
</template>

<style scoped>
.skeleton {
  background: linear-gradient(
    100deg,
    rgb(var(--c-surface-raised)) 30%,
    rgb(var(--c-text) / 0.07) 50%,
    rgb(var(--c-surface-raised)) 70%
  );
  background-size: 250% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -150% 0;
  }
}
</style>
