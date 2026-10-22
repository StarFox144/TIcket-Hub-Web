import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

let nextId = 1;

export const useToastStore = defineStore('toast', () => {
  const items = ref<ToastItem[]>([]);

  function dismiss(id: number) {
    items.value = items.value.filter((t) => t.id !== id);
  }

  function show(message: string, tone: ToastTone = 'info', timeout = 4500) {
    const id = nextId++;
    items.value = [...items.value.slice(-2), { id, message, tone }];
    if (timeout) setTimeout(() => dismiss(id), timeout);
    return id;
  }

  return {
    items,
    dismiss,
    show,
    info: (m: string) => show(m, 'info'),
    success: (m: string) => show(m, 'success'),
    error: (m: string) => show(m, 'error', 6000),
  };
});
