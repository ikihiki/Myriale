import type { StorybookConfig } from '@storybook/react-vite';

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
    };
    config.resolve = {
      ...config.resolve,
      dedupe: [...(config.resolve?.dedupe ?? []), 'react', 'react-dom'],
    };
    return config;
  },
};

export default config;
