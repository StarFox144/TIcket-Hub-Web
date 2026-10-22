<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { fetchOrder } from '@/api/orders';
import type { Order } from '@/api/types';
import { formatSession } from '@/shared/composables/useDateLabel';
import BaseButton from '@/shared/ui/BaseButton.vue';
import Icon from '@/shared/ui/Icon.vue';
import CheckoutSteps from './CheckoutSteps.vue';

const POLL_MS = 2000;
const MAX_WAIT_MS = 30_000;

const props = defineProps<{ orderId: string }>();

const order = ref<Order | null>(null);
const timedOut = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;
let startedAt = 0;

/** Webhook може дійти пізніше за редирект, тож опитуємо статус до PAID. */
async function poll() {
  try {
    order.value = await fetchOrder(props.orderId);
  } catch {
    /* мережевий збій — спробуємо на наступному колі */
  }
  const status = order.value?.status;
  if (status === 'PAID' || status === 'REFUNDED' || status === 'EXPIRED') return;
  if (Date.now() - startedAt > MAX_WAIT_MS) {
    timedOut.value = true;
    return;
  }
  timer = setTimeout(poll, POLL_MS);
}

function restart() {
  timedOut.value = false;
  startedAt = Date.now();
  poll();
}

onMounted(restart);
onBeforeUnmount(() => clearTimeout(timer));

const state = computed(() => {
  const s = order.value?.status;
  if (s === 'PAID') return 'paid';
  if (s === 'REFUNDED' || s === 'EXPIRED') return 'failed';
  return timedOut.value ? 'timeout' : 'pending';
});

function downloadPdf() {
  window.print();
}
</script>

<template>
  <div class="container-page flex flex-col items-center py-10 text-center md:py-16">
    <CheckoutSteps :current="state === 'paid' ? 3 : 2" />

    <div class="mt-12 w-full max-w-lg" aria-live="polite">
      <template v-if="state === 'pending'">
        <div class="mx-auto grid h-24 w-24 place-items-center">
          <span
            class="h-16 w-16 animate-spin rounded-full border-4 border-accent/25 border-t-accent"
            aria-hidden="true"
          />
        </div>
        <h1 class="mt-6">Підтверджуємо оплату…</h1>
        <p class="mt-3 text-muted">Зазвичай це займає кілька секунд. Не закривайте сторінку.</p>
      </template>

      <template v-else-if="state === 'paid' && order">
        <div class="ticket-fly mx-auto w-56" aria-hidden="true">
          <div class="relative rounded-md bg-accent px-5 py-6 text-left text-white shadow-glow">
            <span class="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-bg" />
            <span class="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-bg" />
            <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">TicketHub</p>
            <p class="mt-1 font-display text-lg font-bold leading-tight">{{ order.event.title }}</p>
            <p class="mt-2 text-xs text-white/80">{{ formatSession(order.event.startsAt) }}</p>
          </div>
        </div>
        <h1 class="mt-10">Квиток вже летить на пошту</h1>
        <p class="mt-3 text-muted">
          Надіслали на <span class="text-text">{{ order.email }}</span
          >. QR-код також є в розділі «Мої квитки».
        </p>
        <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <BaseButton to="/me/tickets" size="lg"><Icon name="ticket" /> Мої квитки</BaseButton>
          <BaseButton variant="secondary" size="lg" @click="downloadPdf"
            ><Icon name="download" /> Завантажити PDF</BaseButton
          >
        </div>
      </template>

      <template v-else-if="state === 'failed'">
        <div class="mx-auto grid h-20 w-20 place-items-center rounded-full bg-accent/15 text-danger">
          <Icon name="info" :size="36" />
        </div>
        <h1 class="mt-6">Резерв закінчився</h1>
        <p class="mt-3 text-muted">
          Оплата надійшла вже після завершення резерву, тому місця повернулись у зал, а гроші повернуто на картку.
        </p>
        <BaseButton v-if="order" :to="{ name: 'session', params: { id: order.eventId } }" class="mt-8" size="lg">
          Обрати місця знову
        </BaseButton>
      </template>

      <template v-else>
        <div class="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gold/15 text-gold">
          <Icon name="clock" :size="36" />
        </div>
        <h1 class="mt-6">Оплата ще обробляється</h1>
        <p class="mt-3 text-muted">
          Банк відповідає довше, ніж зазвичай. Квиток прийде на пошту, щойно платіж підтвердиться.
        </p>
        <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <BaseButton size="lg" @click="restart">Перевірити ще раз</BaseButton>
          <BaseButton to="/me/tickets" variant="secondary" size="lg">Мої квитки</BaseButton>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.ticket-fly {
  animation: fly 900ms var(--ease-out) both;
}
@keyframes fly {
  0% {
    opacity: 0;
    transform: translateY(40px) rotate(-8deg) scale(0.8);
  }
  60% {
    opacity: 1;
    transform: translateY(-10px) rotate(3deg) scale(1.03);
  }
  100% {
    transform: translateY(0) rotate(-2deg) scale(1);
  }
}
</style>
