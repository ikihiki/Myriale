import { expect, test, type Page } from './fixtures';

const openStory = async (page: Page, id: string) => {
  await page.goto(`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`);
  await expect(page.getByTestId('session-activity-feed')).toBeVisible();
};

test('execution failure remains beside its input with safe diagnostics and retry', async ({ page }) => {
  await openStory(page, 'session-execution-and-artifacts--failed-with-development-diagnostics');
  await expect(page.getByTestId('session-input-item')).toContainText('銀の鍵を扉にかざす');
  const scenarioTurnExecution = page.getByTestId('execution-EXE-scenario-turn-failed');
  await expect(scenarioTurnExecution).not.toContainText('入力内容は保存されています。');
  await expect(scenarioTurnExecution).not.toContainText('Player Inputと既存のNarrativeは保存されています。');
  await expect(scenarioTurnExecution.getByTestId('scenario-turn-public-projection')).toContainText('銀の鍵をかざす');
  await expect(scenarioTurnExecution.getByTestId('scenario-turn-committed-failure')).toContainText('状態、配置、適用結果は確定済み');
  await expect(scenarioTurnExecution.getByTestId('scenario-turn-committed-failure')).toContainText('ルールは再適用されません');
  await expect(scenarioTurnExecution.getByRole('button', { name: '入力取り消し' })).toBeVisible();
  await expect(scenarioTurnExecution.getByRole('button', { name: '閉じる' })).toHaveCount(0);
  const diagnostics = scenarioTurnExecution.locator('details').first();
  await expect(diagnostics).toBeVisible();
  if (await diagnostics.getAttribute('open') === null) await diagnostics.locator('summary').click();
  await expect(diagnostics).toHaveAttribute('open', '');
  await expect(scenarioTurnExecution).toContainText('Authorization=[REDACTED]');
  await expect(scenarioTurnExecution.getByText('送信したプロンプト')).toBeVisible();
  await expect(scenarioTurnExecution.getByText('受信した結果')).toBeVisible();
  await expect(scenarioTurnExecution.getByText('バリデーション結果')).toBeVisible();
  await expect(page.getByText(/Bearer secret/i)).toHaveCount(0);
  await page.getByRole('button', { name: '再試行' }).first().click();
  await expect(page.getByTestId('execution-EXE-scenario-turn-failed')).toHaveCount(1);
});

test('note proposal supports edit-then-apply and image failure stays partial', async ({ page }) => {
  await openStory(page, 'session-execution-and-artifacts--failed-with-development-diagnostics');
  await expect(page.getByText(/場面の画像: 処理を完了できませんでした/)).toBeVisible();
  await expect(page.getByTestId('image-artifact-item')).toBeVisible();
  await page.getByRole('button', { name: '編集して適用' }).click();
  await page.getByLabel('タイトル').fill('編集済みの鍵');
  await page.getByLabel('本文').fill('編集して確認した本文');
  await page.getByRole('button', { name: '編集内容を適用' }).click();
});

test('production story omits developer-only diagnostics', async ({ page }) => {
  await openStory(page, 'session-execution-and-artifacts--production-redaction');
  await expect(page.getByText('開発者向け詳細')).toHaveCount(0);
  const scenarioTurnExecution = page.getByTestId('execution-EXE-scenario-turn-failed');
  await expect(scenarioTurnExecution).not.toContainText('入力内容は保存されています。');
  await expect(scenarioTurnExecution.getByRole('button', { name: '入力取り消し' })).toBeVisible();
});
