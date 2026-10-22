<script setup lang="ts">
import { computed } from 'vue';
import { addDays, dayChip, dayKey, startOfDay } from '@/shared/composables/useDateLabel';

const props = withDefaults(defineProps<{ modelValue: string; days?: number }>(), { days: 7 });
const emit = defineEmits<{ 'update:modelValue': [string] }>();

const items = computed(() => {
  const today = startOfDay(new Date());
  return Array.from({ length: props.days }, (_, i) => {
    const date = addDays(today, i);
    return { key: dayKey(date), weekend: [0, 6].includes(date.getDay()), ...dayChip(date) };
  });
});

function onKey(e: KeyboardEvent, index: number) {
  const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
  if (!delta) return;
  e.preventDefault();
  const next = items.value[(index + delta + items.value.length) % items.value.length];
  emit('update:modelValue', next.key);
  (e.currentTarget as HTMLElement).parentElement?.querySelector<HTMLElement>(`[data-key="${next.key}"]`)?.focus();
}
</script>

<template>
  <div
    role="tablist"
    aria-label="Дата сеансів"
    class="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0"
  >
    <button
      v-for="(d, i) in items"
      :key="d.key"
      role="tab"
      type="button"
      :data-key="d.key"
      :aria-selected="d.key === modelValue"
      :tabindex="d.key === modelValue ? 0 : -1"
      class="relative flex min-w-[68px] snap-start flex-col items-center rounded-md px-3 py-2.5 ring-1 ring-inset transition-all duration-200 ease-out"
      :class="
        d.key === modelValue
          ? 'bg-accent text-white ring-accent shadow-glow'
          : 'bg-surface text-text ring-text/[0.08] hover:-translate-y-0.5 hover:ring-accent/50'
      "
      @click="emit('update:modelValue', d.key)"
      @keydown="onKey($event, i)"
    >
      <span
        class="text-[11px] font-bold uppercase tracking-wider"
        :class="d.key === modelValue ? 'text-white' : d.weekend ? 'text-accent-text' : 'text-muted'"
        >{{ d.label }}</span
      >
      <span class="num text-xl leading-tight">{{ d.day }}</span>
      <span class="text-[11px]" :class="d.key === modelValue ? 'text-white' : 'text-muted'">{{ d.month }}</span>
      <span class="sr-only">, {{ d.full }}</span>
    </button>
  </div>
</template>
