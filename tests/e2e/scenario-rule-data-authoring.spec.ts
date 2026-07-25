import { expect, test, type Page } from './fixtures';

const openStory = async (page: Page, id: string) => {
  await page.goto(`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`);
  await expect(page.locator('#storybook-root')).not.toBeEmpty({ timeout: 15_000 });
};

test('Object Typeの状態とAI向けアクションを定義できる', async ({ page }) => {
  await openStory(page, 'ユーザーストーリー-scenario-registration--us-23-define-object-type-states-and-actions');

  await expect(page.getByRole('dialog', { name: '扉を開ける' })).toHaveAttribute('data-layer', '1');
  await expect(page.getByLabel('アクション1のcode')).toHaveValue('open');
  await expect(page.getByRole('combobox', { name: 'アクション1の公開先' })).toContainText('AI候補');
  await page.getByRole('button', { name: 'アクションの編集を完了' }).click();
  await expect(page.getByRole('dialog', { name: '隔壁扉' })).toHaveAttribute('data-layer', '0');
  await expect(page.getByLabel('種類のstable code')).toHaveValue('sealed-door');
  await expect(page.getByRole('button', { name: '新しい状態を編集' })).toBeVisible();
});

test('Objectの決定的なアクション結果と公開準備を確認できる', async ({ page }) => {
  await openStory(page, 'ユーザーストーリー-scenario-registration--us-25-author-deterministic-action-results');
  await page.getByRole('button', { name: 'アクション結果へ' }).click();

  await expect(page.getByTestId('rule-result-preview')).toContainText('北書庫の扉');
  await expect(page.getByTestId('rule-result-preview')).toContainText('2 effect');
  await expect(page.getByText('1. 状態を更新')).toBeVisible();
  await expect(page.getByText('2. 確定した事実を追加')).toBeVisible();
  await expect(page.getByTestId('rule-readiness')).toContainText('決定的です');
});

test('西の扉seedの8 effectを表示・編集・並べ替え・保存できる', async ({ page }) => {
  await openStory(page, 'ユーザーストーリー-scenario-registration--author-west-door-seed-with-eight-ordered-effects');

  await expect(page.getByTestId('rule-result-preview')).toContainText('8 effect');
  await expect(page.getByLabel('5番目の出来事の名前')).toHaveValue('player-left-building');
  await expect(page.getByLabel('5番目の出来事の場所code')).toHaveValue('outside');
  await expect(page.getByLabel('6番目の文章')).toHaveValue('まだ室内にいる');
  await expect(page.getByTestId('scenario-notice')).toContainText('Draftとして保存しました');
});

test('不完全なルールでも警告付きでDraft保存できる', async ({ page }) => {
  await openStory(page, 'ユーザーストーリー-scenario-registration--us-27-save-incomplete-rule-data-as-draft');

  await expect(page.getByRole('region', { name: '公開準備チェック' })).toContainText('結果が未設定');
  await expect(page.getByTestId('scenario-notice')).toContainText('Draftとして保存しました');
  await expect(page.getByTestId('scenario-notice')).toContainText('未設定項目が1件');
});

test('保存済みObject Typeを編集してシナリオ変更を保存できる', async ({ page }) => {
  await page.goto('/iframe.html?id=ユーザーストーリー-edit-scenario--use-11-edit-rule-data-with-stable-codes&viewMode=story');
  await expect(page.getByRole('main', { name: 'シナリオ編集ウィザード' })).toBeVisible({ timeout: 15_000 });

  await expect(page.getByTestId('rule-readiness')).toContainText('決定的です');
  await expect(page.getByTestId('scenario-notice')).toContainText('変更を保存しました');
});
