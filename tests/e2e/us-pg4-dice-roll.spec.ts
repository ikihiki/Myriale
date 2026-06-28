import { expect, test } from '@playwright/test';

const storyId = 'ユーザーストーリー-program-driven-narrative--uspg-04-roll-dice';

test('US-PG4: Storybook上でダイス固定値6の判定結果を確認できる', async ({ page }) => {
  await page.goto(`/iframe.html?id=${encodeURIComponent(storyId)}&viewMode=story`);

  // Storybook の play 関数が実ブラウザ上で「固定値6を選択 → 判定開始 → ダイスを振る」を実行する。
  await expect(page.getByTestId('mode-badge')).toHaveText('判定中');
  await expect(page.getByTestId('roll-result')).toHaveText('d6 = 6 → 成功');
  await expect(page.getByTestId('program-log')).toContainText('ROLL: d6=6（成功）');
  await expect(page.getByTestId('summary-roll')).toHaveText('d6=6（成功）');

  await expect(page.getByRole('button', { name: 'デバッグパネルを表示' })).toBeVisible();
  await expect(page.getByText('Play contract')).toBeHidden();
  await page.getByRole('button', { name: 'デバッグパネルを表示' }).click();
  await expect(page.getByRole('heading', { name: 'Play contract' })).toBeVisible();
  await expect(page.getByRole('region', { name: '条件によるモード遷移' })).toBeVisible();
  await page.getByRole('button', { name: 'デバッグパネルを非表示' }).click();
  await expect(page.getByText('Play contract')).toBeHidden();
});
