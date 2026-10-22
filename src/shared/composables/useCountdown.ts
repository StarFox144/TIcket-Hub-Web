import { computed, onScopeDispose, ref, toValue, type MaybeRefOrGetter } from 'vue';

/**
 * Зворотний відлік до expiresAt із сервера. Час рахується від серверної мітки,
 * а не від відкриття сторінки, тож перезавантаження не «подовжує» резерв.
 */
export function useCountdown(expiresAt: MaybeRefOrGetter<string | undefined>) {
  const now = ref(Date.now());
  const timer = setInterval(() => (now.value = Date.now()), 1000);
  onScopeDispose(() => clearInterval(timer));

  const left = computed(() => {
    const target = toValue(expiresAt);
    return target ? Math.max(0, Date.parse(target) - now.value) : 0;
  });

  const label = computed(() => {
    const s = Math.ceil(left.value / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  });

  const expired = computed(() => !!toValue(expiresAt) && left.value === 0);

  return { left, label, expired };
}
