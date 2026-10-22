<script setup lang="ts">
import BaseButton from './BaseButton.vue';
import Icon, { type IconName } from './Icon.vue';

/** Порожній стан або помилка з кнопкою «Спробувати ще». */
withDefaults(defineProps<{ kind?: 'empty' | 'error'; title: string; text?: string; icon?: IconName }>(), {
  kind: 'empty',
  icon: 'film',
});
defineEmits<{ retry: [] }>();
</script>

<template>
  <div
    class="flex flex-col items-center rounded-lg bg-surface px-6 py-14 text-center ring-1 ring-inset ring-text/[0.06]"
    :role="kind === 'error' ? 'alert' : undefined"
  >
    <div
      class="mb-5 grid h-16 w-16 place-items-center rounded-full"
      :class="kind === 'error' ? 'bg-accent/15 text-danger' : 'bg-text/5 text-muted'"
    >
      <Icon :name="kind === 'error' ? 'info' : icon" :size="28" />
    </div>
    <h3 class="font-display text-xl">{{ title }}</h3>
    <p v-if="text" class="mt-2 max-w-sm text-sm text-muted">{{ text }}</p>
    <div class="mt-6 flex gap-3">
      <BaseButton v-if="kind === 'error'" variant="secondary" @click="$emit('retry')">Спробувати ще</BaseButton>
      <slot />
    </div>
  </div>
</template>
