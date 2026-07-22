import { expect, test } from './fixtures';

const storyId = 'アプリ-myriale-app--direct-open-play-session';

test('ノートはターン画面と分割/全画面/非表示を切り替えられる', async ({ page }) => {
  await page.goto(`/iframe.html?id=${encodeURIComponent(storyId)}&viewMode=story`);

  await expect(page.getByTestId('dialogue-log')).toBeVisible();
  await expect(page.getByTestId('session-notes-side')).toBeVisible();
  await expect(page.getByRole('slider', { name: 'ノート表示比率' })).toBeVisible();

  await page.getByRole('button', { name: '全画面表示', exact: true }).click();
  await expect(page.getByTestId('session-notes-focus')).toBeVisible();
  await expect(page.getByTestId('dialogue-log')).toBeHidden();

  await page.getByRole('button', { name: 'ターン画面に戻る' }).click();
  await expect(page.getByTestId('dialogue-log')).toBeVisible();
  await expect(page.getByTestId('session-notes-side')).toBeVisible();

  await page.getByRole('slider', { name: 'ノート表示比率' }).fill('520');
  await page.getByLabel('ノート表示設定').getByRole('button', { name: 'ノートを非表示' }).click();
  await expect(page.getByTestId('session-notes-side')).toBeHidden();
  await expect(page.getByRole('button', { name: 'ノートを表示' })).toBeVisible();

  await page.getByRole('button', { name: 'ノートを表示' }).click();
  await expect(page.getByTestId('session-notes-side')).toBeVisible();
});
