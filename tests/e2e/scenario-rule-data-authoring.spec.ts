import { expect, test, type Page } from './fixtures';

const openStory = async (page: Page, id: string) => {
  await page.goto(`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`);
  await expect(page.getByRole('main', { name: 'シナリオ登録ウィザード' })).toBeVisible({ timeout: 15_000 });
};

test('Object Typeの状態とAI向けアクションを定義できる', async ({ page }) => {
  await openStory(page, 'ユーザーストーリー-scenario-registration--us-23-define-object-type-states-and-actions');
  await page.getByRole('button', { name: '種類と状態へ' }).click();
  await page.getByRole('button', { name: '種類を追加' }).click();
  await page.getByLabel('種類のstable code').fill('sealed-door');
  await page.getByLabel('種類の表示名').fill('隔壁扉');
  await page.getByRole('button', { name: '状態を追加' }).click();
  await page.getByLabel('状態1のcode').fill('open');
  await page.getByRole('button', { name: 'アクションを追加' }).click();
  await page.getByLabel('アクション1のcode').fill('open');
  await page.getByLabel('アクション1の表示名').fill('扉を開ける');

  await expect(page.getByLabel('種類のstable code')).toHaveValue('sealed-door');
  await expect(page.getByRole('combobox', { name: 'アクション1の公開先' })).toContainText('AI候補');
});

test('Objectの決定的なアクション結果と公開準備を確認できる', async ({ page }) => {
  await openStory(page, 'ユーザーストーリー-scenario-registration--us-25-author-deterministic-action-results');
  await page.getByRole('button', { name: 'アクション結果へ' }).click();

  await expect(page.getByTestId('rule-result-preview')).toContainText('北書庫の扉');
  await expect(page.getByTestId('rule-result-preview')).toContainText('2 effect');
  await expect(page.getByText('1. set-state')).toBeVisible();
  await expect(page.getByText('2. emit-fact')).toBeVisible();
  await expect(page.getByTestId('rule-readiness')).toContainText('決定的です');
});

test('不完全なルールでも警告付きでDraft保存できる', async ({ page }) => {
  await openStory(page, 'ユーザーストーリー-scenario-registration--us-27-save-incomplete-rule-data-as-draft');
  await page.getByRole('button', { name: 'アクション結果へ' }).click();
  await page.getByRole('button', { name: 'この結果を削除' }).click();
  await page.getByRole('button', { name: '下書き保存' }).click();

  await expect(page.getByRole('region', { name: '公開準備チェック' })).toContainText('結果が未設定');
  await expect(page.getByTestId('scenario-notice')).toContainText('Draftとして保存しました');
  await expect(page.getByTestId('scenario-notice')).toContainText('未設定項目が1件');
});
