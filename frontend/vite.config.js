import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward /api calls to the Spring Boot backend during local dev
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Spring Security's OAuth2 login kickoff (/oauth2/authorization/google)
      // and its callback (/login/oauth2/code/google) both live on the
      // backend, not the Vite dev server — proxy those too or the Google
      // sign-in button and its return trip will 404.
      '/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/login/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
