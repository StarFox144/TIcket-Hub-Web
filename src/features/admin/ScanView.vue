<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, ref } from 'vue';
import { scanTicket } from '@/api/tickets';
import { errorMessage } from '@/api/client';
import type { ScanResult } from '@/api/types';
import { formatSession, formatTime } from '@/shared/composables/useDateLabel';
import BaseButton from '@/shared/ui/BaseButton.vue';
import Icon from '@/shared/ui/Icon.vue';

// Сканер важкий (детектор штрихкодів), тож вантажиться лише на цій сторінці.
const QrcodeStream = defineAsyncComponent(() => import('vue-qrcode-reader').then((m) => m.QrcodeStream));

const RESULT_MS = 2500;

const cameraError = ref('');
const cameraOn = ref(false);
const checking = ref(false);
const result = ref<ScanResult | null>(null);
const manual = ref('');
const history = ref<(ScanResult & { at: string })[]>([]);
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let lastCode = '';

async function check(code: string) {
  const value = code.trim();
  if (!value || checking.value || result.value) return;
  checking.value = true;
  try {
    const res = await scanTicket(value);
    show(res);
  } catch (e) {
    show({ valid: false, message: errorMessage(e, 'Не вдалося перевірити квиток') });
  } finally {
    checking.value = false;
  }
}

function show(res: ScanResult) {
  result.value = res;
  history.value = [{ ...res, at: new Date().toISOString() }, ...history.value].slice(0, 20);
  navigator.vibrate?.(res.valid ? 80 : [60, 60, 60]);
  clearTimeout(hideTimer);
  hideTimer = setTimeout(next, RESULT_MS);
}

function next() {
  clearTimeout(hideTimer);
  result.value = null;
  // той самий код одразу після показу не перевіряємо вдруге
  setTimeout(() => (lastCode = ''), 1500);
}

function onDetect(codes: { rawValue: string }[]) {
  const code = codes[0]?.rawValue;
  if (!code || code === lastCode) return;
  lastCode = code;
  check(code);
}

function onCameraError(err: { name?: string; message?: string }) {
  cameraOn.value = false;
  cameraError.value =
    err.name === 'NotAllowedError'
      ? 'Немає дозволу на камеру. Дозвольте доступ у налаштуваннях браузера.'
      : err.name === 'NotFoundError' || err.name === 'OverconstrainedError'
        ? 'Камеру не знайдено. Введіть код квитка вручну.'
        : err.name === 'InsecureContextError'
          ? 'Камера працює лише через HTTPS або на localhost.'
          : 'Камера недоступна. Введіть код квитка вручну.';
}

function submitManual() {
  check(manual.value);
  manual.value = '';
}

onBeforeUnmount(() => clearTimeout(hideTimer));

const reasonHint: Record<string, string> = {
  ALREADY_USED: 'Цей квиток уже пройшов контроль',
  NOT_PAID: 'Замовлення не оплачене',
  WRONG_DAY: 'Перевірте дату й час сеансу',
  NOT_FOUND: 'Такого квитка немає в системі',
};
</script>

<template>
  <div class="fixed inset-0 z-40 flex flex-col bg-black text-text lg:grid lg:grid-cols-[1fr_340px]">
    <!-- камера -->
    <section class="relative flex min-h-0 flex-1 flex-col" aria-labelledby="scan-title">
      <header
        class="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-b from-black/80 to-transparent p-4"
      >
        <RouterLink
          to="/admin/sessions"
          class="flex h-10 items-center gap-1 rounded-pill bg-white/10 px-3 text-sm font-semibold backdrop-blur hover:bg-white/20"
        >
          <Icon name="chevron-left" :size="18" /> Адмінка
        </RouterLink>
        <h1 id="scan-title" class="font-sans text-base font-bold">Сканер квитків</h1>
        <span class="w-[92px]" aria-hidden="true" />
      </header>

      <div class="relative flex-1 overflow-hidden">
        <QrcodeStream
          v-if="!cameraError"
          :paused="!!result"
          :constraints="{ facingMode: 'environment' }"
          class="!absolute inset-0 [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover"
          @detect="onDetect"
          @camera-on="cameraOn = true"
          @error="onCameraError"
        />
        <div v-if="cameraError" class="absolute inset-0 grid place-items-center p-8 text-center">
          <div>
            <div class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/10 text-muted">
              <Icon name="camera" :size="30" />
            </div>
            <p class="mt-4 max-w-xs text-sm text-text/80" role="status">{{ cameraError }}</p>
          </div>
        </div>
        <!-- рамка видошукача -->
        <div v-else class="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
          <div class="frame relative aspect-square w-[min(70vw,320px)] rounded-lg">
            <span
              v-if="cameraOn && !result"
              class="scanline absolute inset-x-4 h-0.5 rounded-full bg-accent shadow-[0_0_12px_2px_rgba(200,16,46,0.8)]"
            />
          </div>
          <p class="absolute bottom-6 text-sm text-white/70">
            {{ cameraOn ? 'Наведіть камеру на QR-код квитка' : 'Вмикаємо камеру…' }}
          </p>
        </div>

        <!-- результат на весь екран: зелений — дійсний, рожевий — ні -->
        <Transition name="result">
          <button
            v-if="result"
            type="button"
            class="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center"
            :class="result.valid ? 'bg-[#0f5132]' : 'bg-[#7a1f33]'"
            aria-label="Продовжити сканування"
            @click="next"
          >
            <div role="alert" class="flex flex-col items-center">
              <div
                class="grid h-28 w-28 place-items-center rounded-full"
                :class="result.valid ? 'bg-success text-[#0f5132]' : 'bg-danger text-[#4a0f1d]'"
              >
                <Icon :name="result.valid ? 'check' : 'x'" :size="64" />
              </div>
              <p class="mt-6 font-display text-[34px] font-bold text-white">{{ result.message }}</p>
              <p v-if="!result.valid && result.reason" class="mt-1 text-white/80">{{ reasonHint[result.reason] }}</p>
              <p v-if="result.usedAt" class="mt-1 text-sm text-white/70">Прохід о {{ formatTime(result.usedAt) }}</p>
              <div v-if="result.ticket" class="mt-6 rounded-md bg-black/25 px-6 py-4 text-white">
                <p class="font-display text-xl font-bold">{{ result.ticket.title }}</p>
                <p class="mt-1 text-sm text-white/80">
                  {{ formatSession(result.ticket.startsAt) }} · {{ result.ticket.hall }}
                </p>
                <p class="num mt-2 text-2xl">Ряд {{ result.ticket.row }} · Місце {{ result.ticket.number }}</p>
              </div>
              <p class="mt-8 text-sm text-white/60">Торкніться, щоб сканувати далі</p>
            </div>
          </button>
        </Transition>
      </div>

      <form class="relative z-20 flex gap-2 border-t border-white/10 bg-surface p-4" @submit.prevent="submitManual">
        <label for="manual-code" class="sr-only">Код квитка</label>
        <input
          id="manual-code"
          v-model="manual"
          class="field flex-1 font-mono uppercase"
          placeholder="TH-XXXXXXXX-314"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
        />
        <BaseButton type="submit" :loading="checking" :disabled="!manual.trim()">Перевірити</BaseButton>
      </form>
    </section>

    <!-- журнал -->
    <aside class="hidden min-h-0 flex-col border-l border-white/10 bg-surface lg:flex" aria-labelledby="log-title">
      <h2
        id="log-title"
        class="border-b border-text/[0.06] px-5 py-4 font-sans text-sm font-bold uppercase tracking-wider text-muted"
      >
        Останні сканування
      </h2>
      <p v-if="!history.length" class="px-5 py-6 text-sm text-muted">Поки порожньо.</p>
      <ul class="flex-1 divide-y divide-text/[0.06] overflow-y-auto" aria-live="polite">
        <li v-for="h in history" :key="h.at" class="flex items-start gap-3 px-5 py-3">
          <span
            class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full"
            :class="h.valid ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'"
          >
            <Icon :name="h.valid ? 'check' : 'x'" :size="14" />
          </span>
          <div class="min-w-0 flex-1 text-sm">
            <p class="font-semibold">{{ h.message }}</p>
            <p v-if="h.ticket" class="truncate text-muted">
              {{ h.ticket.title }} · ряд {{ h.ticket.row }}, місце {{ h.ticket.number }}
            </p>
          </div>
          <span class="num text-xs text-muted">{{ formatTime(h.at) }}</span>
        </li>
      </ul>
    </aside>
  </div>
</template>

<style scoped>
.frame {
  box-shadow: 0 0 0 100vmax rgb(0 0 0 / 0.45);
  border: 2px solid rgb(255 255 255 / 0.7);
}
.scanline {
  animation: scan 2.2s ease-in-out infinite alternate;
}
@keyframes scan {
  from {
    top: 12%;
  }
  to {
    top: 88%;
  }
}
.result-enter-active,
.result-leave-active {
  transition:
    opacity 220ms var(--ease-out),
    transform 220ms var(--ease-out);
}
.result-enter-from,
.result-leave-to {
  opacity: 0;
  transform: scale(1.03);
}
</style>
