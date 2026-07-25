import { expect, test, type Page } from './fixtures';

const openStory = async (page: Page, id: string) => {
  await page.goto(`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`);
  await expect(page.locator('#storybook-root')).not.toBeEmpty({ timeout: 15_000 });
};

test('Object Typeの状態とAI向けアクションを定義できる', async ({ page }) => {
  await openStory(page, 'ユーザーストーリー-scenario-registration--us-23-define-object-type-states-and-actions');

  await expect(page.getByRole('dialog', { name: '扉を開ける' })).toHaveAttribute('data-layer', '1');
  await expect(page.getByLabel('Type generic configuration action code 1')).toHaveValue('open');
  await expect(page.getByRole('combobox', { name: 'visibility' })).toContainText('AI choice');
  await expect(page.getByRole('combobox', { name: '提示条件' })).toContainText('常に提示');
  await page.getByRole('button', { name: 'アクションの編集を完了' }).click();
  await expect(page.getByRole('dialog', { name: '隔壁扉' })).toHaveAttribute('data-layer', '0');
  await expect(page.getByLabel('種類のstable code')).toHaveValue('sealed-door');
  await expect(page.getByRole('button', { name: '新しい状態を編集' })).toBeVisible();
});

test('Object側のeffective ruleとadjust operationを確認できる', async ({ page }) => {
  await openStory(page, 'ユーザーストーリー-scenario-registration--us-25-author-deterministic-action-results');

  await expect(page.getByRole('dialog', { name: 'adjust' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('rule-result-preview')).toContainText('generic-open');
  await expect(page.getByTestId('rule-result-preview')).toContainText('2 effect');
  await expect(page.getByLabel('実行ルールの優先度')).toHaveValue('100');
  await expect(page.getByLabel('実行ルールのアクション')).toHaveAttribute('readonly');
  await expect(page.getByText('1. 状態を更新')).toBeVisible();
  await expect(page.getByText('2. 確定した事実を追加')).toBeVisible();
  await page.getByRole('button', { name: 'operationの編集を完了' }).click();
  await expect(page.getByRole('heading', { name: 'Effective rules' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'adjusted' })).toBeVisible();
  await expect(page.getByTestId('rule-readiness')).toContainText('決定的です');
  await expect(page.getByText('オブジェクト別の実行ルール', { exact: true })).toHaveCount(0);
});

test('西の扉seedの8 effectを表示・編集・並べ替え・保存できる', async ({ page }) => {
  await openStory(page, 'ユーザーストーリー-scenario-registration--author-west-door-seed-with-eight-ordered-effects');

  await expect(page.getByTestId('scenario-notice')).toContainText('Draftとして保存しました', { timeout: 15_000 });
  await page.getByRole('button', { name: '西の扉を編集' }).click();
  const mixins = page.getByRole('region', { name: 'ordered Type mixins' });
  await expect(mixins).toContainText('開閉可能');
  await expect(mixins).toContainText('出口の扉');
  await page.getByRole('button', { name: '出口の扉を削除' }).click();
  await page.getByRole('button', { name: 'Type mixinを追加' }).click();
  const searchPane = page.getByRole('dialog', { name: '追加するType mixinを選ぶ' });
  await expect(searchPane).toHaveAttribute('data-layer', '1');
  await expect(searchPane.getByRole('button', { name: '開閉可能は追加済み' })).toBeDisabled();
  const search = searchPane.getByRole('searchbox', { name: '種類を検索' });
  await expect(search).toBeFocused();
  await search.fill('EXIT-DOOR');
  await expect(searchPane.getByRole('cell', { name: /^出口の扉$/ })).toBeVisible();
  await expect(searchPane.getByRole('cell', { name: '開閉状態を持ち、外へ出るための扉。' })).toBeVisible();
  await searchPane.getByRole('button', { name: '出口の扉を追加' }).click();
  await expect(searchPane).toBeHidden();
  await expect(mixins.locator('div').filter({ hasText: '出口の扉' }).last()).toBeVisible();
  const orderedMixinText = await mixins.textContent();
  expect(orderedMixinText?.indexOf('開閉可能')).toBeLessThan(orderedMixinText?.indexOf('出口の扉') ?? -1);
  const rules = page.getByRole('region', { name: 'Object effective rules' });
  await expect(rules).toContainText('inherited');
  await expect(rules).toContainText('overridden');
  await expect(rules).toContainText('added');
  await page.getByRole('button', { name: 'generic-open-and-exit operationを編集' }).click();
  await expect(page.getByTestId('rule-result-preview')).toContainText('8 effect');
  await expect(page.getByLabel('実行ルールのアクション')).toHaveAttribute('readonly');
  await expect(page.getByLabel('5番目の出来事の名前')).toHaveValue('player-left-building');
  await expect(page.getByLabel('5番目の出来事の場所code')).toHaveValue('outside');
  await expect(page.getByLabel('6番目の文章')).toHaveValue('まだ室内にいる');
});

test('不完全なルールでも警告付きでDraft保存できる', async ({ page }) => {
  await openStory(page, 'ユーザーストーリー-scenario-registration--us-27-save-incomplete-rule-data-as-draft');

  await expect(page.getByRole('region', { name: '公開準備チェック' })).toContainText('実行ルールが未設定');
  await expect(page.getByTestId('scenario-notice')).toContainText('Draftとして保存しました');
  await expect(page.getByTestId('scenario-notice')).toContainText('未設定項目が1件');
});

test('保存済みObject Typeを編集してシナリオ変更を保存できる', async ({ page }) => {
  await page.goto('/iframe.html?id=ユーザーストーリー-edit-scenario--use-11-edit-rule-data-with-stable-codes&viewMode=story');
  await expect(page.getByRole('main', { name: 'シナリオ編集ウィザード' })).toBeVisible({ timeout: 15_000 });

  await expect(page.getByTestId('scenario-notice')).toContainText('変更を保存しました', { timeout: 15_000 });
  await page.getByRole('button', { name: /^封印書庫の扉を編集$/ }).click();
  await expect(page.getByRole('button', { name: 'generic-open generic ruleを編集' })).toBeVisible();
  await page.getByRole('button', { name: '編集を完了' }).click();
  await page.getByRole('button', { name: '北書庫の扉を編集' }).click();
  await expect(page.getByRole('button', { name: 'generic-open operationを編集' })).toBeVisible();
  await expect(page.getByTestId('rule-readiness')).toContainText('決定的です');
});
