<script setup lang="ts">
import { reactive, ref } from 'vue';
import { errorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import BaseButton from '@/shared/ui/BaseButton.vue';
import AuthCard from './AuthCard.vue';
import FormField from './FormField.vue';
import { useRedirectBack } from './useRedirectBack';

const auth = useAuthStore();
const toast = useToastStore();
const { target, go } = useRedirectBack();

const form = reactive({ email: '', password: '' });
const errors = reactive({ email: '', password: '' });
const formError = ref('');
const submitting = ref(false);

function validate() {
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? '' : 'Вкажіть коректний email';
  errors.password = form.password.length >= 6 ? '' : 'Пароль — щонайменше 6 символів';
  return !errors.email && !errors.password;
}

async function submit() {
  formError.value = '';
  if (!validate()) return;
  submitting.value = true;
  try {
    await auth.login({ email: form.email.trim(), password: form.password });
    toast.success(`Вітаємо, ${auth.user?.name}!`);
    go();
  } catch (e) {
    formError.value = errorMessage(e, 'Не вдалося увійти');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <AuthCard title="Вхід" subtitle="Квитки, бронювання й історія — в одному місці">
    <form class="space-y-5" novalidate @submit.prevent="submit">
      <FormField v-model="form.email" label="Email" type="email" autocomplete="email" :error="errors.email" />
      <FormField
        v-model="form.password"
        label="Пароль"
        type="password"
        autocomplete="current-password"
        :error="errors.password"
      />
      <p v-if="formError" role="alert" class="rounded-sm bg-accent/15 px-4 py-3 text-sm text-danger">{{ formError }}</p>
      <BaseButton type="submit" size="lg" block :loading="submitting">Увійти</BaseButton>
      <p class="text-center text-xs text-muted">
        Демо-режим: будь-який email і пароль від 6 символів. org@… — організатор, admin@… — адміністратор.
      </p>
    </form>
    <template #footer>
      Немає акаунта?
      <RouterLink
        :to="{ name: 'register', query: { redirect: target() } }"
        class="font-semibold text-accent-text hover:underline"
      >
        Зареєструватися
      </RouterLink>
    </template>
  </AuthCard>
</template>
