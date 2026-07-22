import { expect, test as base } from '@playwright/test';

export const test = base.extend<{ mockAuthenticatedAccount: void }>({
  mockAuthenticatedAccount: [async ({ page }, use) => {
    await page.route('**/api/account/me', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'USR-E2E-ACCOUNT',
        displayName: 'E2Eプレイヤー',
        email: 'e2e-player@myriale.invalid',
        bio: '',
        emailConfirmed: true,
        state: 'active',
        canDebugDialogue: true,
      }),
    }));
    await page.route('**/api/sessions/*/memory/', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ lorebook: [], summaries: [] }),
    }));
    await use();
  }, { auto: true }],
});

export { expect };
export type { Page, Route } from '@playwright/test';
