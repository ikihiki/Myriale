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
