<script setup lang="ts">
import BaseButton from '@/shared/ui/BaseButton.vue';
</script>

<template>
  <section class="container-page flex flex-col items-center py-24 text-center">
    <p class="font-display text-7xl font-bold text-accent">404</p>
    <h1 class="mt-4">Цей зал порожній</h1>
    <p class="mt-3 max-w-md text-muted">
      Сторінку не знайдено — можливо, сеанс уже закінчився або посилання застаріло.
    </p>
    <BaseButton to="/" class="mt-8">До афіші</BaseButton>
  </section>
</template>
