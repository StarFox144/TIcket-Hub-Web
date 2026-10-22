import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const CITIES = ['Київ', 'Львів', 'Одеса'] as const;
const KEY = 'tickethub:city';

export const useCityStore = defineStore('city', () => {
  const stored = localStorage.getItem(KEY);
  const city = ref<string>(stored && (CITIES as readonly string[]).includes(stored) ? stored : CITIES[0]);
  watch(city, (value) => localStorage.setItem(KEY, value));
  return { city };
});
