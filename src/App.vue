<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AdminLayout from '@/shared/layouts/AdminLayout.vue';
import PublicLayout from '@/shared/layouts/PublicLayout.vue';
import ToastHost from '@/shared/ui/ToastHost.vue';

const route = useRoute();
const layout = computed(() => (route.meta.layout === 'admin' ? AdminLayout : PublicLayout));
</script>

<template>
  <component :is="layout">
    <RouterView v-slot="{ Component, route: current }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="current.path" />
      </Transition>
    </RouterView>
  </component>
  <ToastHost />
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition:
    opacity 220ms var(--ease-out),
    transform 220ms var(--ease-out);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
}
</style>
