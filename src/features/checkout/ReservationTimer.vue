<script setup lang="ts">
import { computed, watch } from 'vue';
import { useCountdown } from '@/shared/composables/useCountdown';

const props = withDefaults(defineProps<{ expiresAt: string; totalMs?: number }>(), {
  totalMs: 10 * 60 * 1000,
});
const emit = defineEmits<{ expired: [] }>();

const { left, label, expired } = useCountdown(() => props.expiresAt);

const R = 52;
const C = 2 * Math.PI * R;
const progress = computed(() => Math.min(1, left.value / props.totalMs));
/** За 2 хвилини до кінця таймер м'яко пульсує. */
const urgent = computed(() => left.value > 0 && left.value <= 2 * 60 * 1000);

const minutesLeft = computed(() => Math.ceil(left.value / 60_000));

watch(expired, (v) => v && emit('expired'), { immediate: true });
</script>

<template>
  <div class="flex items-center gap-5">
    <div
      class="relative h-[124px] w-[124px] shrink-0"
      :class="urgent && 'animate-[timer-pulse_1.6s_ease-in-out_infinite]'"
    >
      <svg viewBox="0 0 120 120" class="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" :r="R" fill="none" stroke="rgb(var(--c-text) / 0.08)" stroke-width="8" />
        <circle
          cx="60"
          cy="60"
          :r="R"
          fill="none"
          stroke="rgb(var(--c-accent))"
          stroke-width="8"
          stroke-linecap="round"
          :stroke-dasharray="C"
          :stroke-dashoffset="C * (1 - progress)"
          class="transition-[stroke-dashoffset] duration-1000 ease-linear"
          style="filter: drop-shadow(0 0 6px rgb(200 16 46 / 0.6))"
        />
      </svg>
      <div class="absolute inset-0 grid place-items-center">
        <span class="num text-[26px] leading-none" :class="urgent && 'text-accent-text'">{{ label }}</span>
      </div>
    </div>
    <div>
      <p class="font-semibold">Місця зарезервовані</p>
      <p class="mt-1 text-sm text-muted">
        <template v-if="urgent">Поспішіть — резерв майже закінчився.</template>
        <template v-else>Встигніть оплатити, поки тримаємо їх за вами.</template>
      </p>
      <!-- Для скрінрідерів — раз на хвилину, а не щосекунди -->
      <p class="sr-only" aria-live="polite">Залишилось хвилин: {{ minutesLeft }}</p>
    </div>
  </div>
</template>

<style>
@keyframes timer-pulse {
  0%,
  100% {
    filter: drop-shadow(0 0 0 rgb(200 16 46 / 0));
  }
  50% {
    filter: drop-shadow(0 0 14px rgb(200 16 46 / 0.55));
  }
}
</style>
