import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

const aspireApiUrl = process.env['services__myriale-api__http__0'];
const configuredApiUrl = process.env.VITE_MYRIAL_API_BASE_URL;
const apiProxyTarget = process.env.MYRIALE_API_PROXY_TARGET ?? aspireApiUrl ?? configuredApiUrl ?? 'http://localhost:5080';

export default defineConfig({
  plugins: [tanstackRouter({ target: 'react' }), react()],
  server: {
    allowedHosts: [
      '5173--main--green-mackerel-33--ibuki-90.coder.dev.sakuraya.cloud',
      '.forge.internal.sakuraya.cloud',
    ],
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
});
