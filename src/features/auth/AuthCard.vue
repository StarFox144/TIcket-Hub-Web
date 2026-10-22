<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();
</script>

<template>
  <section
    class="relative isolate flex min-h-[calc(100dvh-var(--header-h)-var(--bottom-nav-h))] items-center justify-center overflow-hidden px-4 py-12"
  >
    <!-- легке червоне сяйво за карткою -->
    <div
      class="absolute left-1/2 top-1/2 -z-10 h-[min(420px,100vw)] w-[min(420px,100vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/25 blur-[110px]"
      aria-hidden="true"
    />
    <div
      class="w-full max-w-[420px] rounded-lg bg-surface/95 p-7 shadow-card ring-1 ring-inset ring-text/[0.08] backdrop-blur md:p-9"
    >
      <h1 class="text-center text-[30px]">{{ title }}</h1>
      <p v-if="subtitle" class="mt-2 text-center text-sm text-muted">{{ subtitle }}</p>
      <div class="mt-8">
        <slot />
      </div>
      <div v-if="$slots.footer" class="mt-6 text-center text-sm text-muted">
        <slot name="footer" />
      </div>
    </div>
  </section>
</template>
