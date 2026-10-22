import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { installAuthInterceptors } from './api/client';
import { useAuthStore } from './stores/auth';
import './styles/base.css';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

const auth = useAuthStore(pinia);
installAuthInterceptors({
  getToken: () => auth.accessToken,
  refresh: () => auth.refresh(),
  onAuthFailed: () => {
    auth.logout();
    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
  },
});

app.mount('#app');
