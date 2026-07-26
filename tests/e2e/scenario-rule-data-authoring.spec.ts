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

test('Object側の統合rule tableとread-only effective結果を確認できる', async ({ page }) => {
  await openStory(page, 'ユーザーストーリー-scenario-registration--us-25-author-deterministic-action-results');

  await expect(page.getByRole('dialog', { name: 'generic-open' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/override \/ delete \/ adjustを開始することはできません/)).toBeVisible();
  await expect(page.getByLabel('実行ルールの優先度')).toHaveCount(0);
  await expect(page.getByText('set-state → emit-fact')).toBeVisible();
  await page.getByRole('button', { name: '閉じる', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Object states' })).toContainText('開いている');
  await expect(page.getByRole('table', { name: 'Object actions' })).toContainText('扉を開ける');
  await expect(page.getByRole('table', { name: 'Object rules' })).toContainText('archive-door:generic-open');
  await expect(page.getByTestId('rule-readiness')).toContainText('決定的です');
});

test('西の扉seedを統合テーブルで編集し既存mutationと一緒に保存できる', async ({ page }) => {
  await openStory(page, 'ユーザーストーリー-scenario-registration--author-west-door-seed-with-eight-ordered-effects');

  await expect(page.getByTestId('scenario-notice')).toContainText('Draftとして保存しました', { timeout: 15_000 });
  await page.getByRole('button', { name: '西の扉を編集' }).click();
  const states = page.getByRole('table', { name: 'Object states' });
  const actions = page.getByRole('table', { name: 'Object actions' });
  const rules = page.getByRole('table', { name: 'Object rules' });
  await expect(states).toContainText('開いている');
  await expect(states).toContainText('方向');
  await expect(states).not.toContainText('mixin由来');
  await expect(actions).toContainText('出口を詳しく確認する');
  await expect(actions).not.toContainText('Object固有');
  await expect(rules).toContainText('exit-door:generic-open-and-exit');
  await expect(rules).toContainText('local:west-inspect-exit');

  await page.getByRole('button', { name: 'openの状態を確認' }).click();
  await expect(page.getByLabel('openの初期値')).toHaveValue('true');
  await expect(page.getByLabel('Object state code')).toHaveCount(0);
  await page.getByRole('button', { name: '閉じる', exact: true }).click();

  await page.getByRole('button', { name: 'openのアクションを確認' }).click();
  await expect(page.getByLabel('Object action code')).toHaveCount(0);
  await expect(page.getByText('この項目の定義はObject種類側で変更します。')).toBeVisible();
  await page.getByRole('button', { name: '閉じる', exact: true }).click();

  await page.getByRole('button', { name: 'exit-door:generic-open-and-exitの実行ルールを確認' }).click();
  await expect(page.getByLabel('実行ルールの優先度')).toHaveCount(0);
  await expect(page.getByText(/set-state → move-session → emit-fact/)).toBeVisible();
  await page.getByRole('button', { name: '閉じる', exact: true }).click();

  await page.getByRole('button', { name: 'local:west-inspect-exitの実行ルールを確認' }).click();
  await expect(page.getByLabel('実行ルールの優先度')).toHaveValue('95');
});

test('既存mutationをread-onlyで表示したままDraft保存できる', async ({ page }) => {
  await openStory(page, 'ユーザーストーリー-scenario-registration--us-27-save-incomplete-rule-data-as-draft');
  await expect(page.getByTestId('scenario-notice')).toContainText('Draftとして保存しました', { timeout: 15_000 });
  await page.getByRole('button', { name: '北書庫の扉を編集' }).click();
  await expect(page.getByRole('button', { name: 'archive-door:generic-openの実行ルールを確認' })).toBeVisible();
});

test('保存済みObject Typeを編集してシナリオ変更を保存できる', async ({ page }) => {
  await page.goto('/iframe.html?id=ユーザーストーリー-edit-scenario--use-11-edit-rule-data-with-stable-codes&viewMode=story');
  await expect(page.getByRole('main', { name: 'シナリオ編集ウィザード' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('scenario-notice')).toContainText('変更を保存しました', { timeout: 15_000 });
  await page.getByRole('button', { name: '北書庫の扉を編集' }).click();
  await expect(page.getByRole('table', { name: 'Object states' })).toContainText('開いている');
  await expect(page.getByRole('table', { name: 'Object actions' })).toContainText('扉を開ける');
  await page.getByRole('button', { name: 'archive-door:generic-openの実行ルールを確認' }).click();
  await expect(page.getByLabel('実行ルールの優先度')).toHaveCount(0);
  await expect(page.getByTestId('rule-readiness')).toContainText('決定的です');
});
