<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Icon, { type IconName } from '@/shared/ui/Icon.vue';
import Logo from './Logo.vue';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const links = computed(() =>
  [
    {
      to: '/admin/sessions',
      label: 'Розклад сеансів',
      icon: 'calendar' as IconName,
      match: ['admin-sessions', 'admin-sales'],
    },
    { to: '/admin/scan', label: 'Сканер квитків', icon: 'scan' as IconName, match: ['admin-scan'] },
    { to: '/admin/halls', label: 'Зали', icon: 'grid' as IconName, match: ['admin-halls'], admin: true },
  ].filter((l) => !l.admin || auth.role === 'ADMIN'),
);

const isActive = (match: string[]) => match.includes(String(route.name));

function logout() {
  auth.logout();
  router.push('/');
}
</script>

<template>
  <div class="min-h-dvh bg-bg text-[15px] md:grid md:grid-cols-[240px_1fr]">
    <a href="#admin-main" class="sr-only-focusable fixed left-4 top-4 z-[70] rounded-md bg-accent px-4 py-2 text-white">
      Перейти до вмісту
    </a>

    <!-- бічне меню: щільніше за публічну частину -->
    <aside class="sticky top-0 z-30 border-b border-text/[0.06] bg-surface md:h-dvh md:border-b-0 md:border-r">
      <div class="flex h-14 items-center justify-between gap-3 px-4 md:h-16 md:px-5">
        <RouterLink to="/admin/sessions" class="flex items-center gap-2 rounded-md" aria-label="TicketHub — адмінка">
          <Logo class="[&_span.font-display]:text-lg [&_svg]:h-7 [&_svg]:w-7" />
        </RouterLink>
        <span class="rounded-sm bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold"
          >Адмінка</span
        >
      </div>

      <nav aria-label="Адмінка" class="overflow-x-auto px-2 pb-2 [scrollbar-width:none] md:px-3 md:pb-0">
        <ul class="flex gap-1 md:flex-col">
          <li v-for="l in links" :key="l.to" class="shrink-0">
            <RouterLink
              :to="l.to"
              class="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors duration-200"
              :class="
                isActive(l.match)
                  ? 'bg-accent/15 text-text ring-1 ring-inset ring-accent/40'
                  : 'text-muted hover:bg-text/5 hover:text-text'
              "
              :aria-current="isActive(l.match) ? 'page' : undefined"
            >
              <Icon :name="l.icon" :size="18" :class="isActive(l.match) && 'text-accent-hover'" />
              {{ l.label }}
            </RouterLink>
          </li>
          <li class="shrink-0 md:mt-4 md:border-t md:border-text/[0.06] md:pt-4">
            <RouterLink
              to="/"
              class="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold text-muted hover:bg-text/5 hover:text-text"
            >
              <Icon name="film" :size="18" /> На сайт
            </RouterLink>
          </li>
        </ul>
      </nav>

      <div class="absolute inset-x-3 bottom-4 hidden items-center gap-3 rounded-md bg-raised p-3 md:flex">
        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-dark font-bold text-white">
          {{ auth.user?.name.charAt(0).toUpperCase() }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold">{{ auth.user?.name }}</p>
          <p class="text-xs text-muted">{{ auth.role === 'ADMIN' ? 'Адміністратор' : 'Організатор' }}</p>
        </div>
        <button type="button" class="rounded-sm p-1.5 text-muted hover:text-text" aria-label="Вийти" @click="logout">
          <Icon name="logout" :size="18" />
        </button>
      </div>
    </aside>

    <main id="admin-main" tabindex="-1" class="min-w-0 px-4 py-6 focus:outline-none md:px-8 md:py-8">
      <slot />
    </main>
  </div>
</template>
