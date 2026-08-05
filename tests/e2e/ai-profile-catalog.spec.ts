import { expect, test } from './fixtures';

test('admin can register a profile separately from credentials and carries revision', async ({ page }) => {
  const profiles: Record<string, unknown>[] = [];
  await page.route('**/api/admin/ai-profiles/**', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') return route.fulfill({ json: profiles });
    if (request.method() === 'POST' && new URL(request.url()).pathname.endsWith('/ai-profiles/')) {
      const payload = request.postDataJSON();
      profiles.unshift({ ...payload, adapter: 'openai-compatible', source: 'database', revision: 1, active: false, credentialSource: 'none', credentialConfigured: false, credentialRevision: 0, validationStatus: 'untested', lastValidatedAt: null });
      return route.fulfill({ status: 201, json: profiles[0] });
    }
    return route.fulfill({ status: 204 });
  });
  await page.route('**/api/admin/ai-credentials/**', (route) => route.fulfill({ json: [] }));
  await page.goto('/iframe.html?id=運用-ai-provider-administration--split-profile-and-credential-management&viewMode=story&autoplay=false');
  await expect(page.getByRole('main', { name: 'AI Provider管理' })).toBeVisible({ timeout: 15_000 });

  await page.getByRole('textbox', { name: 'Profile ID' }).fill('acme-e2e');
  await page.getByRole('textbox', { name: 'Profile表示名' }).fill('Acme E2E');
  await page.getByRole('textbox', { name: 'Profile Base URL' }).fill('https://ai.acme.test/v1');
  await page.getByRole('textbox', { name: 'Profile Model' }).fill('acme/e2e-model');
  await page.getByRole('textbox', { name: 'Profile Credential ID' }).fill('acme-secret');
  await page.getByRole('button', { name: 'Profileを保存' }).click();

  const row = page.getByTestId('ai-profile-row-acme-e2e');
  await expect(row).toContainText('Acme E2E');
  await expect(row).toContainText('acme/e2e-model');
  await expect(row).toContainText('database');
  await expect(row).toContainText('r1');
});
