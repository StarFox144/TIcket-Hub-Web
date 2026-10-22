import type { Config } from 'tailwindcss';

// Кольори беруться з CSS-змінних у src/styles/tokens.css (RGB-канали),
// тож працюють модифікатори прозорості: bg-accent/20, border-text/10.
const token = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        raised: token('surface-raised'),
        text: token('text'),
        muted: token('text-muted'),
        accent: {
          DEFAULT: token('accent'),
          hover: token('accent-hover'),
          dark: token('accent-dark'),
          text: token('accent-text'),
        },
        gold: token('gold'),
        seat: {
          free: token('seat-free'),
          comfort: token('seat-comfort'),
          taken: token('seat-taken'),
        },
        success: token('success'),
        danger: token('danger'),
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        pill: 'var(--r-pill)',
      },
      boxShadow: {
        glow: 'var(--glow)',
        'glow-sm': 'var(--glow-sm)',
        card: 'var(--shadow-card)',
      },
      transitionTimingFunction: { out: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      transitionDuration: { DEFAULT: '250ms' },
      maxWidth: { container: '1200px' },
    },
  },
  plugins: [],
} satisfies Config;
