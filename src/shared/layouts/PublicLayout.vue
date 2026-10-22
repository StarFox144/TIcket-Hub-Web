<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { CITIES, useCityStore } from '@/stores/city';
import BaseButton from '@/shared/ui/BaseButton.vue';
import Icon from '@/shared/ui/Icon.vue';
import Logo from './Logo.vue';

const auth = useAuthStore();
const cityStore = useCityStore();
const route = useRoute();
const router = useRouter();

const nav = [
  { to: '/', label: 'Афіша', name: 'home' },
  { to: '/soon', label: 'Скоро', name: 'soon' },
  { to: '/cinemas', label: 'Кінотеатри', name: 'cinemas' },
];

const bottomNav = computed(() => [
  { to: '/', label: 'Афіша', icon: 'film' as const, active: ['home', 'movie', 'soon', 'cinemas', 'session'] },
  { to: '/me/tickets', label: 'Мої квитки', icon: 'ticket' as const, active: ['tickets'] },
  {
    to: auth.isLoggedIn ? '/profile' : '/login',
    label: 'Профіль',
    icon: 'user' as const,
    active: ['profile', 'login', 'register'],
  },
]);

const query = ref(typeof route.query.q === 'string' ? route.query.q : '');
const searchOpen = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);

watch(
  () => route.query.q,
  (q) => (query.value = typeof q === 'string' ? q : ''),
);

async function openSearch() {
  searchOpen.value = true;
  await nextTick();
  searchInput.value?.focus();
}

function submitSearch() {
  const q = query.value.trim();
  router.push({ name: 'home', query: q ? { q } : {} });
  searchOpen.value = false;
}

const isActive = (name: string) => route.name === name || (name === 'home' && route.name === 'movie');
</script>

<template>
  <a href="#main" class="sr-only-focusable fixed left-4 top-4 z-[70] rounded-md bg-accent px-4 py-2 text-white">
    Перейти до вмісту
  </a>

  <header class="sticky top-0 z-40 border-b border-text/[0.06] bg-bg/85 backdrop-blur-xl">
    <div class="container-page flex h-[var(--header-h)] items-center gap-3 md:gap-6">
      <RouterLink to="/" class="shrink-0 rounded-md" aria-label="TicketHub — на головну">
        <Logo />
      </RouterLink>

      <nav aria-label="Основна навігація" class="hidden md:block">
        <ul class="flex items-center gap-1">
          <li v-for="item in nav" :key="item.to">
            <RouterLink
              :to="item.to"
              class="relative rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-200"
              :class="isActive(item.name) ? 'text-text' : 'text-muted hover:text-text'"
              :aria-current="isActive(item.name) ? 'page' : undefined"
            >
              {{ item.label }}
              <span
                v-if="isActive(item.name)"
                class="absolute inset-x-3 -bottom-[17px] h-0.5 rounded-full bg-accent shadow-glow-sm"
                aria-hidden="true"
              />
            </RouterLink>
          </li>
        </ul>
      </nav>

      <form role="search" class="ml-auto hidden flex-1 md:flex md:max-w-xs lg:max-w-sm" @submit.prevent="submitSearch">
        <label class="relative w-full">
          <span class="sr-only">Пошук фільму</span>
          <Icon
            name="search"
            :size="18"
            class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            v-model="query"
            type="search"
            placeholder="Пошук фільму"
            class="h-10 w-full rounded-pill border border-text/10 bg-surface pl-10 pr-4 text-sm text-text placeholder:text-muted transition-colors focus:border-accent focus:outline-none"
          />
        </label>
      </form>

      <div class="ml-auto flex items-center gap-1 md:ml-0 md:gap-3">
        <button
          type="button"
          class="grid h-10 w-10 place-items-center rounded-pill text-muted hover:text-text md:hidden"
          aria-label="Пошук"
          :aria-expanded="searchOpen"
          aria-controls="mobile-search"
          @click="searchOpen ? (searchOpen = false) : openSearch()"
        >
          <Icon name="search" />
        </button>

        <label class="relative flex items-center">
          <span class="sr-only">Місто</span>
          <Icon name="pin" :size="16" class="pointer-events-none absolute left-2.5 text-accent" />
          <select
            v-model="cityStore.city"
            class="h-10 cursor-pointer appearance-none rounded-pill bg-transparent pl-8 pr-7 text-sm font-semibold text-text hover:bg-text/5 focus:outline-none"
          >
            <option v-for="c in CITIES" :key="c" :value="c" class="bg-raised">{{ c }}</option>
          </select>
          <Icon name="chevron-down" :size="14" class="pointer-events-none absolute right-2.5 text-muted" />
        </label>

        <BaseButton v-if="!auth.isLoggedIn" to="/login" size="sm" class="hidden md:inline-flex">Увійти</BaseButton>
        <template v-else>
          <RouterLink
            v-if="auth.role !== 'USER'"
            to="/admin/sessions"
            class="hidden h-10 items-center gap-2 rounded-pill px-3 text-sm font-semibold text-gold transition-colors hover:bg-gold/10 md:flex"
          >
            <Icon name="grid" :size="18" /> Адмінка
          </RouterLink>
          <RouterLink
            to="/me/tickets"
            class="hidden h-10 items-center gap-2 rounded-pill px-3 text-sm font-semibold text-muted transition-colors hover:text-text md:flex"
          >
            <Icon name="ticket" :size="18" /> Мої квитки
          </RouterLink>
          <RouterLink
            to="/profile"
            class="hidden h-10 w-10 place-items-center rounded-full bg-accent-dark font-bold text-white ring-2 ring-accent/40 md:grid"
            :aria-label="`Профіль: ${auth.user?.name}`"
          >
            {{ auth.user?.name?.charAt(0).toUpperCase() }}
          </RouterLink>
        </template>
      </div>
    </div>

    <Transition name="drop">
      <form
        v-if="searchOpen"
        id="mobile-search"
        role="search"
        class="container-page pb-3 md:hidden"
        @submit.prevent="submitSearch"
      >
        <label class="relative block">
          <span class="sr-only">Пошук фільму</span>
          <Icon
            name="search"
            :size="18"
            class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            ref="searchInput"
            v-model="query"
            type="search"
            placeholder="Пошук фільму"
            class="field rounded-pill pl-10"
          />
        </label>
      </form>
    </Transition>
  </header>

  <main
    id="main"
    tabindex="-1"
    class="min-h-[60vh] pb-[calc(var(--bottom-nav-h)+24px)] focus:outline-none md:pb-16"
    :class="route.meta.hasCartBar && 'pb-[calc(var(--bottom-nav-h)+140px)] md:pb-40'"
  >
    <slot />
  </main>

  <footer class="hidden border-t border-text/[0.06] py-10 text-sm text-muted md:block">
    <div class="container-page flex items-center justify-between gap-6">
      <Logo />
      <p>© {{ new Date().getFullYear() }} TicketHub. Демо-проєкт, усі фільми вигадані.</p>
    </div>
  </footer>

  <nav
    aria-label="Мобільна навігація"
    class="fixed inset-x-0 bottom-0 z-40 border-t border-text/[0.06] bg-bg/90 backdrop-blur-xl md:hidden"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <ul class="grid h-[var(--bottom-nav-h)] grid-cols-3">
      <li v-for="item in bottomNav" :key="item.label">
        <RouterLink
          :to="item.to"
          class="flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors"
          :class="item.active.includes(String(route.name)) ? 'text-accent-text' : 'text-muted'"
          :aria-current="item.active.includes(String(route.name)) ? 'page' : undefined"
        >
          <Icon :name="item.icon" :size="22" />
          {{ item.label }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.drop-enter-active,
.drop-leave-active {
  transition:
    opacity 200ms var(--ease-out),
    transform 200ms var(--ease-out);
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
