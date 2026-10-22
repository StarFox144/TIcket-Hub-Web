import { useRoute, useRouter } from 'vue-router';

/** Після входу — повернення туди, де був користувач. */
export function useRedirectBack() {
  const route = useRoute();
  const router = useRouter();

  const target = () => {
    const r = route.query.redirect;
    // лише внутрішні шляхи, щоб не стати open redirect
    return typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') ? r : '/';
  };

  return { target, go: () => router.replace(target()) };
}
