<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { deleteSession, fetchAdminSessions, fetchMovies, updateSession } from '@/api/events';
import { fetchSections, fetchVenues } from '@/api/venues';
import { errorMessage } from '@/api/client';
import type { AdminEvent, Hall, Movie, Venue } from '@/api/types';
import { useToastStore } from '@/stores/toast';
import { useAsync } from '@/shared/composables/useAsync';
import { addDays, dayChip, dayKey, formatTime } from '@/shared/composables/useDateLabel';
import Badge from '@/shared/ui/Badge.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
import Icon from '@/shared/ui/Icon.vue';
import Modal from '@/shared/ui/Modal.vue';
import Skeleton from '@/shared/ui/Skeleton.vue';
import StateBlock from '@/shared/ui/StateBlock.vue';
import SessionForm from './SessionForm.vue';
import { startOfWeek, weekDays, weekLabel } from './week';

const toast = useToastStore();

const venues = ref<Venue[]>([]);
const halls = ref<Hall[]>([]);
const movies = ref<Movie[]>([]);
const venueId = ref('');
const monday = ref(startOfWeek(new Date()));
const view = ref<'table' | 'calendar'>('table');

const {
  data: sessions,
  loading,
  error,
  run,
  retry,
} = useAsync(() =>
  fetchAdminSessions({
    from: monday.value.toISOString(),
    to: addDays(monday.value, 7).toISOString(),
    venueId: venueId.value,
  }),
);

onMounted(async () => {
  try {
    [venues.value, movies.value] = await Promise.all([fetchVenues(), fetchMovies()]);
    venueId.value = venues.value[0]?.id ?? '';
  } catch (e) {
    toast.error(errorMessage(e));
  }
});

watch(venueId, async (id) => {
  if (!id) return;
  halls.value = await fetchSections(id).catch(() => []);
});
watch([venueId, monday], () => venueId.value && run());

const days = computed(() => weekDays(monday.value));
const byDay = computed(() =>
  days.value.map((d) => ({
    key: dayKey(d),
    chip: dayChip(d),
    sessions: (sessions.value ?? []).filter((s) => dayKey(s.startsAt) === dayKey(d)),
  })),
);

const stats = computed(() => {
  const list = sessions.value ?? [];
  return {
    total: list.length,
    drafts: list.filter((s) => s.status === 'DRAFT').length,
    fill: list.length ? Math.round((list.reduce((n, s) => n + s.sold / s.capacity, 0) / list.length) * 100) : 0,
  };
});

const fill = (s: AdminEvent) => Math.round((s.sold / s.capacity) * 100);

// --- календар ------------------------------------------------------------------

const DAY_START = 9 * 60;
const DAY_END = 25 * 60;
const PX_PER_MIN = 0.75;
const hours = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => 9 + i);

function block(s: AdminEvent) {
  const d = new Date(s.startsAt);
  const start = d.getHours() * 60 + d.getMinutes();
  const lane = Math.max(
    0,
    halls.value.findIndex((h) => h.id === s.section.id),
  );
  return {
    top: `${(start - DAY_START) * PX_PER_MIN}px`,
    height: `${Math.max(28, s.movie.durationMin * PX_PER_MIN)}px`,
    left: `calc(${(lane / Math.max(1, halls.value.length)) * 100}% + 2px)`,
    width: `calc(${100 / Math.max(1, halls.value.length)}% - 4px)`,
  };
}

// --- дії -------------------------------------------------------------------------

const formOpen = ref(false);
const editing = ref<AdminEvent | null>(null);
const toDelete = ref<AdminEvent | null>(null);
const busyId = ref<string | null>(null);

function openCreate() {
  editing.value = null;
  formOpen.value = true;
}

function openEdit(s: AdminEvent) {
  editing.value = s;
  formOpen.value = true;
}

function onSaved(s: AdminEvent) {
  formOpen.value = false;
  toast.success(editing.value ? 'Сеанс оновлено' : `Сеанс «${s.title}» створено`);
  run();
}

async function togglePublish(s: AdminEvent) {
  busyId.value = s.id;
  try {
    const next = s.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    await updateSession(s.id, { status: next });
    toast.success(next === 'PUBLISHED' ? 'Сеанс опубліковано' : 'Сеанс знято з публікації');
    run();
  } catch (e) {
    toast.error(errorMessage(e));
  } finally {
    busyId.value = null;
  }
}

async function confirmDelete() {
  const s = toDelete.value;
  if (!s) return;
  busyId.value = s.id;
  try {
    await deleteSession(s.id);
    toast.success('Сеанс видалено');
    run();
  } catch (e) {
    toast.error(errorMessage(e));
  } finally {
    busyId.value = null;
    toDelete.value = null;
  }
}

const defaultDate = computed(() => {
  const today = new Date();
  return dayKey(today >= monday.value && today < addDays(monday.value, 7) ? today : monday.value);
});
</script>

<template>
  <div class="mx-auto max-w-[1280px]">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-[28px]">Розклад сеансів</h1>
        <p class="mt-1 text-sm text-muted">
          {{ stats.total }} сеансів · {{ stats.drafts }} чернеток · середня заповненість {{ stats.fill }}%
        </p>
      </div>
      <BaseButton :disabled="!venueId || !movies.length || !halls.length" @click="openCreate">
        <Icon name="plus" :size="18" /> Новий сеанс
      </BaseButton>
    </div>

    <!-- панель фільтрів -->
    <div class="mt-6 flex flex-wrap items-center gap-3 rounded-lg bg-surface p-3 ring-1 ring-inset ring-text/[0.06]">
      <label class="flex items-center gap-2">
        <span class="sr-only">Кінотеатр</span>
        <select v-model="venueId" class="field h-10 w-auto py-0 text-sm">
          <option v-for="v in venues" :key="v.id" :value="v.id">{{ v.name }}</option>
        </select>
      </label>

      <div class="flex items-center gap-1">
        <button type="button" class="icon-btn" aria-label="Попередній тиждень" @click="monday = addDays(monday, -7)">
          <Icon name="chevron-left" :size="18" />
        </button>
        <span class="num min-w-[150px] text-center text-sm" aria-live="polite">{{ weekLabel(monday) }}</span>
        <button type="button" class="icon-btn" aria-label="Наступний тиждень" @click="monday = addDays(monday, 7)">
          <Icon name="chevron-right" :size="18" />
        </button>
        <BaseButton variant="ghost" size="sm" @click="monday = startOfWeek(new Date())">Цей тиждень</BaseButton>
      </div>

      <div role="tablist" aria-label="Вигляд" class="ml-auto inline-flex rounded-pill bg-raised p-1">
        <button
          v-for="v in [
            { key: 'table', label: 'Таблиця' },
            { key: 'calendar', label: 'Календар' },
          ] as const"
          :key="v.key"
          role="tab"
          type="button"
          :aria-selected="view === v.key"
          class="h-8 rounded-pill px-4 text-sm font-semibold transition-colors"
          :class="view === v.key ? 'bg-accent text-white' : 'text-muted hover:text-text'"
          @click="view = v.key"
        >
          {{ v.label }}
        </button>
      </div>
    </div>

    <div class="mt-6">
      <div v-if="loading && !sessions" class="space-y-2" aria-busy="true" aria-label="Завантаження розкладу">
        <Skeleton v-for="i in 8" :key="i" class="h-12" />
      </div>
      <StateBlock v-else-if="error" kind="error" title="Не вдалося завантажити розклад" :text="error" @retry="retry" />

      <!-- таблиця -->
      <div
        v-else-if="view === 'table'"
        class="overflow-x-auto rounded-lg bg-surface ring-1 ring-inset ring-text/[0.06]"
      >
        <table class="w-full min-w-[820px] text-left text-sm">
          <caption class="sr-only">
            Сеанси тижня
            {{
              weekLabel(monday)
            }}
          </caption>
          <thead class="border-b border-text/[0.08] text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" class="px-4 py-3 font-semibold">Час</th>
              <th scope="col" class="px-4 py-3 font-semibold">Фільм</th>
              <th scope="col" class="px-4 py-3 font-semibold">Зал</th>
              <th scope="col" class="px-4 py-3 font-semibold">Заповненість</th>
              <th scope="col" class="px-4 py-3 font-semibold">Статус</th>
              <th scope="col" class="px-4 py-3 text-right font-semibold"><span class="sr-only">Дії</span></th>
            </tr>
          </thead>
          <template v-for="d in byDay" :key="d.key">
            <tbody>
              <tr class="bg-raised/60">
                <th
                  colspan="6"
                  scope="colgroup"
                  class="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-text/80"
                >
                  {{ d.chip.full }}
                  <span class="ml-2 font-semibold normal-case text-muted">{{ d.sessions.length }} сеансів</span>
                </th>
              </tr>
              <tr v-if="!d.sessions.length">
                <td colspan="6" class="px-4 py-3 text-muted">Сеансів немає</td>
              </tr>
              <tr
                v-for="s in d.sessions"
                :key="s.id"
                class="border-t border-text/[0.04] transition-colors hover:bg-text/[0.02]"
                :class="s.status === 'DRAFT' && 'text-text/70'"
              >
                <td class="num px-4 py-2.5">{{ formatTime(s.startsAt) }}</td>
                <td class="px-4 py-2.5">
                  <span class="font-semibold">{{ s.title }}</span>
                  <span class="ml-2 text-xs text-muted">{{ s.movie.ageRating }}</span>
                </td>
                <td class="px-4 py-2.5">
                  {{ s.section.name }}
                  <span
                    class="ml-1 text-xs font-bold"
                    :class="s.section.format === 'IMAX' ? 'text-gold' : 'text-muted'"
                    >{{ s.section.format }}</span
                  >
                </td>
                <td class="px-4 py-2.5">
                  <div class="flex items-center gap-3">
                    <div
                      class="h-1.5 w-28 overflow-hidden rounded-full bg-text/10"
                      role="progressbar"
                      :aria-valuenow="fill(s)"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      :aria-label="`Заповненість ${fill(s)}%`"
                    >
                      <div class="h-full rounded-full bg-accent" :style="{ width: `${fill(s)}%` }" />
                    </div>
                    <span class="num w-24 text-xs text-muted">{{ s.sold }}/{{ s.capacity }}</span>
                  </div>
                </td>
                <td class="px-4 py-2.5">
                  <Badge :tone="s.status === 'PUBLISHED' ? 'success' : 'neutral'">
                    {{ s.status === 'PUBLISHED' ? 'В афіші' : 'Чернетка' }}
                  </Badge>
                </td>
                <td class="px-4 py-2.5">
                  <div class="flex justify-end gap-1">
                    <RouterLink
                      :to="{ name: 'admin-sales', params: { id: s.id } }"
                      class="icon-btn"
                      :aria-label="`Продажі: ${s.title}, ${formatTime(s.startsAt)}`"
                    >
                      <Icon name="chart" :size="17" />
                    </RouterLink>
                    <button
                      type="button"
                      class="icon-btn"
                      :disabled="busyId === s.id"
                      :aria-label="
                        s.status === 'PUBLISHED' ? `Зняти з публікації: ${s.title}` : `Опублікувати: ${s.title}`
                      "
                      @click="togglePublish(s)"
                    >
                      <Icon :name="s.status === 'PUBLISHED' ? 'eye-off' : 'eye'" :size="17" />
                    </button>
                    <button type="button" class="icon-btn" :aria-label="`Редагувати: ${s.title}`" @click="openEdit(s)">
                      <Icon name="edit" :size="17" />
                    </button>
                    <button
                      type="button"
                      class="icon-btn hover:!text-danger"
                      :aria-label="`Видалити: ${s.title}`"
                      @click="toDelete = s"
                    >
                      <Icon name="trash" :size="17" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </template>
        </table>
      </div>

      <!-- календар -->
      <div v-else class="overflow-x-auto rounded-lg bg-surface p-3 ring-1 ring-inset ring-text/[0.06]">
        <div class="grid min-w-[980px] grid-cols-[48px_repeat(7,1fr)]">
          <div />
          <div v-for="d in byDay" :key="d.key" class="px-1 pb-2 text-center">
            <p
              class="text-[11px] font-bold uppercase tracking-wider"
              :class="d.chip.label === 'Сьогодні' ? 'text-accent-text' : 'text-muted'"
            >
              {{ d.chip.label }}
            </p>
            <p class="num text-lg">{{ d.chip.day }}</p>
            <p class="mt-1 flex justify-center gap-1 text-[10px] text-muted" aria-hidden="true">
              <span v-for="h in halls" :key="h.id" class="flex-1 truncate">{{ h.name }}</span>
            </p>
          </div>

          <div class="relative" :style="{ height: `${(DAY_END - DAY_START) * PX_PER_MIN}px` }" aria-hidden="true">
            <span
              v-for="h in hours"
              :key="h"
              class="num absolute right-2 -translate-y-1/2 text-[11px] font-semibold text-muted"
              :style="{ top: `${(h * 60 - DAY_START) * PX_PER_MIN}px` }"
              >{{ String(h % 24).padStart(2, '0') }}:00</span
            >
          </div>
          <div
            v-for="d in byDay"
            :key="d.key"
            class="relative border-l border-text/[0.06]"
            :style="{ height: `${(DAY_END - DAY_START) * PX_PER_MIN}px` }"
          >
            <div
              v-for="h in hours"
              :key="h"
              class="absolute inset-x-0 border-t border-text/[0.04]"
              :style="{ top: `${(h * 60 - DAY_START) * PX_PER_MIN}px` }"
              aria-hidden="true"
            />
            <button
              v-for="s in d.sessions"
              :key="s.id"
              type="button"
              class="absolute overflow-hidden rounded-sm px-1.5 py-1 text-left text-[11px] leading-tight transition-transform duration-200 hover:z-10 hover:scale-[1.03]"
              :class="
                s.status === 'DRAFT'
                  ? 'border border-dashed border-text/30 bg-raised'
                  : 'bg-accent-dark/80 ring-1 ring-inset ring-accent/50'
              "
              :style="block(s)"
              :aria-label="`${formatTime(s.startsAt)} ${s.title}, ${s.section.name}${s.status === 'DRAFT' ? ', чернетка' : ''}. Редагувати`"
              @click="openEdit(s)"
            >
              <span class="num block">{{ formatTime(s.startsAt) }}</span>
              <span class="block font-semibold">{{ s.title }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <SessionForm
      :open="formOpen"
      :session="editing"
      :movies="movies"
      :venues="venues"
      :halls="halls"
      :default-venue-id="venueId"
      :default-date="defaultDate"
      @close="formOpen = false"
      @saved="onSaved"
    />

    <Modal :open="!!toDelete" title="Видалити сеанс?" @close="toDelete = null">
      <p v-if="toDelete" class="text-text/80">
        «{{ toDelete.title }}», {{ formatTime(toDelete.startsAt) }}, {{ toDelete.section.name }}. Якщо на сеанс уже
        продані квитки, його можна лише зняти з публікації.
      </p>
      <template #actions>
        <BaseButton variant="secondary" data-autofocus @click="toDelete = null">Скасувати</BaseButton>
        <BaseButton :loading="busyId === toDelete?.id" @click="confirmDelete">Видалити</BaseButton>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.icon-btn {
  display: grid;
  place-items: center;
  height: 34px;
  width: 34px;
  border-radius: var(--r-sm);
  color: rgb(var(--c-text-muted));
  transition:
    background-color 200ms var(--ease-out),
    color 200ms var(--ease-out);
}
.icon-btn:hover {
  background: rgb(var(--c-text) / 0.06);
  color: rgb(var(--c-text));
}
.icon-btn:disabled {
  opacity: 0.4;
}
</style>
