<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { createSession, updateSession } from '@/api/events';
import { errorMessage } from '@/api/client';
import type { AdminEvent, Hall, Movie, Venue } from '@/api/types';
import { formatDuration } from '@/shared/composables/useDateLabel';
import BaseButton from '@/shared/ui/BaseButton.vue';
import Modal from '@/shared/ui/Modal.vue';
import { fromInputs, toDateInput, toTimeInput } from './week';

const props = defineProps<{
  open: boolean;
  /** null — створення нового сеансу. */
  session: AdminEvent | null;
  movies: Movie[];
  venues: Venue[];
  halls: Hall[];
  defaultVenueId: string;
  defaultDate: string;
}>();
const emit = defineEmits<{ close: []; saved: [AdminEvent] }>();

const form = reactive({ movieSlug: '', venueId: '', sectionId: '', date: '', time: '', publish: false });
const errors = reactive({ movieSlug: '', sectionId: '', date: '', time: '' });
const formError = ref('');
const saving = ref(false);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    const s = props.session;
    Object.assign(form, {
      movieSlug: s?.movie.slug ?? '',
      venueId: s?.venue.id ?? props.defaultVenueId,
      sectionId: s?.section.id ?? props.halls[0]?.id ?? '',
      date: s ? toDateInput(s.startsAt) : props.defaultDate,
      time: s ? toTimeInput(s.startsAt) : '19:00',
      publish: s ? s.status === 'PUBLISHED' : false,
    });
    Object.assign(errors, { movieSlug: '', sectionId: '', date: '', time: '' });
    formError.value = '';
  },
  { immediate: true },
);

// Довідники можуть довантажитися вже після відкриття форми.
watch(
  () => [props.defaultVenueId, props.halls] as const,
  ([venueId, halls]) => {
    if (!form.venueId) form.venueId = venueId;
    if (!form.sectionId || !halls.some((h) => h.id === form.sectionId)) form.sectionId = halls[0]?.id ?? '';
  },
);

const movie = computed(() => props.movies.find((m) => m.slug === form.movieSlug));
const endsAt = computed(() => {
  if (!movie.value || !form.date || !form.time) return null;
  const end = new Date(fromInputs(form.date, form.time).getTime() + movie.value.durationMin * 60_000);
  return toTimeInput(end);
});

function validate() {
  errors.movieSlug = form.movieSlug ? '' : 'Оберіть фільм';
  errors.sectionId = form.sectionId ? '' : 'Оберіть зал';
  errors.date = form.date ? '' : 'Вкажіть дату';
  errors.time = /^\d{2}:\d{2}$/.test(form.time) ? '' : 'Вкажіть час';
  if (!errors.date && !errors.time && fromInputs(form.date, form.time).getTime() < Date.now()) {
    errors.time = 'Сеанс не може починатися в минулому';
  }
  return Object.values(errors).every((e) => !e);
}

async function submit() {
  formError.value = '';
  if (!validate()) return;
  saving.value = true;
  const body = {
    movieSlug: form.movieSlug,
    venueId: form.venueId,
    sectionId: form.sectionId,
    startsAt: fromInputs(form.date, form.time).toISOString(),
    status: form.publish ? ('PUBLISHED' as const) : ('DRAFT' as const),
  };
  try {
    const saved = props.session ? await updateSession(props.session.id, body) : await createSession(body);
    emit('saved', saved);
  } catch (e) {
    formError.value = errorMessage(e, 'Не вдалося зберегти сеанс');
  } finally {
    saving.value = false;
  }
}

/** Згенеровані розкладом сеанси можна лише переносити в часі. */
const locked = computed(() => !!props.session && !props.session.id.startsWith('custom-'));
</script>

<template>
  <Modal :open="open" :title="session ? 'Редагувати сеанс' : 'Новий сеанс'" @close="emit('close')">
    <form id="session-form" class="space-y-4" novalidate @submit.prevent="submit">
      <div>
        <label for="sf-movie" class="label">Фільм</label>
        <select
          id="sf-movie"
          v-model="form.movieSlug"
          class="field"
          :disabled="locked"
          :aria-invalid="!!errors.movieSlug"
        >
          <option value="" disabled>Оберіть фільм</option>
          <option v-for="m in movies" :key="m.slug" :value="m.slug">
            {{ m.title }} · {{ formatDuration(m.durationMin) }}
          </option>
        </select>
        <p v-if="errors.movieSlug" class="mt-1 text-sm text-danger">{{ errors.movieSlug }}</p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="sf-venue" class="label">Кінотеатр</label>
          <select id="sf-venue" v-model="form.venueId" class="field" :disabled="locked">
            <option v-for="v in venues" :key="v.id" :value="v.id">{{ v.name }}</option>
          </select>
        </div>
        <div>
          <label for="sf-hall" class="label">Зал</label>
          <select
            id="sf-hall"
            v-model="form.sectionId"
            class="field"
            :disabled="locked"
            :aria-invalid="!!errors.sectionId"
          >
            <option v-for="h in halls" :key="h.id" :value="h.id">{{ h.name }} · {{ h.format }}</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="sf-date" class="label">Дата</label>
          <input id="sf-date" v-model="form.date" type="date" class="field" :aria-invalid="!!errors.date" />
          <p v-if="errors.date" class="mt-1 text-sm text-danger">{{ errors.date }}</p>
        </div>
        <div>
          <label for="sf-time" class="label">Початок</label>
          <input id="sf-time" v-model="form.time" type="time" step="300" class="field" :aria-invalid="!!errors.time" />
          <p v-if="errors.time" class="mt-1 text-sm text-danger">{{ errors.time }}</p>
          <p v-else-if="endsAt" class="mt-1 text-xs text-muted">Закінчиться о {{ endsAt }}</p>
        </div>
      </div>

      <label
        class="flex cursor-pointer items-center gap-3 rounded-md bg-surface px-4 py-3 ring-1 ring-inset ring-text/[0.06]"
      >
        <input v-model="form.publish" type="checkbox" class="h-4 w-4 accent-[#C8102E]" />
        <span>
          <span class="block text-sm font-semibold">Опублікувати одразу</span>
          <span class="block text-xs text-muted">Інакше сеанс збережеться як чернетка й не з’явиться в афіші.</span>
        </span>
      </label>

      <p v-if="formError" role="alert" class="rounded-sm bg-accent/15 px-4 py-3 text-sm text-danger">{{ formError }}</p>
    </form>
    <template #actions>
      <BaseButton variant="secondary" @click="emit('close')">Скасувати</BaseButton>
      <BaseButton type="submit" form="session-form" :loading="saving">{{
        session ? 'Зберегти' : 'Створити'
      }}</BaseButton>
    </template>
  </Modal>
</template>
