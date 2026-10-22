<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { CITIES, useCityStore } from '@/stores/city';
import Badge from '@/shared/ui/Badge.vue';
import BaseButton from '@/shared/ui/BaseButton.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import Icon from '@/shared/ui/Icon.vue';

const auth = useAuthStore();
const cityStore = useCityStore();
const router = useRouter();

function logout() {
  auth.logout();
  router.push('/');
}
</script>

<template>
  <section class="container-page max-w-2xl py-8 md:py-10" aria-labelledby="profile-title">
    <h1 id="profile-title">Профіль</h1>

    <BaseCard class="mt-6 flex items-center gap-5">
      <div
        class="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-accent-dark font-display text-2xl font-bold text-white ring-2 ring-accent/50"
      >
        {{ auth.user?.name.charAt(0).toUpperCase() }}
      </div>
      <div class="min-w-0">
        <p class="truncate text-lg font-semibold">{{ auth.user?.name }}</p>
        <p class="truncate text-sm text-muted">{{ auth.user?.email }}</p>
        <Badge class="mt-2" :tone="auth.role === 'USER' ? 'neutral' : 'gold'">
          {{ { USER: 'Глядач', ORGANIZER: 'Організатор', ADMIN: 'Адміністратор' }[auth.role ?? 'USER'] }}
        </Badge>
      </div>
    </BaseCard>

    <BaseCard class="mt-4" :padded="false">
      <ul class="divide-y divide-text/[0.06]">
        <li v-if="auth.role !== 'USER'">
          <RouterLink
            to="/admin/sessions"
            class="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-text/[0.03]"
          >
            <Icon name="grid" class="text-gold" /> <span class="flex-1 font-semibold">Адмінка</span>
            <Icon name="chevron-right" class="text-muted" />
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/me/tickets" class="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-text/[0.03]">
            <Icon name="ticket" class="text-accent-hover" /> <span class="flex-1 font-semibold">Мої квитки</span>
            <Icon name="chevron-right" class="text-muted" />
          </RouterLink>
        </li>
        <li class="flex items-center gap-3 px-6 py-4">
          <Icon name="pin" class="text-accent-hover" />
          <label for="profile-city" class="flex-1 font-semibold">Місто</label>
          <select id="profile-city" v-model="cityStore.city" class="field w-auto py-2">
            <option v-for="c in CITIES" :key="c" :value="c">{{ c }}</option>
          </select>
        </li>
      </ul>
    </BaseCard>

    <BaseButton variant="secondary" class="mt-6" @click="logout"><Icon name="logout" :size="18" /> Вийти</BaseButton>
  </section>
</template>
