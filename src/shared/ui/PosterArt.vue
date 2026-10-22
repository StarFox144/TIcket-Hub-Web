<script setup lang="ts">
import { computed } from 'vue';

/** Постер-плейсхолдер: градієнт із палітри фільму, «зерно» і назва. */
const props = withDefaults(
  defineProps<{
    title: string;
    palette: [string, string];
    size?: 'sm' | 'md' | 'lg';
    caption?: string;
    bare?: boolean;
  }>(),
  { size: 'md' },
);

const style = computed(() => ({
  background: `radial-gradient(120% 80% at 80% 0%, ${props.palette[1]} 0%, transparent 60%),
    radial-gradient(90% 70% at 0% 100%, ${props.palette[1]}55 0%, transparent 70%),
    linear-gradient(160deg, ${props.palette[0]} 0%, #0b0b0d 100%)`,
}));
</script>

<template>
  <div
    class="poster relative isolate flex aspect-[2/3] w-full flex-col justify-end overflow-hidden"
    :style="style"
    role="img"
    :aria-label="`Постер фільму «${title}»`"
  >
    <div class="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
    <span
      v-if="!bare && size !== 'sm'"
      class="pointer-events-none absolute right-3 top-3 font-display text-[11px] uppercase tracking-[0.3em] text-white/50"
      aria-hidden="true"
      >TicketHub</span
    >
    <div v-if="!bare" :class="size === 'sm' ? 'p-3' : 'p-4 md:p-5'" aria-hidden="true">
      <p
        class="font-display font-bold leading-[1.05] text-white drop-shadow"
        :class="{ sm: 'text-base', md: 'text-xl md:text-2xl', lg: 'text-3xl md:text-4xl' }[size]"
      >
        {{ title }}
      </p>
      <p v-if="caption" class="mt-1.5 text-xs font-semibold uppercase tracking-widest text-white/70">
        {{ caption }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.poster::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -5;
  opacity: 0.18;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
</style>
