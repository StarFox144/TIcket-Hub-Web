<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import Icon from './Icon.vue';

const props = withDefaults(defineProps<{ open: boolean; title: string; dismissible?: boolean }>(), {
  dismissible: true,
});
const emit = defineEmits<{ close: [] }>();

const titleId = useId();
const panel = ref<HTMLElement | null>(null);
let restoreFocus: HTMLElement | null = null;

function close() {
  if (props.dismissible) emit('close');
}

function trapTab(e: KeyboardEvent) {
  if (e.key === 'Escape') return close();
  if (e.key !== 'Tab' || !panel.value) return;
  const focusables = panel.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      restoreFocus = document.activeElement as HTMLElement | null;
      document.body.style.overflow = 'hidden';
      await nextTick();
      panel.value?.querySelector<HTMLElement>('[data-autofocus], button, a[href]')?.focus();
    } else {
      document.body.style.overflow = '';
      restoreFocus?.focus();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => (document.body.style.overflow = ''));
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" @keydown="trapTab">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" @click="close" />
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          class="modal-panel relative w-full max-w-md rounded-lg bg-raised p-6 shadow-card ring-1 ring-inset ring-text/10"
        >
          <div class="mb-3 flex items-start justify-between gap-4">
            <h2 :id="titleId" class="text-[22px]">{{ title }}</h2>
            <button
              v-if="dismissible"
              type="button"
              class="-mr-2 -mt-1 rounded-sm p-2 text-muted transition-colors hover:text-text"
              aria-label="Закрити"
              @click="close"
            >
              <Icon name="x" />
            </button>
          </div>
          <slot />
          <div v-if="$slots.actions" class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <slot name="actions" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 250ms var(--ease-out);
}
.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform 250ms var(--ease-out);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  transform: translateY(16px) scale(0.98);
}
</style>
