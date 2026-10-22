import { createRouter, createWebHistory } from 'vue-router';
import { requireAuth, requireGuest, requireRole } from './guards';

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: (to, from, saved) => {
    if (saved) return saved;
    if (to.path === from.path) return undefined;
    return { top: 0 };
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/features/catalog/HomeView.vue'),
      meta: { title: 'Афіша' },
    },
    {
      path: '/soon',
      name: 'soon',
      component: () => import('@/features/catalog/SoonView.vue'),
      meta: { title: 'Скоро' },
    },
    {
      path: '/cinemas',
      name: 'cinemas',
      component: () => import('@/features/catalog/CinemasView.vue'),
      meta: { title: 'Кінотеатри' },
    },
    {
      path: '/movies/:slug',
      name: 'movie',
      component: () => import('@/features/catalog/MovieView.vue'),
      props: true,
    },
    {
      path: '/sessions/:id',
      name: 'session',
      component: () => import('@/features/seat-map/SessionView.vue'),
      props: true,
      meta: { title: 'Вибір місць', hasCartBar: true },
    },
    {
      path: '/checkout/:orderId',
      name: 'checkout',
      component: () => import('@/features/checkout/CheckoutView.vue'),
      props: true,
      beforeEnter: requireAuth,
      meta: { title: 'Оформлення' },
    },
    {
      path: '/checkout/:orderId/result',
      name: 'checkout-result',
      component: () => import('@/features/checkout/ResultView.vue'),
      props: true,
      beforeEnter: requireAuth,
      meta: { title: 'Оплата' },
    },
    {
      path: '/me/tickets',
      name: 'tickets',
      component: () => import('@/features/tickets/MyTicketsView.vue'),
      beforeEnter: requireAuth,
      meta: { title: 'Мої квитки' },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/features/auth/ProfileView.vue'),
      beforeEnter: requireAuth,
      meta: { title: 'Профіль' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/features/auth/LoginView.vue'),
      beforeEnter: requireGuest,
      meta: { title: 'Вхід' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/features/auth/RegisterView.vue'),
      beforeEnter: requireGuest,
      meta: { title: 'Реєстрація' },
    },
    {
      path: '/admin',
      redirect: '/admin/sessions',
    },
    {
      path: '/admin/sessions',
      name: 'admin-sessions',
      component: () => import('@/features/admin/SessionsView.vue'),
      beforeEnter: requireRole('ORGANIZER'),
      meta: { title: 'Розклад сеансів', layout: 'admin' },
    },
    {
      path: '/admin/sessions/:id/sales',
      name: 'admin-sales',
      component: () => import('@/features/admin/SalesView.vue'),
      props: true,
      beforeEnter: requireRole('ORGANIZER'),
      meta: { title: 'Продажі', layout: 'admin' },
    },
    {
      path: '/admin/scan',
      name: 'admin-scan',
      component: () => import('@/features/admin/ScanView.vue'),
      beforeEnter: requireRole('ORGANIZER'),
      meta: { title: 'Сканер квитків', layout: 'admin' },
    },
    {
      path: '/admin/halls',
      name: 'admin-halls',
      component: () => import('@/features/admin/HallsView.vue'),
      beforeEnter: requireRole('ADMIN'),
      meta: { title: 'Зали', layout: 'admin' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/shared/layouts/NotFoundView.vue'),
      meta: { title: 'Сторінку не знайдено' },
    },
  ],
});

router.afterEach((to) => {
  const title = to.meta.title as string | undefined;
  document.title = title ? `${title} · TicketHub` : 'TicketHub — кінотеатр';
});

declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    hasCartBar?: boolean;
    layout?: 'public' | 'admin';
  }
}
