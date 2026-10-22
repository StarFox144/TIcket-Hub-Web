<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { fetchOrder, payOrder } from '@/api/orders';
import { errorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { useAsync } from '@/shared/composables/useAsync';
import { formatMoney } from '@/shared/composables/useMoney';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import Icon from '@/shared/ui/Icon.vue';
import Modal from '@/shared/ui/Modal.vue';
import Skeleton from '@/shared/ui/Skeleton.vue';
import StateBlock from '@/shared/ui/StateBlock.vue';
import CheckoutSteps from './CheckoutSteps.vue';
import OrderSummary from './OrderSummary.vue';
import ReservationTimer from './ReservationTimer.vue';

const props = defineProps<{ orderId: string }>();
const router = useRouter();
const auth = useAuthStore();
const toast = useToastStore();

const { data: order, loading, error, run, retry } = useAsync(fetchOrder);
watch(
  () => props.orderId,
  (id) => run(id),
  { immediate: true },
);

const email = ref(auth.user?.email ?? '');
const emailError = ref('');
const paying = ref(false);
const timeUp = ref(false);

watch(order, (o) => {
  if (o?.status === 'PAID') router.replace({ name: 'checkout-result', params: { orderId: o.id } });
  if (o?.status === 'EXPIRED') timeUp.value = true;
});

const sessionLink = computed(() => (order.value ? { name: 'session', params: { id: order.value.eventId } } : '/'));

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function pay() {
  if (!order.value) return;
  if (!validEmail(email.value)) {
    emailError.value = 'Вкажіть коректний email — на нього прийде квиток';
    return;
  }
  emailError.value = '';
  paying.value = true;
  try {
    const { redirectUrl } = await payOrder(order.value.id, email.value.trim());
    // Фейковий провайдер повертає на /checkout/:orderId/result
    if (redirectUrl.startsWith('/')) router.push(redirectUrl);
    else window.location.href = redirectUrl;
  } catch (e) {
    toast.error(errorMessage(e, 'Оплата не пройшла. Спробуйте ще раз.'));
    run(props.orderId);
  } finally {
    paying.value = false;
  }
}
</script>

<template>
  <div class="container-page py-8 md:py-10">
    <RouterLink :to="sessionLink" class="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
      <Icon name="chevron-left" :size="16" /> До вибору місць
    </RouterLink>
    <div class="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <h1>Оформлення</h1>
      <CheckoutSteps :current="2" />
    </div>

    <div v-if="loading && !order" class="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]" aria-busy="true">
      <Skeleton class="h-80" rounded="rounded-lg" />
      <Skeleton class="h-80" rounded="rounded-lg" />
    </div>

    <StateBlock
      v-else-if="error"
      class="mt-8"
      kind="error"
      title="Замовлення не знайдено"
      :text="error"
      @retry="retry"
    />

    <div v-else-if="order" class="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_400px]">
      <OrderSummary :order="order" />

      <BaseCard as="section" class="lg:sticky lg:top-[calc(var(--header-h)+24px)]" aria-labelledby="pay-title">
        <h2 id="pay-title" class="sr-only">Оплата</h2>
        <ReservationTimer v-if="order.status === 'RESERVED'" :expires-at="order.expiresAt" @expired="timeUp = true" />

        <form class="mt-6 space-y-5" novalidate @submit.prevent="pay">
          <div>
            <label for="checkout-email" class="label">Email для квитка</label>
            <div class="relative">
              <Icon
                name="mail"
                :size="18"
                class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                id="checkout-email"
                v-model="email"
                type="email"
                autocomplete="email"
                inputmode="email"
                class="field pl-11"
                :class="emailError && '!border-danger'"
                placeholder="you@example.com"
                :aria-invalid="!!emailError"
                :aria-describedby="emailError ? 'checkout-email-error' : 'checkout-email-hint'"
              />
            </div>
            <p v-if="emailError" id="checkout-email-error" class="mt-1.5 text-sm text-danger">{{ emailError }}</p>
            <p v-else id="checkout-email-hint" class="mt-1.5 text-xs text-muted">Надішлемо квиток з QR-кодом і PDF.</p>
          </div>

          <BaseButton type="submit" size="lg" block :loading="paying" :disabled="timeUp || order.status !== 'RESERVED'">
            <Icon name="lock" :size="18" /> Оплатити {{ formatMoney(order.total) }}
          </BaseButton>
          <p class="text-center text-xs text-muted">Демо-оплата: гроші не списуються.</p>
        </form>
      </BaseCard>
    </div>

    <Modal :open="timeUp" title="Час вийшов" :dismissible="false">
      <p class="text-text/80">
        Резерв закінчився, і місця повернулись у зал. Оберіть їх ще раз — можливо, вони ще вільні.
      </p>
      <template #actions>
        <BaseButton :to="sessionLink" data-autofocus>Обрати місця знову</BaseButton>
      </template>
    </Modal>
  </div>
</template>
