import pluginVue from 'eslint-plugin-vue';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';

export default defineConfigWithVueTs(
  { name: 'app/files', files: ['**/*.{ts,mts,vue}'] },
  {
    name: 'app/ignores',
    ignores: ['dist/**', 'coverage/**', 'playwright-report/**', 'test-results/**', 'src/api/schema.d.ts'],
  },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  skipFormatting,
  {
    name: 'app/rules',
    rules: {
      'vue/multi-word-component-names': 'off',
      // необов'язкові TS-пропси без default — ідіоматично для <script setup>
      'vue/require-default-prop': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Правило архітектури: фіча імпортує з shared/, api/ і stores/, але не з іншої фічі.
    name: 'app/feature-boundaries',
    files: ['src/features/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '../*'],
              message: 'Фіча не може імпортувати з іншої фічі — винесіть спільне в shared/.',
            },
          ],
        },
      ],
    },
  },
);
