import type { StorybookConfig } from '@storybook/react-vite';

const aspireApiUrl = process.env['services__myriale-api__http__0'];
const configuredApiUrl = process.env.VITE_MYRIAL_API_BASE_URL;
const apiProxyTarget = aspireApiUrl ?? configuredApiUrl ?? 'http://localhost:5080';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  addons: ['@storybook/addon-actions', '@storybook/addon-controls', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    config.server = {
      ...config.server,
      allowedHosts: true,
      host: '0.0.0.0',
      proxy: {
        ...config.server?.proxy,
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    };
    config.resolve = {
      ...config.resolve,
      dedupe: [...(config.resolve?.dedupe ?? []), 'react', 'react-dom'],
    };
    return config;
  },
};

export default config;
