<script setup lang="ts">
import Icon from '@/shared/ui/Icon.vue';

defineProps<{ current: 1 | 2 | 3 }>();
const steps = ['Місця', 'Оплата', 'Квиток'];
</script>

<template>
  <nav aria-label="Етапи оформлення">
    <ol class="flex items-center gap-2 text-sm md:gap-3">
      <li v-for="(label, i) in steps" :key="label" class="flex items-center gap-2 md:gap-3">
        <span
          class="flex items-center gap-2 font-semibold"
          :class="i + 1 <= current ? 'text-text' : 'text-muted'"
          :aria-current="i + 1 === current ? 'step' : undefined"
        >
          <span
            class="grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-all duration-300"
            :class="
              i + 1 < current
                ? 'bg-accent-dark text-white'
                : i + 1 === current
                  ? 'bg-accent text-white shadow-glow-sm'
                  : 'bg-raised text-muted ring-1 ring-inset ring-text/10'
            "
          >
            <Icon v-if="i + 1 < current" name="check" :size="14" />
            <template v-else>{{ i + 1 }}</template>
          </span>
          {{ label }}
          <span v-if="i + 1 < current" class="sr-only">(завершено)</span>
        </span>
        <span
          v-if="i < steps.length - 1"
          class="h-px w-6 md:w-12"
          :class="i + 1 < current ? 'bg-accent' : 'bg-text/15'"
          aria-hidden="true"
        />
      </li>
    </ol>
  </nav>
</template>
