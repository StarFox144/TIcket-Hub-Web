import type { NavigationGuard } from 'vue-router';
import type { User } from '@/api/types';
import { useAuthStore } from '@/stores/auth';

export const requireAuth: NavigationGuard = (to) => {
  const auth = useAuthStore();
  if (!auth.isLoggedIn) return { name: 'login', query: { redirect: to.fullPath } };
};

export const requireGuest: NavigationGuard = () => {
  const auth = useAuthStore();
  if (auth.isLoggedIn) return { name: 'home' };
};

export function requireRole(role: User['role']): NavigationGuard {
  return (to) => {
    const auth = useAuthStore();
    if (!auth.isLoggedIn) return { name: 'login', query: { redirect: to.fullPath } };
    // ADMIN має всі права організатора.
    if (auth.role !== role && auth.role !== 'ADMIN') return { name: 'home' };
  };
}
