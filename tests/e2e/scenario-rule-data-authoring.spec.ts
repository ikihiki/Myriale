import { expect, test, type Page } from './fixtures';

const openStory = async (page: Page, id: string) => {
  await page.goto(`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`);
  await expect(page.getByRole('main', { name: 'シナリオ登録ウィザード' })).toBeVisible({ timeout: 15_000 });
};

test('Object Typeの状態とAI向けアクションを定義できる', async ({ page }) => {
  await openStory(page, 'ユーザーストーリー-scenario-registration--us-23-define-object-type-states-and-actions');
  await page.getByRole('button', { name: '世界データへ' }).click();
  await page.getByRole('button', { name: '種類を追加' }).click();
  await page.getByLabel('種類のstable code').fill('sealed-door');
  await page.getByLabel('種類の表示名').fill('隔壁扉');
  await page.getByRole('button', { name: '状態を追加' }).click();
  await expect(page.locator('[role="dialog"][data-layer="0"]')).toHaveCSS('z-index', '110');
  await expect(page.getByRole('dialog', { name: '新しい状態' })).toHaveAttribute('data-layer', '1');
  await expect(page.getByRole('dialog', { name: '新しい状態' })).toHaveCSS('z-index', '210');
  await page.getByRole('combobox', { name: '状態1の型' }).click();
  await expect(page.getByRole('option', { name: '文字列' })).toBeVisible();
  await expect(page.locator('.myr-ui-select-content')).toHaveCSS('z-index', '220');
  await page.getByRole('option', { name: '真偽' }).click();
  await page.getByLabel('状態1のcode').fill('open');
  await page.getByRole('button', { name: '状態の編集を完了' }).click();
  await page.getByRole('button', { name: 'アクションを追加' }).click();
  await page.getByLabel('アクション1のcode').fill('open');
  await page.getByLabel('アクション1の表示名').fill('扉を開ける');
  await page.getByRole('button', { name: '引数を追加' }).click();
  await expect(page.getByRole('dialog', { name: '新しい引数' })).toHaveAttribute('data-layer', '2');
  await page.getByLabel('アクション1の引数1code').fill('force');
  await page.getByRole('button', { name: '引数の編集を完了' }).click();

  await expect(page.getByLabel('種類のstable code')).toHaveValue('sealed-door');
  await expect(page.getByRole('combobox', { name: 'アクション1の公開先' })).toContainText('AI候補');
  await expect(page.getByRole('button', { name: '新しい引数を編集' })).toBeVisible();
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

test('保存済みObject Typeを編集してシナリオ変更を保存できる', async ({ page }) => {
  await page.goto('/iframe.html?id=ユーザーストーリー-edit-scenario--use-11-edit-rule-data-with-stable-codes&viewMode=story');
  await expect(page.getByRole('main', { name: 'シナリオ編集ウィザード' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: '世界データへ' }).click();
  await page.getByRole('button', { name: '書庫の扉を編集', exact: true }).click();

  await expect(page.getByRole('dialog', { name: '書庫の扉' })).toBeVisible();
  await page.getByLabel('種類の表示名').fill('封印書庫の扉');
  await expect(page.getByLabel('種類のstable code')).toHaveValue('archive-door');
  await page.getByRole('button', { name: '編集を完了' }).click();
  await page.getByRole('button', { name: '変更を保存' }).click();

  await expect(page.getByTestId('scenario-notice')).toContainText('変更を保存しました');
});
