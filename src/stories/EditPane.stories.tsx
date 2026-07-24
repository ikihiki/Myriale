import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { Button, Input, Textarea } from '../components/ui';
import { EditPane } from '../shared/EditPane';

const meta = {
  title: 'コンポーネント/EditPane',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function PaneDemo() {
  const [open, setOpen] = useState(false);
  return (
    <main className="min-h-screen bg-[#eee7da] p-8">
      <Button onClick={() => setOpen(true)}>場所を編集</Button>
      <EditPane
        open={open}
        onOpenChange={setOpen}
        eyebrow="場所"
        title="霧の図書館"
        description="物語内で参照する場所の名前と空気を整えます。"
        footer={<Button onClick={() => setOpen(false)}>編集を完了</Button>}
      >
        <div className="grid gap-4">
          <label>表示名<Input defaultValue="霧の図書館" /></label>
          <label>説明<Textarea defaultValue="書架のあいだを淡い霧が流れている。" /></label>
        </div>
      </EditPane>
    </main>
  );
}

function NestedPaneDemo() {
  const [parentOpen, setParentOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(false);
  return (
    <main className="min-h-screen bg-[#eee7da] p-8">
      <Button onClick={() => setParentOpen(true)}>種類を編集</Button>
      <EditPane open={parentOpen} onOpenChange={setParentOpen} eyebrow="オブジェクト種類" title="書庫の扉">
        <div className="grid gap-4">
          <p>状態定義をテーブルで管理します。</p>
          <Button onClick={() => setChildOpen(true)}>開いているを編集</Button>
        </div>
      </EditPane>
      <EditPane layer={1} open={childOpen} onOpenChange={setChildOpen} eyebrow="状態定義" title="開いている" footer={<Button onClick={() => setChildOpen(false)}>状態の編集を完了</Button>}>
        <label>状態code<Input defaultValue="open" /></label>
      </EditPane>
    </main>
  );
}

export const NestedOverlappingPane: Story = {
  name: 'デスクトップ — 編集ペインを重ねる',
  render: () => <NestedPaneDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: '種類を編集' }));
    await userEvent.click(screen.getByRole('button', { name: '開いているを編集' }));
    const child = screen.getByRole('dialog', { name: '開いている' });
    await expect(child).toBeVisible();
    await expect(child).toHaveAttribute('data-layer', '1');
  },
};

export const DesktopRightPane: Story = {
  name: 'デスクトップ — 右編集ペイン',
  render: () => <PaneDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: '場所を編集' }));
    await expect(screen.getByRole('dialog', { name: '霧の図書館' })).toBeVisible();
    await expect(screen.getByRole('button', { name: '編集ペインを閉じる' })).toBeVisible();
  },
};

export const MobileFullScreen: Story = {
  name: 'スマホ — 全画面編集',
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <PaneDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: '場所を編集' }));
    const dialog = screen.getByRole('dialog', { name: '霧の図書館' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveClass('max-md:w-screen');
    await expect(dialog).toHaveClass('max-md:h-[100dvh]');
  },
};
