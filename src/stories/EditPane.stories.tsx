import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { Button, Input, Textarea } from '../components/ui';
import { EditPane } from '../shared/EditPane';
import { MyrialeSelect } from '../ui/MyrialeRadix';

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

function NestedSelectPortalDemo() {
  const [parentOpen, setParentOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(false);
  const [tone, setTone] = useState('mist');
  return (
    <main className="min-h-screen bg-[#eee7da] p-8">
      <Button onClick={() => setParentOpen(true)}>ポータル検証を開く</Button>
      <EditPane open={parentOpen} onOpenChange={setParentOpen} eyebrow="親" title="親ペイン">
        <p>親ペインの内容です。</p>
        <Button onClick={() => setChildOpen(true)}>子ペインを開く</Button>
      </EditPane>
      <EditPane layer={1} open={childOpen} onOpenChange={setChildOpen} eyebrow="子" title="子ペイン">
        <div className="grid gap-4" data-testid="child-pane-nearby-area">
          <MyrialeSelect
            label="語り口"
            value={tone}
            onValueChange={setTone}
            options={[
              { value: 'mist', label: '薄霧' },
              { value: 'iris', label: '菫' },
              { value: 'ember', label: '熾火' },
            ]}
          />
          <p data-testid="selected-tone">選択中: {tone}</p>
          <Button variant="ghost">近くの操作</Button>
        </div>
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
    const separator = within(child).getByRole('separator', { name: '編集ペインの幅を変更' });
    await userEvent.click(separator);
    await userEvent.keyboard('{Home}');
    await expect(separator).toHaveAttribute('aria-valuenow', '360');
    await userEvent.keyboard('{ArrowLeft}');
    await expect(separator).toHaveAttribute('aria-valuenow', '384');
  },
};

export const SelectPortalAndEscapeHierarchy: Story = {
  name: 'Select — 子ペイン内ポータルとEscape階層',
  render: () => <NestedSelectPortalDemo />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);

    await step('Select optionと同じtriggerの再クリックでもペインを閉じない', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'ポータル検証を開く' }));
      await userEvent.click(screen.getByRole('button', { name: '子ペインを開く' }));
      const child = screen.getByRole('dialog', { name: '子ペイン' });
      await userEvent.click(within(child).getByRole('combobox', { name: '語り口' }));
      const option = await screen.findByRole('option', { name: '熾火' });
      await expect(child).toContainElement(option);
      await userEvent.click(option);
      await expect(screen.getByTestId('selected-tone')).toHaveTextContent('ember');
      await expect(child).toBeInTheDocument();

      const trigger = within(child).getByRole('combobox', { name: '語り口' });
      await userEvent.click(trigger);
      await screen.findByRole('listbox');
      await userEvent.click(trigger);
      await expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      await expect(screen.getByRole('dialog', { name: '子ペイン' })).toBeVisible();
      await expect(canvasElement.ownerDocument.querySelector('[data-edit-pane-layer="0"]')).toBeVisible();
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(screen.getByRole('listbox')).toBeInTheDocument();
      await expect(canvasElement.ownerDocument.querySelector('[data-edit-pane-layer="1"]')).toBeInTheDocument();
      await expect(canvasElement.ownerDocument.querySelector('[data-edit-pane-layer="0"]')).toBeInTheDocument();
    });

    await step('EscapeはSelect、子ペイン、親ペインの順に閉じる', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      await expect(screen.getByRole('dialog', { name: '子ペイン' })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: '近くの操作' }));
      await expect(screen.getByRole('dialog', { name: '子ペイン' })).toBeInTheDocument();
      await userEvent.keyboard('{Escape}');
      await expect(screen.queryByRole('dialog', { name: '子ペイン' })).not.toBeInTheDocument();
      await expect(screen.getByRole('dialog', { name: '親ペイン' })).toBeInTheDocument();
      await userEvent.keyboard('{Escape}');
      await expect(screen.queryByRole('dialog', { name: '親ペイン' })).not.toBeInTheDocument();
    });
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
