import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { MyrialeApp } from '../app/MyrialeApp';
import { createDemoDb } from '../app/demoData';
import type { UMView } from '../UserManagementWireframe';
import '../account/account.css';

/**
 * One Storybook story per user story in
 * docs/user-stories/user-management-user-stories.md (US-UM01..16).
 *
 * Every screen is built from the shared AccountKit components, so the common UI
 * (auth desk, signed-in frame, notice line, fields, identity seal, table) is
 * exercised across all pages. Each play function narrates the user flow with
 * @storybook/test steps: interactions plus the expected result.
 */
const viewUrl: Record<UMView, string> = {
  register: '/account/register',
  verify: '/account/register?view=verify',
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
    notes:
      'docs/user-stories/user-management-user-stories.md の各ユーザーストーリーを、共通UI（Account kit）で組んだワイヤーフレームにし、play関数で操作手順と期待結果を説明します。',
  },
} satisfies Meta<UserManagementStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

const strongPassword = 'mist-library-2026';

export const UM01RegisterWithEmail: Story = {
  name: 'US-UM01: 新規登録したい（メール/パスワード）',
  args: { initialView: 'register' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('パスワード要件を満たさないと登録できない', async () => {
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'new-reader@example.com');
      await userEvent.type(canvas.getByTestId('register-password'), 'short');
      await userEvent.click(canvas.getByRole('button', { name: '登録する' }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('要件を満たしていません');
    });
    await step('要件を満たすパスワードで登録し、UserIdを発行する', async () => {
      await userEvent.clear(canvas.getByTestId('register-password'));
      await userEvent.type(canvas.getByTestId('register-password'), strongPassword);
      await userEvent.type(canvas.getByLabelText('パスワード（確認）'), strongPassword);
      await userEvent.click(canvas.getByRole('button', { name: '登録する' }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('アカウントを作成しました');
      await expect(canvas.getByTestId('issued-user-id')).toHaveTextContent('USR-2F9A');
    });
  },
};

export const UM02VerifyEmail: Story = {
  name: 'US-UM02: 新規登録時にメール確認をしたい（任意）',
  args: { initialView: 'verify' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('確認前はメール未確認の状態が示される', async () => {
      await expect(canvas.getByTestId('verify-state')).toHaveTextContent('メール未確認');
    });
    await step('確認リンクを開くと確認済みフラグが立つ', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '確認リンクを開く' }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('確認済みフラグが立ち');
      await expect(canvas.getByTestId('verify-state')).toHaveTextContent('有効');
    });
  },
};

export const UM03LoginWithEmail: Story = {
  name: 'US-UM03: ログインしたい（メール/パスワード）',
  args: { initialView: 'login' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('認証失敗時は分かりやすいエラーを表示する', async () => {
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'reader@myriale.example');
      await userEvent.type(canvas.getByTestId('login-password'), 'wrong-password');
      await userEvent.click(canvas.getByRole('button', { name: 'ログインする' }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('認証に失敗しました');
    });
    await step('正しい資格情報でセッションを開始し、自分のデータへ', async () => {
      await userEvent.clear(canvas.getByTestId('login-password'));
      await userEvent.type(canvas.getByTestId('login-password'), strongPassword);
      await userEvent.click(canvas.getByRole('button', { name: 'ログインする' }));
      await expect(canvas.getByRole('region', { name: 'プロフィール' })).toBeVisible();
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('セッションを開始');
    });
  },
};

export const UM04Logout: Story = {
  name: 'US-UM04: ログアウトしたい',
  args: { initialView: 'profile' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('ログアウトすると認証セッションが無効化され、ログイン画面へ戻る', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'ログアウト' }));
      await expect(canvas.getByRole('main', { name: 'ログイン' })).toBeVisible();
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('認証セッションを無効化');
    });
  },
};

export const UM05ResetPassword: Story = {
  name: 'US-UM05: パスワードをリセットしたい',
  args: { initialView: 'reset' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('メールアドレスでリセットを開始する（存在有無を過度に明かさない）', async () => {
      await userEvent.type(canvas.getByLabelText('メールアドレス'), 'reader@myriale.example');
      await userEvent.click(canvas.getByRole('button', { name: 'リセットメールを送信' }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('期限付きのリセットリンク');
    });
    await step('リンク先で新しいパスワードを設定する', async () => {
      await userEvent.type(canvas.getByTestId('reset-password'), strongPassword);
      await userEvent.click(canvas.getByRole('button', { name: '新しいパスワードを保存' }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('新しいパスワードを保存しました');
    });
  },
};

export const UM06OAuthSignIn: Story = {
  name: 'US-UM06: OAuthで登録/ログインしたい',
  args: { initialView: 'oauth' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('OAuthプロバイダを選んで認可し、ログインする', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Googleで続ける' }));
      await expect(canvas.getByRole('region', { name: 'プロフィール' })).toBeVisible();
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('外部IDと紐づくアカウント');
    });
  },
};

export const UM07LinkOAuthToAccount: Story = {
  name: 'US-UM07: OAuthアカウントと既存アカウントを統合したい',
  args: { initialView: 'security' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('再認証なしでは連携を進めない', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Googleを連携' }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('本人確認のため');
    });
    await step('本人確認を経て同一Userにログイン手段を追加し、データは保持する', async () => {
      await userEvent.type(canvas.getByTestId('link-reauth'), strongPassword);
      await userEvent.click(canvas.getByRole('button', { name: 'Googleを連携' }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('既存のシナリオ/セッション/ノートは保持');
      await expect(canvas.getByRole('region', { name: 'OAuth連携' })).toHaveTextContent('連携済み');
    });
  },
};

export const UM08ViewProfile: Story = {
  name: 'US-UM08: プロフィールを閲覧したい',
  args: { initialView: 'profile' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('現在のプロフィール値が表示される', async () => {
      const summary = canvas.getByTestId('profile-summary');
      await expect(summary).toHaveTextContent('表示名');
      await expect(summary).toHaveTextContent('霧野しおり');
      await expect(summary).toHaveTextContent('言語/表示');
      await expect(summary).toHaveTextContent('通知設定');
    });
  },
};

export const UM09EditProfile: Story = {
  name: 'US-UM09: プロフィールを編集したい',
  args: { initialView: 'profile-edit' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('表示名を空にすると保存できない', async () => {
      await userEvent.clear(canvas.getByTestId('edit-display-name'));
      await userEvent.click(canvas.getByRole('button', { name: '変更を保存' }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('表示名は空にできません');
    });
    await step('表示名を更新して保存すると、UI表示に反映される', async () => {
      await userEvent.type(canvas.getByTestId('edit-display-name'), '霧野しおり改');
      await userEvent.click(canvas.getByRole('button', { name: '変更を保存' }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('保存しました');
      await expect(canvas.getByTestId('profile-summary')).toHaveTextContent('霧野しおり改');
    });
  },
};

export const UM10ManageSecurity: Story = {
  name: 'US-UM10: アカウントのセキュリティ設定を管理したい',
  args: { initialView: 'security' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('ログイン履歴を閲覧できる', async () => {
      await expect(canvas.getByTestId('login-history')).toHaveTextContent('現在のセッション');
    });
    await step('他端末ログアウトで設定変更が反映される', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '他のすべての端末からログアウト' }));
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('セッションを無効化しました');
    });
  },
};

export const UM11DeleteAccount: Story = {
  name: 'US-UM11: アカウントを削除（退会）したい',
  args: { initialView: 'withdraw' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('注意事項の同意と再認証がそろうまで削除ボタンは押せない', async () => {
      await expect(canvas.getByRole('button', { name: 'アカウントを削除する' })).toBeDisabled();
      await userEvent.click(canvas.getByLabelText('退会の注意事項を理解しました'));
      await userEvent.type(canvas.getByTestId('withdraw-password'), strongPassword);
      await expect(canvas.getByRole('button', { name: 'アカウントを削除する' })).toBeEnabled();
    });
    await step('削除を確定すると、ログインできない削除済み状態になる', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'アカウントを削除する' }));
      await expect(canvas.getByTestId('withdraw-result')).toHaveTextContent('削除済み');
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('ログインできなくなります');
    });
  },
};

export const UM12ExportData: Story = {
  name: 'US-UM12: 退会前にデータをエクスポートしたい',
  args: { initialView: 'export' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await step('対象とフォーマットを選んでエクスポートする', async () => {
      await userEvent.click(canvas.getByRole('combobox', { name: '形式' }));
      await userEvent.click(await screen.findByRole('option', { name: 'JSON' }));
      await userEvent.click(canvas.getByRole('button', { name: 'エクスポートを作成' }));
      await expect(canvas.getByTestId('export-result')).toHaveTextContent('JSON 形式で書き出しました');
      await expect(canvas.getByTestId('export-result')).toHaveTextContent('シナリオ');
    });
  },
};

export const UM13AdminUserList: Story = {
  name: 'US-UM13: 管理者としてユーザー一覧を管理したい',
  args: { initialView: 'admin-list' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('ユーザーの基本情報（登録日・最終ログイン等）が見られる', async () => {
      await expect(canvas.getByRole('region', { name: 'ユーザー一覧' })).toBeVisible();
      await expect(canvas.getByTestId('user-row-USR-1031')).toHaveTextContent('2026-06-20');
    });
    await step('条件で検索して絞り込める', async () => {
      await userEvent.type(canvas.getByLabelText('ユーザーを検索'), '星見');
      await expect(canvas.getByTestId('user-row-USR-1088')).toBeVisible();
      await expect(canvas.queryByTestId('user-row-USR-1031')).not.toBeInTheDocument();
    });
  },
};

export const UM14SuspendUser: Story = {
  name: 'US-UM14: 管理者として不正ユーザーを制限したい',
  args: { initialView: 'admin-list' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('一覧から対象ユーザーの詳細を開く', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '霧野しおりを開く' }));
      await expect(canvas.getByRole('region', { name: 'ユーザー詳細' })).toBeVisible();
      await expect(canvas.getByTestId('detail-state')).toHaveTextContent('有効');
    });
    await step('状態を停止に変更し、変更は監査ログに残る', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '停止する' }));
      await expect(canvas.getByTestId('detail-state')).toHaveTextContent('停止中');
      await expect(canvas.getByTestId('um-notice')).toHaveTextContent('監査ログに残ります');
    });
  },
};

export const UM15SupportLookup: Story = {
  name: 'US-UM15: 管理者としてサポート対応のためユーザー情報を参照したい',
  args: { initialView: 'admin-detail' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('利用状況を参照でき、個人情報は権限で制御される', async () => {
      const summary = canvas.getByTestId('detail-summary');
      await expect(summary).toHaveTextContent('セッション');
      await expect(summary).toHaveTextContent('権限により一部マスク');
    });
  },
};

export const UM16AuditLog: Story = {
  name: 'US-UM16: 監査ログを残したい',
  args: { initialView: 'audit' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('重要操作が監査ログに残る', async () => {
      await expect(canvas.getByTestId('audit-log')).toHaveTextContent('ログイン失敗');
      await expect(canvas.getByTestId('audit-log')).toHaveTextContent('退会');
    });
    await step('操作や対象で検索できる', async () => {
      await userEvent.type(canvas.getByLabelText('監査ログを検索'), 'OAuth');
      await expect(canvas.getByTestId('audit-log')).toHaveTextContent('OAuth連携を追加');
      await expect(canvas.getByTestId('audit-log')).not.toHaveTextContent('ログイン失敗');
    });
  },
};
