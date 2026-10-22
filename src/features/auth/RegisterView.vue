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

const form = reactive({ name: '', email: '', password: '', confirm: '' });
const errors = reactive({ name: '', email: '', password: '', confirm: '' });
const formError = ref('');
const submitting = ref(false);

function validate() {
  errors.name = form.name.trim().length >= 2 ? '' : 'Вкажіть ім’я';
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? '' : 'Вкажіть коректний email';
  errors.password = form.password.length >= 6 ? '' : 'Пароль — щонайменше 6 символів';
  errors.confirm = form.confirm === form.password ? '' : 'Паролі не збігаються';
  return Object.values(errors).every((e) => !e);
}

async function submit() {
  formError.value = '';
  if (!validate()) return;
  submitting.value = true;
  try {
    await auth.register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
    toast.success('Акаунт створено. Приємного перегляду!');
    go();
  } catch (e) {
    formError.value = errorMessage(e, 'Не вдалося зареєструватися');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <AuthCard title="Реєстрація" subtitle="Хвилина — і найкращі місця у залі ваші">
    <form class="space-y-5" novalidate @submit.prevent="submit">
      <FormField v-model="form.name" label="Ім’я" autocomplete="name" :error="errors.name" />
      <FormField v-model="form.email" label="Email" type="email" autocomplete="email" :error="errors.email" />
      <FormField
        v-model="form.password"
        label="Пароль"
        type="password"
        autocomplete="new-password"
        :error="errors.password"
      />
      <FormField
        v-model="form.confirm"
        label="Повторіть пароль"
        type="password"
        autocomplete="new-password"
        :error="errors.confirm"
      />
      <p v-if="formError" role="alert" class="rounded-sm bg-accent/15 px-4 py-3 text-sm text-danger">{{ formError }}</p>
      <BaseButton type="submit" size="lg" block :loading="submitting">Створити акаунт</BaseButton>
    </form>
    <template #footer>
      Уже є акаунт?
      <RouterLink
        :to="{ name: 'login', query: { redirect: target() } }"
        class="font-semibold text-accent-text hover:underline"
      >
        Увійти
      </RouterLink>
    </template>
  </AuthCard>
</template>
