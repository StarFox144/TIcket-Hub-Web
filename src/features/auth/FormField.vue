<script setup lang="ts">
import { ref, useId } from 'vue';
import Icon from '@/shared/ui/Icon.vue';

const props = defineProps<{
  label: string;
  type?: 'text' | 'email' | 'password';
  autocomplete?: string;
  error?: string;
}>();
const model = defineModel<string>({ required: true });

const id = useId();
const reveal = ref(false);
const inputType = () => (props.type === 'password' && reveal.value ? 'text' : (props.type ?? 'text'));
</script>

<template>
  <div>
    <label :for="id" class="label">{{ label }}</label>
    <div class="relative">
      <input
        :id="id"
        v-model="model"
        :type="inputType()"
        :autocomplete="autocomplete"
        class="field"
        :class="[error && '!border-danger', type === 'password' && 'pr-12']"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : undefined"
      />
      <button
        v-if="type === 'password'"
        type="button"
        class="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-sm text-muted hover:text-text"
        :aria-label="reveal ? 'Сховати пароль' : 'Показати пароль'"
        :aria-pressed="reveal"
        @click="reveal = !reveal"
      >
        <Icon :name="reveal ? 'x' : 'lock'" :size="18" />
      </button>
    </div>
    <p v-if="error" :id="`${id}-error`" class="mt-1.5 text-sm text-danger">{{ error }}</p>
  </div>
</template>
