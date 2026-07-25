import { expect, test, type Page } from './fixtures';

const openStory = async (page: Page, id: string) => {
  await page.goto(`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`);
  await expect(page.locator('#storybook-root')).not.toBeEmpty({ timeout: 15_000 });
};

test('EditPaneをドラッグでリサイズし、reload後もlayer幅を復元する', async ({ page }, testInfo) => {
  await page.goto('/iframe.html');
  await page.evaluate(() => window.localStorage.removeItem('myriale:edit-pane-width:0'));
  await openStory(page, 'コンポーネント-editpane--desktop-right-pane');

  const dialog = page.getByRole('dialog', { name: '霧の図書館' });
  const separator = page.getByRole('separator', { name: '編集ペインの幅を変更' });
  await expect(dialog).toBeVisible();
  await expect(separator).toHaveAttribute('aria-orientation', 'vertical');

  const separatorBox = await separator.boundingBox();
  expect(separatorBox).not.toBeNull();
  await page.mouse.move(separatorBox!.x + separatorBox!.width / 2, separatorBox!.y + 100);
  await page.mouse.down();
  await page.mouse.move(350, separatorBox!.y + 100, { steps: 8 });
  await page.mouse.up();

  await expect(separator).toHaveAttribute('aria-valuenow', '930');
  await expect.poll(async () => (await dialog.boundingBox())?.width).toBe(930);
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('myriale:edit-pane-width:0'))).toBe('930');
  await page.screenshot({ path: testInfo.outputPath('edit-pane-resized.png'), fullPage: true });

  await page.reload();
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await expect(separator).toHaveAttribute('aria-valuenow', '930');
  await expect.poll(async () => (await dialog.boundingBox())?.width).toBe(930);
  await page.screenshot({ path: testInfo.outputPath('edit-pane-restored.png'), fullPage: true });
});

test('EditPaneはmobileで全幅になり、Select portalとEscape階層を保つ', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStory(page, 'コンポーネント-editpane--desktop-right-pane');
  const mobileDialog = page.getByRole('dialog', { name: '霧の図書館' });
  await expect.poll(async () => (await mobileDialog.boundingBox())?.width).toBe(390);

  await page.setViewportSize({ width: 1280, height: 900 });
  await openStory(page, 'コンポーネント-editpane--select-portal-and-escape-hierarchy');
  await page.getByRole('button', { name: 'ポータル検証を開く' }).click();
  await page.getByRole('button', { name: '子ペインを開く' }).click();

  const child = page.getByRole('dialog', { name: '子ペイン' });
  const parentSurface = page.locator('[data-edit-pane-layer="0"]');
  await child.getByRole('combobox', { name: '語り口' }).click();
  const option = page.getByRole('option', { name: '熾火' });
  await expect(option).toBeVisible();
  await expect.poll(() => option.evaluate((node) => Boolean(node.closest('[data-edit-pane-layer="1"]')))).toBe(true);
  await option.click();
  await expect(page.getByTestId('selected-tone')).toContainText('ember');
  await expect(child).toBeVisible();
  await expect(parentSurface).toHaveCount(1);

  await child.getByRole('combobox', { name: '語り口' }).click();
  const selectContent = page.locator('[data-edit-pane-floating-layer="1"]');
  await selectContent.click({ position: { x: 5, y: 5 } });
  await expect(child).toBeVisible();
  await expect(parentSurface).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(selectContent).toBeHidden();
  await child.getByRole('button', { name: '近くの操作' }).click();
  await expect(child).toBeVisible();

  await child.getByRole('combobox', { name: '語り口' }).click();
  await expect(selectContent).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('edit-pane-select-portal.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await expect(selectContent).toBeHidden();
  await expect(child).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(child).toBeHidden();
  await expect(page.getByRole('dialog', { name: '親ペイン' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '親ペイン' })).toBeHidden();
});
