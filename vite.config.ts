import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const aspireApiUrl = process.env['services__myriale-api__http__0'];
const configuredApiUrl = process.env.VITE_MYRIAL_API_BASE_URL;
const apiProxyTarget = aspireApiUrl ?? configuredApiUrl ?? 'http://localhost:5080';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['5173--main--green-mackerel-33--ibuki-90.coder.dev.sakuraya.cloud'],
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
});
