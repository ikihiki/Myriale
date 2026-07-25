import { expect, test } from './fixtures';

const storyId = 'デモ-session-西の扉を開けて外へ出る--e-2-e-manual-flow';

test('natural-language west-door traversal commits open state, movement, and narrative', async ({ page }) => {
  await page.goto(`/iframe.html?id=${encodeURIComponent(storyId)}&viewMode=story`);

  const composer = page.getByLabel('自由に行動や会話を入力');
  await expect(page.getByTestId('session-activity-feed')).toContainText('西の扉と東の扉');
  await composer.fill('西の扉を開けて外に出る');
  await page.getByRole('button', { name: '行動を送る' }).click();

  await expect(page.getByTestId('scenario-turn-public-projection')).toContainText('西の扉 / 扉を開けて外へ出る');
  await expect(page.getByTestId('scenario-turn-selected-state')).toContainText('open=true');
  await expect(page.getByTestId('scenario-turn-location-transition')).toContainText('地下研究室 → 研究施設の外');
  await expect(page.getByTestId('scenario-turn-public-projection')).toContainText('プレイヤーは研究施設の外へ出た');
  await expect(page.getByTestId('session-activity-feed').getByText(/あなたは研究施設の外へ踏み出した/)).toBeVisible();
  await expect(composer).toBeEnabled();
  await expect(composer).toHaveValue('');
});
