import { expect, test } from './fixtures';

const storyId = 'ユーザーストーリー-program-driven-narrative--uspg-04-roll-dice';

test('US-PG4: Storybook上でダイス固定値6の判定結果を確認できる', async ({ page }) => {
  await page.goto(`/iframe.html?id=${encodeURIComponent(storyId)}&viewMode=story`);

  // Storybook interactionと同じ操作をブラウザから明示的に再現し、固定値により決定的にする。
  if (await page.getByTestId('mode-badge').count() === 0) {
    const debugToggle = page.getByRole('button', { name: 'デバッグパネルを表示' });
    if (await debugToggle.isVisible()) await debugToggle.click();
    await page.getByRole('combobox', { name: 'ダイス固定値' }).click();
    await page.getByRole('option', { name: '6' }).click();
    await page.getByRole('button', { name: '判定を開始' }).click();
    await page.getByTestId('roll-button').click();
  }
  await expect(page.getByTestId('mode-badge')).toHaveText('判定中');
  await expect(page.getByTestId('roll-result')).toHaveText('d6 = 6 → 成功');
  await expect(page.getByTestId('program-log')).toContainText('ROLL: d6=6（成功）');
  await expect(page.getByTestId('summary-roll')).toHaveText('d6=6（成功）');

  const showDebugPanel = page.getByRole('button', { name: 'デバッグパネルを表示' });
  if (await showDebugPanel.isVisible()) await showDebugPanel.click();
  await expect(page.getByRole('heading', { name: 'Play contract' })).toBeVisible();
  await expect(page.getByRole('region', { name: '条件によるモード遷移' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'デバッグパネルを非表示' })).toBeVisible();
});
