<script setup lang="ts">
import { computed } from 'vue';
import type { EventSeat } from '@/api/types';
import { seatAriaLabel } from './seatText';

const props = defineProps<{
  seat: EventSeat;
  selected: boolean;
  flashing: boolean;
  focusable: boolean;
}>();

defineEmits<{ toggle: []; hover: [HTMLElement | null] }>();

const taken = computed(() => props.seat.status !== 'FREE' && !props.selected);
</script>

<template>
  <button
    type="button"
    class="seat"
    :class="[`zone-${seat.zone.toLowerCase()}`, { 'is-selected': selected, 'is-taken': taken, 'is-flash': flashing }]"
    :data-seat-id="seat.id"
    :tabindex="focusable ? 0 : -1"
    :aria-pressed="selected"
    :aria-disabled="taken || undefined"
    :aria-label="seatAriaLabel(seat, selected)"
    @click="!taken && $emit('toggle')"
    @mouseenter="$emit('hover', $event.currentTarget as HTMLElement)"
    @mouseleave="$emit('hover', null)"
    @focus="$emit('hover', $event.currentTarget as HTMLElement)"
    @blur="$emit('hover', null)"
  >
    <span v-if="selected" class="seat-num" aria-hidden="true">{{ seat.number }}</span>
  </button>
</template>

<style scoped>
/* Крісло: спинка з дуже округлим верхом і світліша «подушка» знизу. */
.seat {
  position: relative;
  width: 100%;
  height: var(--seat-h);
  border-radius: calc(var(--seat-h) * 0.42) calc(var(--seat-h) * 0.42) calc(var(--seat-h) * 0.18)
    calc(var(--seat-h) * 0.18);
  background: rgb(var(--seat-bg));
  box-shadow: inset 0 0 0 1px rgb(var(--seat-ring) / var(--seat-ring-a, 0));
  transition:
    background-color 200ms var(--ease-out),
    box-shadow 200ms var(--ease-out),
    transform 200ms var(--ease-out);
  --seat-bg: var(--c-seat-free);
  --seat-ring: var(--c-text);
}
.seat::after {
  content: '';
  position: absolute;
  left: 12%;
  right: 12%;
  bottom: 14%;
  height: 22%;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.07);
  transition: background-color 200ms var(--ease-out);
}

.zone-comfort {
  --seat-bg: var(--c-seat-comfort);
}
.zone-love {
  --seat-ring: var(--c-gold);
  --seat-ring-a: 0.75;
}

.seat:not(.is-taken):not(.is-selected):hover {
  --seat-ring-a: 0.55;
  transform: translateY(-2px);
  filter: brightness(1.25);
}
.zone-love:not(.is-taken):not(.is-selected):hover {
  --seat-ring-a: 1;
}

.seat.is-selected {
  --seat-bg: var(--c-accent);
  --seat-ring: 255 255 255;
  --seat-ring-a: 0.25;
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.25),
    0 0 14px 2px rgb(var(--c-accent) / 0.55),
    0 6px 18px -4px rgb(var(--c-accent) / 0.7);
  animation: seat-bounce 320ms var(--ease-out);
}
.zone-love.is-selected {
  box-shadow:
    inset 0 0 0 1.5px rgb(var(--c-gold)),
    0 0 14px 2px rgb(var(--c-accent) / 0.55);
}
.seat.is-selected::after {
  background: rgb(255 255 255 / 0.18);
}

.seat.is-taken {
  --seat-bg: var(--c-seat-taken);
  --seat-ring-a: 0;
  cursor: not-allowed;
}
.seat.is-taken::after {
  background: rgb(255 255 255 / 0.025);
}

.seat.is-flash {
  animation: seat-flash 1.2s ease-out;
}

.seat-num {
  position: absolute;
  inset: 0 0 18% 0;
  display: grid;
  place-items: center;
  font-size: calc(var(--seat-h) * 0.42);
  font-weight: 800;
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.seat:focus-visible {
  outline: 2px solid rgb(var(--c-text));
  outline-offset: 2px;
}

@keyframes seat-bounce {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.18) translateY(-3px);
  }
  70% {
    transform: scale(0.96);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes seat-flash {
  0%,
  30%,
  60% {
    background: rgb(var(--c-danger));
    box-shadow: 0 0 16px rgb(var(--c-danger) / 0.7);
  }
  15%,
  45%,
  100% {
    background: rgb(var(--c-seat-taken));
  }
}
</style>
