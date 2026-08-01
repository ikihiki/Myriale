import { expect, test } from './fixtures';

test('admin can register an arbitrary OpenAI-compatible profile definition', async ({ page }) => {
  const profiles: Record<string, unknown>[] = [];
  await page.route('**/api/admin/ai-keys/**', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') return route.fulfill({ json: profiles });
    if (request.method() === 'PUT') {
      const payload = request.postDataJSON();
      const provider = decodeURIComponent(new URL(request.url()).pathname.split('/').pop()!);
      const profile = { provider, ...payload, definitionSource: 'database', configured: Boolean(payload.secret), maskedKey: '••••••••test', credentialSource: 'database', active: false, status: 'saved', updatedAt: new Date().toISOString(), lastValidatedAt: null };
      profiles.unshift(profile);
      return route.fulfill({ json: profile });
    }
    return route.fulfill({ status: 204 });
  });
  await page.goto('/iframe.html?id=ユーザーストーリー-user-management--um-17-admin-ai-keys&viewMode=story&autoplay=false');
  await expect(page.getByRole('main', { name: 'AI Provider管理' })).toBeVisible({ timeout: 15_000 });

  await page.getByRole('textbox', { name: 'Profile ID' }).fill('acme-e2e');
  await page.getByRole('textbox', { name: '表示名' }).fill('Acme E2E');
  await page.getByRole('textbox', { name: 'Base URL' }).fill('https://ai.acme.test/v1');
  await page.getByRole('textbox', { name: 'Model' }).fill('acme/e2e-model');
  await page.getByRole('button', { name: 'Profileを保存' }).click();

  const row = page.getByTestId('ai-key-row-acme-e2e');
  await expect(row).toContainText('Acme E2E');
  await expect(row).toContainText('acme/e2e-model');
  await expect(row).toContainText('database');
});
