import { expect, test, type Page } from '@playwright/test';

const openStory = async (page: Page, id: string) => {
  await page.goto(`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`);
  await expect(page.getByTestId('session-activity-feed')).toBeVisible();
};

test('execution failure remains beside its input with safe diagnostics and retry', async ({ page }) => {
  await openStory(page, 'session-execution-and-artifacts--failed-with-development-diagnostics');
  await expect(page.getByTestId('session-input-item')).toContainText('銀の鍵を扉にかざす');
  await expect(page.getByRole('alert').filter({ hasText: '物語' })).toContainText('Player Inputと既存のNarrativeは保存されています。');
  const narrativeExecution = page.getByTestId('execution-EXE-narrative-failed');
  await expect(narrativeExecution.locator('details')).toHaveAttribute('open', '');
  await expect(narrativeExecution.getByText(/0123456789abcdef0123456789abcdef/)).toBeVisible();
  await expect(page.getByText(/Bearer secret/i)).toHaveCount(0);
  await page.getByRole('button', { name: '再試行' }).first().click();
  await expect(page.getByTestId('execution-EXE-narrative-failed')).toHaveCount(1);
});

test('note proposal supports edit-then-apply and image failure stays partial', async ({ page }) => {
  await openStory(page, 'session-execution-and-artifacts--failed-with-development-diagnostics');
  await expect(page.getByText(/場面の画像: 生成できませんでした/)).toBeVisible();
  await expect(page.getByTestId('image-artifact-item')).toBeVisible();
  await page.getByRole('button', { name: '編集して適用' }).click();
  await page.getByLabel('タイトル').fill('編集済みの鍵');
  await page.getByLabel('本文').fill('編集して確認した本文');
  await page.getByRole('button', { name: '編集内容を適用' }).click();
});

test('production story omits developer-only diagnostics', async ({ page }) => {
  await openStory(page, 'session-execution-and-artifacts--production-redaction');
  await expect(page.getByText('開発者向け詳細')).toHaveCount(0);
  await expect(page.getByRole('alert').filter({ hasText: '物語' })).toContainText('Player Inputと既存のNarrativeは保存されています。');
});
