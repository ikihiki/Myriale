import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { AppChrome } from '../shared/AppChrome';

/**
 * AppChrome — the global application navigation shared by every page.
 *
 * This is the real product chrome (top app bar with brand + sections + account
 * menu, plus a breadcrumb row) that wraps each screen, replacing the earlier
 * page-level flow strip. Rendered here on its own so the navigation model
 * and its menus can be reviewed in isolation.
 */
const meta = {
  title: 'コンポーネント/AppChrome',
  component: AppChrome,
  parameters: {
    layout: 'fullscreen',
    notes:
      '全ワイヤー共通のアプリ・ナビゲーション。上部バー（ブランド / セクション / アカウントメニュー）とパンくずで、実アプリと同じ移動ができます。各セクションやアカウントメニューから対応ワイヤーのストーリーへ遷移します。',
  },
} satisfies Meta<typeof AppChrome>;

export default meta;
type Story = StoryObj<typeof meta>;

const demoScreen = (
  <div style={{ padding: 28, font: '14px/1.6 Inter, sans-serif', color: '#241b2f' }}>
    <p style={{ margin: 0, color: '#5f506c' }}>
      ここに各アプリ画面の画面が入ります。上のバーとパンくずがアプリ全体の現在地と移動先を示します。
    </p>
  </div>
);

export const SignedIn: Story = {
  name: 'ログイン中（アカウントメニューあり）',
  args: {
    section: 'library',
    breadcrumbs: [
      { label: 'Myriale', to: 'scenarioRegister' },
      { label: 'ライブラリ', to: 'scenarioRegister' },
      { label: 'シナリオを登録' },
    ],
    account: { name: '霧野しおり', email: 'author@myriale.example', initials: '霧野', role: '作者' },
    children: demoScreen,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    const sections = canvas.getByRole('navigation', { name: '主要セクション' });
    await step('主要セクションがアプリバーに並ぶ', async () => {
      await expect(sections).toBeVisible();
      await expect(within(sections).getByRole('button', { name: /ライブラリ/ })).toHaveAttribute('aria-current', 'page');
    });
    await step('ライブラリにはシナリオ一覧と登録だけが並ぶ', async () => {
      await userEvent.click(within(sections).getByRole('button', { name: /ライブラリ/ }));
      const menu = screen.getByRole('menu');
      await expect(menu).toBeVisible();
      await expect(within(menu).getAllByRole('menuitem')).toHaveLength(2);
      await expect(within(menu).getByRole('menuitem', { name: /シナリオ一覧/ })).toBeVisible();
      await expect(within(menu).getByRole('menuitem', { name: /シナリオ登録/ })).toBeVisible();
    });
    await step('アカウントメニューを開ける', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /アカウントメニュー: 霧野しおり/ }));
      await expect(screen.getByRole('menuitem', { name: 'プロフィール' })).toBeVisible();
      await expect(screen.getByRole('menuitem', { name: 'ログアウト' })).toBeVisible();
    });
  },
};

export const SignedOut: Story = {
  name: 'サインアウト（ログイン/新規登録）',
  args: {
    section: 'account',
    breadcrumbs: [{ label: 'Myriale', to: 'scenarioRegister' }, { label: 'アカウント' }, { label: 'ログイン' }],
    account: null,
    children: demoScreen,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'ログイン' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: '新規登録' })).toBeVisible();
  },
};

export const OperationsConsole: Story = {
  name: '運用セクション（管理者）',
  args: {
    section: 'operations',
    breadcrumbs: [
      { label: 'Myriale', to: 'scenarioRegister' },
      { label: '運用', to: 'adminUsers' },
      { label: 'ユーザー一覧' },
    ],
    account: { name: '運用 司書', email: 'ops@myriale.example', initials: '運', role: '管理者' },
    children: demoScreen,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sections = canvas.getByRole('navigation', { name: '主要セクション' });
    await expect(within(sections).getByRole('button', { name: /運用/ })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('navigation', { name: '現在地' })).toHaveTextContent('ユーザー一覧');
  },
};
