<script setup lang="ts">
import { ticketCode } from '@/api/ticketCode';
import type { CinemaEvent, OrderSeat } from '@/api/types';
import Badge from '@/shared/ui/Badge.vue';
import { formatLongDate, formatTime, relativeDay } from '@/shared/composables/useDateLabel';
import QrCode from './QrCode.vue';

const props = defineProps<{ orderId: string; event: CinemaEvent; seat: OrderSeat; past?: boolean }>();

const zoneLabel = { STANDARD: 'Стандарт', COMFORT: 'Комфорт', LOVE: 'Love Seat' } as const;
const code = ticketCode(props.orderId, props.seat.row, props.seat.number);
</script>

<template>
  <article
    class="ticket group relative flex flex-col overflow-visible md:flex-row"
    :class="past && 'opacity-60 grayscale-[0.6]'"
    :aria-label="`Квиток: ${event.title}, ряд ${seat.row}, місце ${seat.number}`"
  >
    <!-- основна частина -->
    <div
      class="main relative flex-1 overflow-hidden rounded-t-lg bg-surface p-5 md:rounded-l-lg md:rounded-tr-none md:p-6"
    >
      <div
        class="absolute inset-y-0 left-0 w-1.5"
        :style="{ background: `linear-gradient(${event.movie.palette[1]}, ${event.movie.palette[0]})` }"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
        :style="{ background: event.movie.palette[1] }"
        aria-hidden="true"
      />
      <div class="relative flex items-start justify-between gap-3">
        <p class="text-[10px] font-bold uppercase tracking-[0.35em] text-gold">TicketHub · Admit one</p>
        <Badge v-if="past" tone="neutral">Архів</Badge>
        <Badge v-else-if="relativeDay(event.startsAt)" tone="accent">{{ relativeDay(event.startsAt) }}</Badge>
      </div>
      <h3 class="relative mt-2 text-[24px] leading-tight">{{ event.title }}</h3>
      <p class="relative mt-1 text-sm text-muted">{{ event.venue.name }} · {{ event.venue.address }}</p>

      <dl class="relative mt-5 grid grid-cols-3 gap-4 sm:grid-cols-5">
        <div class="col-span-3 sm:col-span-2">
          <dt class="ticket-dt">Дата</dt>
          <dd class="font-semibold first-letter:uppercase">{{ formatLongDate(event.startsAt) }}</dd>
        </div>
        <div>
          <dt class="ticket-dt">Час</dt>
          <dd class="num text-lg">{{ formatTime(event.startsAt) }}</dd>
        </div>
        <div>
          <dt class="ticket-dt">Зал</dt>
          <dd class="font-semibold">{{ event.section.name }}</dd>
        </div>
        <div>
          <dt class="ticket-dt">{{ event.section.format }}</dt>
          <dd class="text-sm font-semibold" :class="seat.zone === 'LOVE' ? 'text-gold' : ''">
            {{ zoneLabel[seat.zone] }}
          </dd>
        </div>
      </dl>

      <div class="relative mt-5 flex gap-3">
        <div class="seat-box">
          <span class="ticket-dt">Ряд</span>
          <span class="num text-[28px] leading-none">{{ seat.row }}</span>
        </div>
        <div class="seat-box border-accent/50 bg-accent/10">
          <span class="ticket-dt">Місце</span>
          <span class="num text-[28px] leading-none">{{ seat.number }}</span>
        </div>
      </div>
    </div>

    <!-- перфорація з «вирізами» -->
    <div class="perforation relative" aria-hidden="true">
      <span class="notch notch-a" />
      <span class="notch notch-b" />
    </div>

    <!-- корінець із QR -->
    <div
      class="stub flex items-center gap-4 rounded-b-lg bg-raised p-5 md:w-[200px] md:flex-col md:justify-center md:rounded-r-lg md:rounded-bl-none"
    >
      <div class="w-28 md:w-full">
        <QrCode :value="code" :label="`QR-код квитка ${code}`" />
      </div>
      <div class="md:text-center">
        <p class="ticket-dt">Код квитка</p>
        <p class="num mt-0.5 font-mono text-xs tracking-wider">{{ code }}</p>
        <p class="mt-2 text-xs text-muted">{{ past ? 'Сеанс завершено' : 'Покажіть на вході' }}</p>
      </div>
    </div>
  </article>
</template>

<style scoped>
.ticket {
  filter: drop-shadow(0 18px 30px rgb(0 0 0 / 0.45));
  transition: transform 250ms var(--ease-out);
}
.ticket:hover {
  transform: translateY(-3px);
}
.ticket-dt {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgb(var(--c-text-muted));
  margin-bottom: 2px;
}
.seat-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 84px;
  padding: 10px 14px;
  border-radius: var(--r-sm);
  border: 1px solid rgb(var(--c-text) / 0.1);
}

/* Перфорація: пунктир між частинами та два півкола, «вирізані» кольором фону */
.perforation {
  height: 0;
  border-top: 2px dashed rgb(var(--c-text) / 0.18);
  margin: 0 14px;
}
.notch {
  position: absolute;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: rgb(var(--c-bg));
  top: -13px;
}
.notch-a {
  left: -27px;
}
.notch-b {
  right: -27px;
}
@media (min-width: 768px) {
  .perforation {
    height: auto;
    width: 0;
    border-top: 0;
    border-left: 2px dashed rgb(var(--c-text) / 0.18);
    margin: 14px 0;
    background: transparent;
  }
  .notch {
    left: -13px;
    right: auto;
  }
  .notch-a {
    top: -27px;
  }
  .notch-b {
    top: auto;
    bottom: -27px;
  }
}
</style>
