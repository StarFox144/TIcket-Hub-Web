import { afterEach } from 'vitest';

// Мок-БД і кошик живуть у сховищах — кожен тест починає з чистого аркуша.
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
