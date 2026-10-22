<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { fetchVenues } from '@/api/venues';
import { useCityStore } from '@/stores/city';
import { useAsync } from '@/shared/composables/useAsync';
import BaseCard from '@/shared/ui/BaseCard.vue';
import Badge from '@/shared/ui/Badge.vue';
import Icon from '@/shared/ui/Icon.vue';
import Skeleton from '@/shared/ui/Skeleton.vue';
import StateBlock from '@/shared/ui/StateBlock.vue';

const cityStore = useCityStore();
const { data, loading, error, run, retry } = useAsync(fetchVenues);
onMounted(run);

const byCity = computed(() => {
  const map = new Map<string, NonNullable<typeof data.value>>();
  for (const v of data.value ?? []) map.set(v.city, [...(map.get(v.city) ?? []), v]);
  // місто користувача — першим
  return [...map.entries()].sort(([a], [b]) => Number(b === cityStore.city) - Number(a === cityStore.city));
});
</script>

<template>
  <section class="container-page py-10" aria-labelledby="cinemas-title">
    <h1 id="cinemas-title">Кінотеатри</h1>
    <p class="mt-2 text-muted">Зали 2D, 3D та IMAX з кріслами «Комфорт» і диванами Love Seat.</p>

    <div v-if="loading && !data" class="mt-8 grid gap-4 md:grid-cols-2" aria-hidden="true">
      <Skeleton v-for="i in 4" :key="i" class="h-32" rounded="rounded-lg" />
    </div>
    <StateBlock
      v-else-if="error"
      class="mt-8"
      kind="error"
      title="Не вдалося завантажити"
      :text="error"
      @retry="retry"
    />
    <div v-else class="mt-8 space-y-10">
      <div v-for="[city, venues] in byCity" :key="city">
        <h2 class="flex items-center gap-3">
          {{ city }}
          <Badge v-if="city === cityStore.city" tone="accent">Ваше місто</Badge>
        </h2>
        <ul class="mt-4 grid gap-4 md:grid-cols-2">
          <li v-for="v in venues" :key="v.id">
            <BaseCard class="flex h-full items-start gap-4 transition-colors hover:bg-raised">
              <div class="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-accent/15 text-accent-hover">
                <Icon name="film" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg">{{ v.name }}</h3>
                <p class="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <Icon name="pin" :size="14" /> {{ v.address }}
                </p>
                <div class="mt-3 flex flex-wrap gap-1.5">
                  <Badge>Зал 1 · 2D</Badge>
                  <Badge>Зал 2 · 3D</Badge>
                  <Badge tone="gold">IMAX</Badge>
                </div>
                <button
                  v-if="city !== cityStore.city"
                  type="button"
                  class="mt-4 text-sm font-semibold text-accent-text hover:underline"
                  @click="cityStore.city = city"
                >
                  Обрати {{ city }}
                </button>
              </div>
            </BaseCard>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
