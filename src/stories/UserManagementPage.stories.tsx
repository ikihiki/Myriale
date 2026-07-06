import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { MyrialeApp } from '../app/MyrialeApp';
import { createDemoDb } from '../app/demoData';
import type { UMView } from '../app/pages/UserManagementPage';
import '../account/account.css';

/**
 * docs/user-stories/user-management-user-stories.md の US-UM01..16 を Storybook 上に配置する。
 * MVP対象（登録、ログイン/ログアウト、パスワードリセット、プロフィール表示/編集、退会）は
 * ASP.NET Core Identity API に接続する新UIの操作として play 関数で確認する。
 */
const viewUrl: Record<UMView, string> = {
  register: '/account/register',
  'verify-email': '/account/register?view=verify-email',
  login: '/account/login',
  reset: '/account/reset-password',
  oauth: '/account/oauth',
  profile: '/account/profile',
  'profile-edit': '/account/profile/edit',
  security: '/account/security',
  export: '/account/export',
  withdraw: '/account/withdraw',
  'admin-list': '/account/admin/users',
  'admin-detail': '/account/admin/users/USR-1088',
  'admin-ai-keys': '/account/admin/ai-keys',
  audit: '/account/admin/audit-log',
};

type UserManagementStoryArgs = { initialView?: UMView };

const meta = {
  title: 'ユーザーストーリー/User management',
  component: MyrialeApp,
  render: (args: UserManagementStoryArgs) => (
    <MyrialeApp initialUrl={viewUrl[args.initialView ?? 'register']} initialDb={createDemoDb('adminUsers')} />
  ),
  parameters: {
    layout: 'fullscreen',
    notes: 'ユーザー管理Markdown要件は変更せず、Storybook story/play function としてユーザー導線を表現します。',
  },
} satisfies Meta<UserManagementStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UM01RegisterWithEmail: Story = {
  name: 'US-UM01: 新規登録したい（メール/パスワード）',
  args: { initialView: 'register' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('要件未満のパスワードは拒否される', async () => {
      await userEvent.type(canvas.getByLabelText('表示名'), '新しい旅人');
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'new-reader@example.com');
      await userEvent.type(canvas.getByTestId('register-password'), 'short');
      await userEvent.click(canvas.getByRole('button', { name: '登録する' }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('要件を満たしていません');
    });
    await step('要件を満たすとUserIdが発行されプロフィールへ進む', async () => {
      await userEvent.clear(canvas.getByTestId('register-password'));
      await userEvent.type(canvas.getByTestId('register-password'), 'letters1');
      await userEvent.type(canvas.getByLabelText('パスワード（確認）'), 'letters1');
      await userEvent.click(canvas.getByRole('button', { name: '登録する' }));
      await expect(canvas.getByRole('region', { name: 'プロフィール' })).toBeVisible();
      await expect(canvas.getByTestId('issued-user-id')).toHaveTextContent('USR-2F9A');
    });
  },
};

export const UM02VerifyEmail: Story = { name: 'US-UM02: メール確認をしたい（Phase 2）', args: { initialView: 'verify-email' } };

export const UM03LoginWithEmail: Story = {
  name: 'US-UM03: ログインしたい（メール/パスワード）',
  args: { initialView: 'login' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Identity cookieセッションを開始しプロフィールへ進む', async () => {
      await userEvent.clear(canvas.getByLabelText('メールアドレス'));
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'reader@myriale.example');
      await userEvent.type(canvas.getByTestId('login-password'), 'mist-library-2026');
      await userEvent.click(canvas.getByRole('button', { name: 'ログインする' }));
      await expect(canvas.getByRole('region', { name: 'プロフィール' })).toBeVisible();
    });
  },
};

export const UM04Logout: Story = {
  name: 'US-UM04: ログアウトしたい',
  args: { initialView: 'profile' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('ログアウトでログイン画面へ戻る', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: 'ログアウト' }));
      await expect(canvas.getByRole('main', { name: 'ログイン' })).toBeVisible();
    });
  },
};

export const UM05ResetPassword: Story = { name: 'US-UM05: パスワードを再設定したい', args: { initialView: 'reset' } };
export const UM06OAuthSignIn: Story = { name: 'US-UM06: OAuthでサインインしたい（Phase 2）', args: { initialView: 'oauth' } };
export const UM07LinkOAuth: Story = { name: 'US-UM07: 外部アカウントを連携したい（Phase 2）', args: { initialView: 'security' } };
export const UM08Profile: Story = { name: 'US-UM08: プロフィールを確認したい', args: { initialView: 'profile' } };
export const UM09EditProfile: Story = { name: 'US-UM09: プロフィールを編集したい', args: { initialView: 'profile-edit' } };
export const UM10ExportData: Story = { name: 'US-UM10: データを書き出したい（Phase 3）', args: { initialView: 'export' } };
export const UM11Withdraw: Story = { name: 'US-UM11: 退会したい', args: { initialView: 'withdraw' } };
export const UM12SecuritySettings: Story = { name: 'US-UM12: セキュリティ設定を管理したい（Phase 3）', args: { initialView: 'security' } };
export const UM13AdminUserList: Story = { name: 'US-UM13: 管理者としてユーザー一覧を見たい（Phase 2）', args: { initialView: 'admin-list' } };
export const UM14AdminUserDetail: Story = { name: 'US-UM14: 管理者としてユーザー詳細を操作したい（Phase 2）', args: { initialView: 'admin-detail' } };
export const UM15SupportLookup: Story = { name: 'US-UM15: サポート調査したい（Phase 3）', args: { initialView: 'admin-list' } };
export const UM16AuditLog: Story = { name: 'US-UM16: 監査ログを確認したい（Phase 3）', args: { initialView: 'audit' } };

export const UM17AdminAiKeys: Story = { name: 'Admin: AIキー管理', args: { initialView: 'admin-ai-keys' }, play: async ({ canvasElement, step }) => { const canvas = within(canvasElement); await step('AIキーを保存し、Aspire Mock AI への接続テストを行う', async () => { await expect(await canvas.findByRole('region', { name: 'AIキー管理' })).toBeVisible(); await userEvent.clear(canvas.getByLabelText('APIキー')); await userEvent.type(canvas.getByLabelText('APIキー'), 'mock-key-story'); await userEvent.click(canvas.getByRole('button', { name: '保存する' })); await expect(await canvas.findByTestId('ai-key-notice')).toHaveTextContent('保存しました'); await userEvent.click(canvas.getAllByRole('button', { name: '接続テスト' })[0]); await expect(await canvas.findByTestId('ai-key-notice')).toHaveTextContent('接続テストに成功'); }); } };
