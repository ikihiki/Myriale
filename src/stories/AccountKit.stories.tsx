import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import {
  Button,
  DefinitionList,
  IdentitySeal,
  NoticeBanner,
  OAuthProviders,
  PasswordField,
  SelectField,
  StatusBadge,
  TextField,
  UserTable,
  type AccountState,
  type AdminUser,
} from '../account/AccountKit';
import '../account/account.css';

/**
 * Shared component gallery for the user-management wireframes.
 *
 * The screens in docs/user-stories/user-management-user-stories.md reuse the
 * same building blocks. Each story here renders one component on its own so the
 * common UI can be reviewed, themed, and tested in isolation, then it is
 * deployed across the page wireframes in UserManagementWireframe.stories.tsx.
 */
const meta: Meta = {
  title: 'User management/Account kit (shared UI)',
  parameters: {
    layout: 'centered',
    notes:
      '全ページで共通して使うUIコンポーネント集です。ここで単体確認し、UserManagementWireframe の各ページに展開しています。',
  },
  decorators: [
    (Story) => (
      <div className="account-kit" style={{ minHeight: 'auto', padding: 28, width: 'min(680px, 92vw)' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

const allStates: AccountState[] = ['active', 'unverified', 'suspended', 'pending', 'deleted'];

export const IdentitySealStates: Story = {
  name: 'IdentitySeal — 状態を色で表す封蝋（シグネチャ）',
  render: () => (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      {allStates.map((state) => (
        <IdentitySeal key={state} state={state} initials="會員" caption={state} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('active')).toBeVisible();
    await expect(canvas.getAllByText('會員').length).toBe(allStates.length);
  },
};

export const StatusBadges: Story = {
  name: 'StatusBadge — アカウント状態のラベル',
  render: () => (
    <div className="pill-row">
      {allStates.map((state) => (
        <StatusBadge key={state} state={state} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('有効')).toBeVisible();
    await expect(canvas.getByText('停止中')).toBeVisible();
  },
};

export const Buttons: Story = {
  name: 'Button — variant 一覧',
  render: () => (
    <div className="button-row">
      <Button variant="primary">主要操作</Button>
      <Button variant="ghost">副操作</Button>
      <Button variant="danger">危険な操作</Button>
      <Button variant="text">テキストリンク</Button>
      <Button variant="primary" disabled>
        無効
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: '主要操作' })).toBeEnabled();
    await expect(canvas.getByRole('button', { name: '無効' })).toBeDisabled();
  },
};

export const TextFieldStates: Story = {
  name: 'TextField — 通常 / 補助 / エラー',
  render: function Render() {
    const [a, setA] = useState('');
    const [b, setB] = useState('reader@example.com');
    return (
      <div>
        <TextField label="メールアドレス" type="email" value={a} onChange={setA} placeholder="reader@example.com" help="ログインに使うアドレスです。" required />
        <TextField label="メールアドレス（エラー例）" type="email" value={b} onChange={setB} error="このアドレスは既に使われています。" />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('既に使われています');
    await userEvent.type(canvas.getByLabelText('メールアドレス'), 'me@example.com');
    await expect(canvas.getByLabelText('メールアドレス')).toHaveValue('me@example.com');
  },
};

export const PasswordFieldWithMeter: Story = {
  name: 'PasswordField — 強度メーター + 要件チェック',
  render: function Render() {
    const [value, setValue] = useState('');
    return <PasswordField label="パスワード" value={value} onChange={setValue} showStrength showChecklist testId="kit-password" />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('入力で強度が上がり、要件が満たされる', async () => {
      await userEvent.type(canvas.getByLabelText('パスワード'), 'mist-2026');
      await expect(canvas.getByTestId('kit-password-strength')).toHaveTextContent('要件を満たしています');
    });
    await step('表示トグルでマスクを切り替えられる', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'パスワードを表示' }));
      await expect(canvas.getByLabelText('パスワード')).toHaveAttribute('type', 'text');
    });
  },
};

export const OAuthButtons: Story = {
  name: 'OAuthProviders — 外部IDログイン',
  render: () => <OAuthProviders verb="続ける" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Googleで続ける' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'GitHubで続ける' })).toBeVisible();
  },
};

export const SelectFieldExample: Story = {
  name: 'SelectField — 選択式設定',
  render: function Render() {
    const [value, setValue] = useState('ja');
    return (
      <SelectField
        label="言語/表示"
        value={value}
        onChange={setValue}
        options={[
          { value: 'ja', label: '日本語' },
          { value: 'en', label: 'English' },
          { value: 'ko', label: '한국어' },
        ]}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByLabelText('言語/表示'), 'en');
    await expect(canvas.getByLabelText('言語/表示')).toHaveValue('en');
  },
};

export const DefinitionListExample: Story = {
  name: 'DefinitionList — プロフィール等の読み取り表示',
  render: () => (
    <DefinitionList
      items={[
        { term: '表示名', value: '霧野しおり' },
        { term: '自己紹介', value: '静かな探索譚が好み。' },
        { term: '言語/表示', value: '日本語' },
        { term: '通知設定', value: 'ノート更新を通知する' },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('表示名')).toBeVisible();
    await expect(canvas.getByText('霧野しおり')).toBeVisible();
  },
};

export const Notices: Story = {
  name: 'NoticeBanner — info / success / warning / danger',
  render: () => (
    <div style={{ display: 'grid', gap: 10 }}>
      <NoticeBanner tone="info" testId="n-info">案内: メールアドレスを確認してください。</NoticeBanner>
      <NoticeBanner tone="success" testId="n-success">成功: プロフィールを保存しました。</NoticeBanner>
      <NoticeBanner tone="warning" testId="n-warning">注意: 退会の注意事項に同意してください。</NoticeBanner>
      <NoticeBanner tone="danger" testId="n-danger">エラー: 認証に失敗しました。</NoticeBanner>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('n-danger')).toHaveTextContent('認証に失敗しました');
  },
};

const tableUsers: AdminUser[] = [
  { id: 'USR-1031', name: '霧野しおり', email: 'shiori@example.com', registered: '2026-01-12', lastLogin: '2026-06-20', state: 'active', sessions: 14 },
  { id: 'USR-1042', name: '灰原ゆう', email: 'yu@example.com', registered: '2026-02-03', lastLogin: '2026-06-18', state: 'unverified', sessions: 2 },
  { id: 'USR-1088', name: '星見れん', email: 'ren@example.com', registered: '2026-03-21', lastLogin: '2026-05-30', state: 'suspended', sessions: 7 },
];

export const AdminUserTable: Story = {
  name: 'UserTable — 管理画面のユーザー一覧',
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="account-kit" style={{ minHeight: 'auto', padding: 22 }}>
        <div className="reg-card flush">
          <Story />
        </div>
      </div>
    ),
  ],
  render: function Render() {
    const [selected, setSelected] = useState('USR-1088');
    return <UserTable users={tableUsers} selectedId={selected} onSelect={(user) => setSelected(user.id)} caption="ユーザー一覧" />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('霧野しおり')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: '灰原ゆうを開く' }));
    await expect(canvas.getByTestId('user-row-USR-1042')).toHaveClass('selected');
  },
};
