import { ref, shallowRef } from 'vue';
import { errorMessage } from '@/api/client';

/**
 * Три стани кожного запиту: завантаження, помилка, дані.
 * `silent` оновлює дані у фоні без skeleton (для polling).
 */
export function useAsync<T, A extends unknown[] = []>(fn: (...args: A) => Promise<T>) {
  const data = shallowRef<T | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  let lastArgs: A | null = null;
  let seq = 0;

  async function run(...args: A) {
    lastArgs = args;
    const id = ++seq;
    loading.value = true;
    error.value = null;
    try {
      const result = await fn(...args);
      if (id === seq) data.value = result;
      return result;
    } catch (e) {
      if (id === seq) error.value = errorMessage(e);
      return null;
    } finally {
      if (id === seq) loading.value = false;
    }
  }

  async function silent(...args: A) {
    try {
      const result = await fn(...args);
      data.value = result;
      return result;
    } catch {
      return null;
    }
  }

  const retry = () => (lastArgs ? run(...lastArgs) : null);

  return { data, loading, error, run, silent, retry };
}
