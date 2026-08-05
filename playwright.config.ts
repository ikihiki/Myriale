import { defineConfig, devices } from '@playwright/test';

const storybookPort = Number(process.env.PLAYWRIGHT_STORYBOOK_PORT ?? 6006);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${storybookPort}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npx storybook dev -p ${storybookPort} --host 0.0.0.0 --no-open --ci`,
    url: `http://127.0.0.1:${storybookPort}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_MYRIAL_API_MODE: 'proxy',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
