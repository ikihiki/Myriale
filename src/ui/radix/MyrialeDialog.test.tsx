import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from '../../components/ui';
import { MyrialeDialogClose, MyrialeDialogContent, MyrialeDialogRoot, MyrialeDialogTrigger } from './MyrialeDialog';

afterEach(cleanup);

describe('MyrialeDialogContent', () => {
  it.each([
    ['default', 'w-[min(540px,calc(100vw-32px))]'],
    ['wide', 'w-[min(620px,calc(100vw-32px))]'],
    ['editor', 'w-[min(760px,calc(100vw-32px))]'],
  ] as const)('applies the %s size role and responsive width', (size, widthClassName) => {
    render(
      <MyrialeDialogRoot open>
        <MyrialeDialogContent title={`${size} dialog`} description="Dialog description" size={size} portal={false}>
          Dialog body
        </MyrialeDialogContent>
      </MyrialeDialogRoot>,
    );

    const dialog = screen.getByRole('dialog', { name: `${size} dialog` });
    expect(dialog.getAttribute('data-size')).toBe(size);
    expect(dialog.getAttribute('data-tone')).toBe('default');
    expect(dialog.classList.contains(widthClassName)).toBe(true);
    expect(dialog.classList.contains('max-sm:w-[calc(100vw-24px)]')).toBe(true);
  });

  it('applies warning tone roles and renders ordered footer actions', () => {
    render(
      <MyrialeDialogRoot open>
        <MyrialeDialogContent
          title="危険な操作"
          description="元に戻せません。"
          tone="warning"
          portal={false}
          footer={<><Button variant="danger">実行</Button><Button variant="ghost">キャンセル</Button></>}
        >
          確認内容
        </MyrialeDialogContent>
      </MyrialeDialogRoot>,
    );

    const dialog = screen.getByRole('dialog', { name: '危険な操作' });
    expect(dialog.getAttribute('data-tone')).toBe('warning');
    expect(dialog.classList.contains('border-myr-ruby/35')).toBe(true);
    expect(screen.getByRole('heading', { name: '危険な操作' }).classList.contains('text-myr-ruby')).toBe(true);
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['実行', 'キャンセル', '×']);
  });

  it('keeps focus inside, exposes accessible naming, closes with Escape, and restores trigger focus', async () => {
    render(
      <MyrialeDialogRoot>
        <MyrialeDialogTrigger asChild><Button>Dialogを開く</Button></MyrialeDialogTrigger>
        <MyrialeDialogContent
          title="アクセシブルDialog"
          description="操作の説明"
          footer={<MyrialeDialogClose asChild><Button variant="primary">完了</Button></MyrialeDialogClose>}
        >
          <input aria-label="最初の入力" />
        </MyrialeDialogContent>
      </MyrialeDialogRoot>,
    );

    const trigger = screen.getByRole('button', { name: 'Dialogを開く' });
    fireEvent.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: 'アクセシブルDialog' });
    const descriptionId = dialog.getAttribute('aria-describedby');
    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(descriptionId!)?.textContent).toBe('操作の説明');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    fireEvent.keyDown(document.activeElement ?? dialog, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'アクセシブルDialog' })).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
