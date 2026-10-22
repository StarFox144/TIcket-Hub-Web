<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { fetchSections, fetchVenues, saveSectionLayout } from '@/api/venues';
import { errorMessage } from '@/api/client';
import type { EventSeat, HallLayout, Section, Venue } from '@/api/types';
import { useToastStore } from '@/stores/toast';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import Badge from '@/shared/ui/Badge.vue';
import Icon from '@/shared/ui/Icon.vue';
import Skeleton from '@/shared/ui/Skeleton.vue';
import MiniHallMap from './MiniHallMap.vue';

const toast = useToastStore();
const venues = ref<Venue[]>([]);
const venueId = ref('');
const sections = ref<Section[]>([]);
const sectionId = ref('');
const loading = ref(true);
const saving = ref(false);

const layout = reactive<HallLayout>({
  rows: 10,
  seatsPerRow: 14,
  comfortRows: [5, 8],
  comfortSeats: [5, 10],
  loveRow: true,
});
const comfortOn = ref(true);

onMounted(async () => {
  try {
    venues.value = await fetchVenues();
    venueId.value = venues.value[0]?.id ?? '';
  } catch (e) {
    toast.error(errorMessage(e));
  }
});

watch(venueId, async (id) => {
  if (!id) return;
  loading.value = true;
  try {
    sections.value = await fetchSections(id);
    sectionId.value = sections.value[0]?.id ?? '';
  } finally {
    loading.value = false;
  }
});

const section = computed(() => sections.value.find((s) => s.id === sectionId.value));

watch(section, (s) => {
  if (!s) return;
  Object.assign(layout, JSON.parse(JSON.stringify(s.layout)) as HallLayout);
  comfortOn.value = !!s.layout.comfortRows;
  if (!s.layout.comfortRows) layout.comfortRows = [Math.ceil(s.layout.rows / 2), s.layout.rows - 2];
});

// Love Seat — диван на два місця, тож ширина залу має бути парною.
watch(
  () => layout.loveRow,
  (on) => on && layout.seatsPerRow % 2 && (layout.seatsPerRow += 1),
);

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(v) || min));

/** Попередній перегляд будується тим самим правилом, що й місця на бекенді. */
const preview = computed<Pick<EventSeat, 'id' | 'row' | 'number' | 'zone' | 'status'>[]>(() => {
  const seats: Pick<EventSeat, 'id' | 'row' | 'number' | 'zone' | 'status'>[] = [];
  const [r1, r2] = comfortOn.value && layout.comfortRows ? layout.comfortRows : [0, -1];
  const [s1, s2] = layout.comfortSeats;
  for (let row = 1; row <= layout.rows; row++) {
    const love = layout.loveRow && row === layout.rows;
    const count = love ? Math.floor(layout.seatsPerRow / 2) : layout.seatsPerRow;
    for (let number = 1; number <= count; number++) {
      const zone = love ? 'LOVE' : row >= r1 && row <= r2 && number >= s1 && number <= s2 ? 'COMFORT' : 'STANDARD';
      seats.push({ id: `${row}-${number}`, row, number, zone, status: 'FREE' });
    }
  }
  return seats;
});

const capacity = computed(() => {
  const by = { STANDARD: 0, COMFORT: 0, LOVE: 0 };
  for (const s of preview.value) by[s.zone] += s.zone === 'LOVE' ? 2 : 1;
  return { ...by, total: by.STANDARD + by.COMFORT + by.LOVE };
});

async function save() {
  if (!section.value) return;
  const body: HallLayout = {
    rows: clamp(layout.rows, 3, 30),
    seatsPerRow: clamp(layout.seatsPerRow, 4, 40),
    comfortRows: comfortOn.value && layout.comfortRows ? [...layout.comfortRows] : null,
    comfortSeats: [...layout.comfortSeats],
    loveRow: layout.loveRow,
  };
  saving.value = true;
  try {
    const saved = await saveSectionLayout(venueId.value, section.value.id, body);
    sections.value = sections.value.map((s) => (s.id === saved.id ? saved : s));
    toast.success(`Схему «${saved.name}» збережено. Діє для сеансів без продажів.`);
  } catch (e) {
    toast.error(errorMessage(e, 'Не вдалося зберегти схему'));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1280px]">
    <h1 class="text-[28px]">Кінотеатри та зали</h1>
    <p class="mt-1 text-sm text-muted">
      Генератор схеми: задайте ряди, ширину та зони — карта місць побудується автоматично.
    </p>

    <div class="mt-6 flex flex-wrap items-center gap-3">
      <label>
        <span class="sr-only">Кінотеатр</span>
        <select v-model="venueId" class="field h-10 w-auto py-0 text-sm">
          <option v-for="v in venues" :key="v.id" :value="v.id">{{ v.name }} · {{ v.city }}</option>
        </select>
      </label>
      <div
        role="tablist"
        aria-label="Зал"
        class="inline-flex rounded-pill bg-surface p-1 ring-1 ring-inset ring-text/[0.06]"
      >
        <button
          v-for="s in sections"
          :key="s.id"
          role="tab"
          type="button"
          :aria-selected="s.id === sectionId"
          class="h-8 rounded-pill px-4 text-sm font-semibold transition-colors"
          :class="s.id === sectionId ? 'bg-accent text-white' : 'text-muted hover:text-text'"
          @click="sectionId = s.id"
        >
          {{ s.name }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]" aria-busy="true">
      <Skeleton class="h-96" rounded="rounded-lg" /><Skeleton class="h-96" rounded="rounded-lg" />
    </div>

    <div v-else-if="section" class="mt-6 grid items-start gap-6 lg:grid-cols-[360px_1fr]">
      <BaseCard as="form" class="space-y-5" aria-label="Параметри схеми" @submit.prevent="save">
        <div class="flex items-center justify-between">
          <h2 class="text-xl">{{ section.name }}</h2>
          <Badge :tone="section.format === 'IMAX' ? 'gold' : 'neutral'">{{ section.format }}</Badge>
        </div>

        <div>
          <label for="h-rows" class="label flex justify-between"
            >Ряди <span class="num text-text">{{ layout.rows }}</span></label
          >
          <input
            id="h-rows"
            v-model.number="layout.rows"
            type="range"
            min="3"
            max="20"
            class="w-full accent-[#C8102E]"
          />
        </div>
        <div>
          <label for="h-seats" class="label flex justify-between"
            >Місць у ряду <span class="num text-text">{{ layout.seatsPerRow }}</span></label
          >
          <input
            id="h-seats"
            v-model.number="layout.seatsPerRow"
            type="range"
            min="6"
            max="24"
            :step="layout.loveRow ? 2 : 1"
            class="w-full accent-[#C8102E]"
          />
        </div>

        <fieldset class="space-y-3 rounded-md bg-raised/60 p-4">
          <legend class="sr-only">Зона «Комфорт»</legend>
          <label class="flex items-center gap-3 text-sm font-semibold">
            <input v-model="comfortOn" type="checkbox" class="h-4 w-4 accent-[#C8102E]" /> Зона «Комфорт»
          </label>
          <div v-if="comfortOn && layout.comfortRows" class="grid grid-cols-2 gap-3">
            <label class="text-xs text-muted"
              >Ряди від
              <input
                v-model.number="layout.comfortRows[0]"
                type="number"
                min="1"
                :max="layout.rows"
                class="field mt-1 py-2"
              />
            </label>
            <label class="text-xs text-muted"
              >до
              <input
                v-model.number="layout.comfortRows[1]"
                type="number"
                :min="layout.comfortRows[0]"
                :max="layout.rows"
                class="field mt-1 py-2"
              />
            </label>
            <label class="text-xs text-muted"
              >Місця від
              <input
                v-model.number="layout.comfortSeats[0]"
                type="number"
                min="1"
                :max="layout.seatsPerRow"
                class="field mt-1 py-2"
              />
            </label>
            <label class="text-xs text-muted"
              >до
              <input
                v-model.number="layout.comfortSeats[1]"
                type="number"
                :min="layout.comfortSeats[0]"
                :max="layout.seatsPerRow"
                class="field mt-1 py-2"
              />
            </label>
          </div>
        </fieldset>

        <label class="flex items-center gap-3 rounded-md bg-raised/60 p-4 text-sm font-semibold">
          <input v-model="layout.loveRow" type="checkbox" class="h-4 w-4 accent-[#C8102E]" />
          Останній ряд — Love Seat
        </label>

        <BaseButton type="submit" block :loading="saving"><Icon name="check" :size="18" /> Зберегти схему</BaseButton>
      </BaseCard>

      <BaseCard as="section" aria-labelledby="preview-title">
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="preview-title" class="text-xl">Попередній перегляд</h2>
          <p class="text-sm text-muted">
            <span class="num text-text">{{ capacity.total }}</span> місць · стандарт {{ capacity.STANDARD }} · комфорт
            {{ capacity.COMFORT }} · love {{ capacity.LOVE }}
          </p>
        </div>
        <div class="mt-8">
          <MiniHallMap :seats="preview" />
        </div>
        <ul class="mt-6 flex flex-wrap justify-center gap-4 text-xs text-muted" aria-label="Легенда">
          <li class="flex items-center gap-1.5"><span class="h-2.5 w-3 rounded-sm bg-seat-free" /> Стандарт</li>
          <li class="flex items-center gap-1.5"><span class="h-2.5 w-3 rounded-sm bg-seat-comfort" /> Комфорт</li>
          <li class="flex items-center gap-1.5">
            <span class="h-2.5 w-5 rounded-sm ring-1 ring-inset ring-gold/70" /> Love Seat
          </li>
        </ul>
      </BaseCard>
    </div>
  </div>
</template>
