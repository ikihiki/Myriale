import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import {
  AppFrame,
  AuthScaffold,
  Button,
  DefinitionList,
  DeskBrand,
  IdentitySeal,
  NoticeBanner,
  OAuthProviders,
  PasswordField,
  SectionHead,
  SelectField,
  StatusBadge,
  TextAreaField,
  TextField,
  UserTable,
  type AccountState,
  type AdminUser,
} from '../account/AccountKit';
import '../account/account.css';

/**
 * Shared component gallery for the user-management pages.
 *
 * The screens in docs/user-stories/user-management-user-stories.md reuse the
 * same building blocks. Each story here renders one component on its own so the
 * common UI can be reviewed, themed, and tested in isolation, then it is
 * deployed across the page pages in UserManagementPage.stories.tsx.
 */
const meta: Meta = {
  title: 'コンポーネント/AccountKit',
  parameters: {
    layout: 'centered',
    notes:
      '全ページで共通して使うUIコンポーネント集です。ここで単体確認し、UserManagementPage の各ページに展開しています。',
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

export const DeskBrandComponent: Story = {
  name: 'DeskBrand — 霧のブランド印',
  render: () => <DeskBrand subtitle="Account" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Myriale')).toBeVisible();
    await expect(canvas.getByText('Account')).toBeVisible();
  },
};

export const SectionHeadComponent: Story = {
  name: 'SectionHead — 紙面の見出し',
  render: () => <SectionHead kicker="US-UM / Sample" title="プロフィール" lead="登録情報や設定を確認できます。" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'プロフィール' })).toBeVisible();
    await expect(canvas.getByText('US-UM / Sample')).toBeVisible();
  },
};

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
    <div className="flex flex-wrap gap-2">
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
    <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
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

export const TextAreaFieldStates: Story = {
  name: 'TextAreaField — 長文入力',
  render: function Render() {
    const [value, setValue] = useState('静かな探索譚が好み。');
    return <TextAreaField label="自己紹介" value={value} onChange={setValue} help="プロフィールに表示される短い紹介文です。" />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.clear(canvas.getByLabelText('自己紹介'));
    await userEvent.type(canvas.getByLabelText('自己紹介'), '霧の図書館を歩く。');
    await expect(canvas.getByLabelText('自己紹介')).toHaveValue('霧の図書館を歩く。');
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
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('combobox', { name: '言語/表示' }));
    await userEvent.click(await screen.findByRole('option', { name: 'English' }));
    await expect(canvas.getByRole('combobox', { name: '言語/表示' })).toHaveTextContent('English');
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
        <div className="overflow-hidden rounded-myr-shell border border-myr-line bg-[rgba(255,250,240,.9)] shadow-myr-surface">
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

export const AuthScaffoldComponent: Story = {
  name: 'AuthScaffold — 認証前カード構成',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <AuthScaffold
      ariaLabel="ログイン"
      kicker="US-UM03 / Login"
      title="ログイン"
      lead="既存アカウントでMyrialeへ戻ります。"
      context={<NoticeBanner tone="info">右側に補足文を置けます。</NoticeBanner>}
      footer={<Button variant="text">新規登録へ</Button>}
    >
      <TextField label="メールアドレス" type="email" value="reader@myriale.example" onChange={() => {}} />
      <PasswordField label="パスワード" value="mist-library-2026" onChange={() => {}} />
      <Button variant="primary">ログインする</Button>
    </AuthScaffold>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('main', { name: 'ログイン' })).toBeVisible();
    await expect(canvas.getByText('右側に補足文を置けます。')).toBeVisible();
  },
};

export const AppFrameComponent: Story = {
  name: 'AppFrame — サインイン後のアカウント枠',
  parameters: { layout: 'fullscreen' },
  render: function Render() {
    const [active, setActive] = useState('profile');
    return (
      <AppFrame
        nav={[
          { id: 'profile', label: 'プロフィール' },
          { id: 'security', label: 'セキュリティ' },
        ]}
        active={active}
        onNavigate={setActive}
        onLogout={() => setActive('logged-out')}
        user={{ name: '霧野しおり', email: 'shiori@example.com', state: 'active', initials: '霧' }}
        aside={<DefinitionList items={[{ term: '現在', value: active }]} testId="frame-aside" />}
      >
        <section className="rounded-myr-shell border border-myr-line bg-[rgba(255,250,240,.9)] p-myr-section-inset shadow-myr-surface" aria-label="AppFrame本文">
          <SectionHead kicker="Account" title="AppFrame本文" lead="ナビゲーションと本文領域を1つの枠にまとめます。" />
          <p data-testid="frame-active">active: {active}</p>
        </section>
      </AppFrame>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'プロフィール' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(canvas.getByRole('button', { name: 'セキュリティ' }));
    await expect(canvas.getByRole('button', { name: 'セキュリティ' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByTestId('frame-active')).toHaveTextContent('security');
    await expect(canvas.getByTestId('frame-aside')).toHaveTextContent('security');
  },
};
