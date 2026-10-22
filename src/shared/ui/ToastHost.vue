<script setup lang="ts">
import { useToastStore } from '@/stores/toast';
import Icon from './Icon.vue';

const toast = useToastStore();
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4"
    style="bottom: calc(var(--bottom-nav-h) + 16px)"
    aria-live="polite"
    aria-atomic="false"
  >
    <TransitionGroup name="toast">
      <div
        v-for="t in toast.items"
        :key="t.id"
        :role="t.tone === 'error' ? 'alert' : 'status'"
        class="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-md bg-raised px-4 py-3 text-sm shadow-card ring-1 ring-inset"
        :class="{
          'ring-text/10': t.tone === 'info',
          'ring-success/40': t.tone === 'success',
          'ring-danger/50': t.tone === 'error',
        }"
      >
        <span
          class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
          :class="{
            'bg-muted': t.tone === 'info',
            'bg-success': t.tone === 'success',
            'bg-danger': t.tone === 'error',
          }"
          aria-hidden="true"
        />
        <p class="flex-1 leading-snug">{{ t.message }}</p>
        <button
          type="button"
          class="-my-1 -mr-2 rounded-sm p-1 text-muted hover:text-text"
          aria-label="Закрити сповіщення"
          @click="toast.dismiss(t.id)"
        >
          <Icon name="x" :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
@media (min-width: 768px) {
  div[aria-live] {
    bottom: 24px !important;
  }
}
.toast-enter-active,
.toast-leave-active {
  transition: all 250ms var(--ease-out);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
