<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import QRCode from 'qrcode';

const props = defineProps<{ value: string; label: string }>();
const svg = ref('');

watchEffect(async () => {
  svg.value = await QRCode.toString(props.value, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#0B0B0D', light: '#00000000' },
  });
});
</script>

<template>
  <!-- QR — темний на теплому білому, щоб сканер на вході читав його з екрана -->
  <div class="rounded-md bg-text p-2.5" role="img" :aria-label="label">
    <!-- eslint-disable-next-line vue/no-v-html -- SVG генерує бібліотека qrcode з нашого ж коду квитка -->
    <div class="aspect-square w-full [&>svg]:h-full [&>svg]:w-full" v-html="svg" />
  </div>
</template>
