import { FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  AppFrame,
  AuthScaffold,
  Button,
  DefinitionList,
  IdentitySeal,
  NoticeBanner,
  PasswordField,
  SectionHead,
  TextAreaField,
  TextField,
  defaultPasswordRequirements,
  passwordStrength,
} from '../../account/AccountKit';
import { firstFieldError, type AccountApi, type AccountApiError, type AccountUser } from '../../account/api/accountApi';
import { createFetchAdminAiApi, firstAdminAiFieldError, type AdminAiApiError, type AiProviderKey } from '../../account/api/adminAiApi';
import { useAccountSession } from '../../account/hooks/useAccountSession';
import '../../account/account.css';

export type AccountView =
  | 'register'
  | 'verify-email'
  | 'login'
  | 'reset'
  | 'oauth'
  | 'profile'
  | 'profile-edit'
  | 'security'
  | 'export'
  | 'withdraw'
  | 'admin-list'
  | 'admin-detail'
  | 'admin-ai-keys'
  | 'audit';

type NoticeTone = 'success' | 'warning' | 'danger';
type Notice = { tone?: NoticeTone; message: string } | null;

const protectedViews = new Set<AccountView>(['profile', 'profile-edit', 'security', 'export', 'withdraw']);

export function AccountPage({
  initialView = 'register',
  api,
  onAuthenticated,
}: {
  initialView?: AccountView;
  api?: AccountApi;
  onAuthenticated?: () => void;
}) {
  const [view, setView] = useState<AccountView>(initialView);
  const [notice, setNotice] = useState<Notice>(null);
  const session = useAccountSession(api);

  useEffect(() => setView(initialView), [initialView]);

  const go = (next: AccountView) => {
    setView(next);
  };

  const showNotice = (message: string, tone: NoticeTone = 'success') => setNotice({ message, tone });

  return (
    <div className="account-kit">
      {notice && <FloatingNotice notice={notice} />}
      {view === 'register' && <RegisterPage api={session.api} onRegistered={(user) => { session.acceptUser(user); showNotice('UserIdを発行し、登録後ログイン済みにしました。'); go('profile'); }} onLogin={() => go('login')} />}
      {view === 'login' && <LoginPage api={session.api} onLoggedIn={(user) => { session.acceptUser(user); showNotice('ログインしました。'); if (onAuthenticated) onAuthenticated(); else go('profile'); }} onRegister={() => go('register')} onReset={() => go('reset')} />}
      {view === 'reset' && <ResetPasswordPage api={session.api} onLogin={() => go('login')} />}
      {view === 'oauth' && <RoadmapAuthPage title="外部アカウント連携" lead="OAuth サインインは ASP.NET Core Identity の external login provider で Phase 2 に接続します。" onLogin={() => go('login')} />}
      {view === 'verify-email' && <RoadmapAuthPage title="メール確認" lead="メール確認は Identity token provider とメール送信基盤を接続して Phase 2 で提供します。" onLogin={() => go('login')} />}
      {protectedViews.has(view) && (
        <ProtectedAccountFrame
          view={view}
          user={session.user}
          status={session.status}
          onNavigate={(next) => go(next)}
          onLogout={async () => {
            await session.api.logout();
            session.clearUser();
            showNotice('認証セッションを無効化しました。', 'warning');
            go('login');
          }}
        >
          {session.user && view === 'profile' && <ProfileView user={session.user} onEdit={() => go('profile-edit')} />}
          {session.user && view === 'profile-edit' && <EditProfileView api={session.api} user={session.user} onSaved={(user) => { session.acceptUser(user); showNotice('プロフィールを更新しました。'); go('profile'); }} />}
          {session.user && view === 'security' && <SecurityView />}
          {session.user && view === 'export' && <ExportView />}
          {session.user && view === 'withdraw' && <WithdrawView api={session.api} user={session.user} onWithdrawn={() => { session.clearUser(); showNotice('アカウントを削除済みにしました。', 'danger'); go('login'); }} />}
        </ProtectedAccountFrame>
      )}
      {(view === 'admin-list' || view === 'admin-detail' || view === 'audit' || view === 'admin-ai-keys') && <OperationsPage view={view} onNavigate={go} />}
    </div>
  );
}

function FloatingNotice({ notice }: { notice: NonNullable<Notice> }) {
  return <div style={{ position: 'fixed', zIndex: 10, left: 24, right: 24, top: 18 }}><NoticeBanner tone={notice.tone} testId="um-notice">{notice.message}</NoticeBanner></div>;
}

function RegisterPage({ api, onRegistered, onLogin }: { api: AccountApi; onRegistered: (user: AccountUser) => void; onLogin: () => void }) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<AccountApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const passwordReady = passwordStrength(password) === defaultPasswordRequirements.length;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!passwordReady) return setError(localError('パスワードが要件を満たしていません。', { password: ['要件を満たしていません。'] }));
    if (password !== confirm) return setError(localError('確認用パスワードが一致しません。', { confirm: ['同じパスワードを入力してください。'] }));
    setSubmitting(true);
    try {
      onRegistered(await api.register({ displayName, email, password }));
    } catch (caught) {
      setError(caught as AccountApiError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScaffold ariaLabel="新規登録" kicker="US-UM01" title="Myriale IDを作成" lead="ASP.NET Core Identity のユーザーとしてメールアドレスとパスワードを登録します。" context={<AuthHints />} footer={<><span>既にアカウントをお持ちですか？</span><Button variant="text" onClick={onLogin}>ログインへ</Button></>}>
      {error && <NoticeBanner tone="danger" testId="um-notice">{error.message}</NoticeBanner>}
      <form onSubmit={submit}>
        <TextField label="表示名" value={displayName} onChange={setDisplayName} required autoComplete="name" error={firstFieldError(error, 'displayName')} />
        <TextField label="メールアドレス" value={email} onChange={setEmail} type="email" required autoComplete="email" inputMode="email" error={firstFieldError(error, 'email')} />
        <PasswordField label="パスワード" value={password} onChange={setPassword} showStrength showChecklist testId="register-password" error={firstFieldError(error, 'password')} />
        <PasswordField label="パスワード（確認）" value={confirm} onChange={setConfirm} autoComplete="new-password" error={firstFieldError(error, 'confirm')} />
        <div className="button-row"><Button type="submit" variant="primary" disabled={submitting}>{submitting ? '登録中…' : '登録する'}</Button></div>
      </form>
    </AuthScaffold>
  );
}

function LoginPage({ api, onLoggedIn, onRegister, onReset }: { api: AccountApi; onLoggedIn: (user: AccountUser) => void; onRegister: () => void; onReset: () => void }) {
  const [email, setEmail] = useState('reader@myriale.example');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<AccountApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try { onLoggedIn(await api.login({ email, password })); } catch (caught) { setError(caught as AccountApiError); } finally { setSubmitting(false); }
  };
  return (
    <AuthScaffold ariaLabel="ログイン" kicker="US-UM03" title="アカウントへログイン" lead="Identity cookie セッションでプロフィールと作品管理へ戻ります。" context={<AuthHints />} footer={<><Button variant="text" onClick={onRegister}>新規登録</Button><Button variant="text" onClick={onReset}>パスワードを忘れた</Button></>}>
      {error && <NoticeBanner tone="danger" testId="um-notice">{error.message}</NoticeBanner>}
      <form onSubmit={submit}>
        <TextField label="メールアドレス" value={email} onChange={setEmail} type="email" required autoComplete="email" inputMode="email" />
        <PasswordField label="パスワード" value={password} onChange={setPassword} autoComplete="current-password" testId="login-password" />
        <div className="button-row"><Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'ログイン中…' : 'ログインする'}</Button></div>
      </form>
    </AuthScaffold>
  );
}

function ResetPasswordPage({ api, onLogin }: { api: AccountApi; onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [error, setError] = useState<AccountApiError | null>(null);
  const request = async () => {
    setError(null);
    try {
      const result = await api.requestPasswordReset({ email });
      setToken(result.resetToken ?? '');
      setNotice({ tone: 'success', message: result.resetToken ? '開発用トークンを取得しました。新しいパスワードを設定できます。' : result.message });
    } catch (caught) { setError(caught as AccountApiError); }
  };
  const confirm = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try { await api.confirmPasswordReset({ email, token, newPassword: password }); setNotice({ tone: 'success', message: 'パスワードを再設定しました。' }); } catch (caught) { setError(caught as AccountApiError); }
  };
  return (
    <AuthScaffold ariaLabel="パスワード再設定" kicker="US-UM04" title="パスワードを再設定" lead="Identity の password reset token provider を使って再設定します。" footer={<Button variant="text" onClick={onLogin}>ログインへ戻る</Button>}>
      {notice && <NoticeBanner tone={notice.tone} testId="um-notice">{notice.message}</NoticeBanner>}
      {error && <NoticeBanner tone="danger" testId="um-notice">{error.message}</NoticeBanner>}
      <form onSubmit={confirm}>
        <TextField label="メールアドレス" value={email} onChange={setEmail} type="email" inputMode="email" />
        <div className="button-row"><Button onClick={request}>再設定リンクを送信する</Button></div>
        <TextField label="再設定トークン" value={token} onChange={setToken} help="開発/テスト環境では API 応答の token を自動入力します。" />
        <PasswordField label="新しいパスワード" value={password} onChange={setPassword} showStrength showChecklist testId="reset-password" />
        <div className="button-row"><Button type="submit" variant="primary">パスワードを変更する</Button></div>
      </form>
    </AuthScaffold>
  );
}

function ProtectedAccountFrame({ view, user, status, onNavigate, onLogout, children }: { view: AccountView; user: AccountUser | null; status: string; onNavigate: (view: AccountView) => void; onLogout: () => void; children: ReactNode }) {
  if (status === 'unknown') return <div className="auth-desk"><main className="auth-card" aria-busy="true">認証状態を確認しています…</main></div>;
  if (!user) return <AuthScaffold ariaLabel="ログインが必要" kicker="Account" title="ログインが必要です" lead="この画面を表示するにはログインしてください。"><Button variant="primary" onClick={() => onNavigate('login')}>ログインへ</Button></AuthScaffold>;
  return (
    <AppFrame
      active={view}
      nav={[{ id: 'profile', label: 'プロフィール' }, { id: 'profile-edit', label: '編集' }, { id: 'security', label: 'セキュリティ' }, { id: 'export', label: 'データ書き出し' }, { id: 'withdraw', label: '退会' }]}
      onNavigate={(id) => onNavigate(id as AccountView)}
      onLogout={onLogout}
      user={{ name: user.displayName, email: user.email, state: user.state === 'deleted' ? 'deleted' : 'active', initials: initials(user.displayName) }}
      aside={<SessionSummary user={user} />}
    >
      {children}
    </AppFrame>
  );
}

function ProfileView({ user, onEdit }: { user: AccountUser; onEdit: () => void }) {
  return <section className="reg-card" role="region" aria-label="プロフィール"><SectionHead kicker="US-UM08" title="プロフィール" lead="Identity に保存されたアカウント情報です。" /><DefinitionList items={[{ term: 'User ID', value: <span data-testid="issued-user-id">{user.id}</span> }, { term: '表示名', value: user.displayName }, { term: 'メール', value: user.email }, { term: '状態', value: user.state === 'active' ? '有効' : user.state }, { term: '自己紹介', value: user.bio || '未設定' }]} /><div className="button-row"><Button variant="primary" onClick={onEdit}>プロフィールを編集する</Button></div></section>;
}

function EditProfileView({ api, user, onSaved }: { api: AccountApi; user: AccountUser; onSaved: (user: AccountUser) => void }) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [error, setError] = useState<AccountApiError | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try { onSaved(await api.updateProfile({ displayName, bio })); } catch (caught) { setError(caught as AccountApiError); }
  };
  return <section className="reg-card" role="region" aria-label="プロフィール編集"><SectionHead kicker="US-UM09" title="プロフィール編集" lead="表示名と自己紹介を更新します。" />{error && <NoticeBanner tone="danger" testId="um-notice">{error.message}</NoticeBanner>}<form onSubmit={submit}><TextField label="表示名" value={displayName} onChange={setDisplayName} error={firstFieldError(error, 'displayName')} /><TextAreaField label="自己紹介" value={bio} onChange={setBio} error={firstFieldError(error, 'bio')} /><div className="button-row"><Button type="submit" variant="primary">保存する</Button></div></form></section>;
}

function SecurityView() {
  return <section className="reg-card" role="region" aria-label="セキュリティ"><SectionHead kicker="Security" title="セキュリティ設定" lead="パスワード、ログイン履歴、外部ログイン連携の土台です。" /><NoticeBanner tone="warning">MVPでは ASP.NET Core Identity の cookie セッションとパスワード認証を利用しています。OAuth と他端末ログアウトは Phase 2 で接続します。</NoticeBanner></section>;
}

function ExportView() {
  return <section className="reg-card" role="region" aria-label="データ書き出し"><SectionHead kicker="Phase 3" title="データ書き出し" lead="エクスポートジョブとダウンロードは後続フェーズで実装します。" /></section>;
}

function WithdrawView({ api, user, onWithdrawn }: { api: AccountApi; user: AccountUser; onWithdrawn: () => void }) {
  const [understood, setUnderstood] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<AccountApiError | null>(null);
  const canDelete = understood && confirmation.toLowerCase() === user.email.toLowerCase();
  const submit = async () => {
    setError(null);
    try { await api.withdraw({ confirmation }); onWithdrawn(); } catch (caught) { setError(caught as AccountApiError); }
  };
  return <section className="reg-card danger-zone" role="region" aria-label="退会"><SectionHead kicker="US-UM11" title="退会" lead="アカウントを soft delete し、Identity セッションをサインアウトします。" />{error && <NoticeBanner tone="danger" testId="um-notice">{error.message}</NoticeBanner>}<label className="checkbox-row"><input type="checkbox" checked={understood} onChange={(event) => setUnderstood(event.target.checked)} />退会の注意事項を理解しました</label><TextField label="確認のため登録メールアドレスを入力" value={confirmation} onChange={setConfirmation} error={firstFieldError(error, 'confirmation')} testId="withdraw-confirmation" /><div className="button-row"><Button variant="danger" disabled={!canDelete} onClick={submit}>アカウントを削除する</Button></div></section>;
}

function RoadmapAuthPage({ title, lead, onLogin }: { title: string; lead: string; onLogin: () => void }) {
  return <AuthScaffold ariaLabel={title} kicker="Roadmap" title={title} lead={lead} footer={<Button variant="text" onClick={onLogin}>ログインへ</Button>}><NoticeBanner tone="warning">この機能は Identity 基盤の上に後続フェーズで実装します。</NoticeBanner></AuthScaffold>;
}

function OperationsPage({ view, onNavigate }: { view: AccountView; onNavigate: (view: AccountView) => void }) {
  const title = view === 'audit' ? '監査ログ' : view === 'admin-detail' ? 'ユーザー詳細' : view === 'admin-ai-keys' ? 'AIキー管理' : 'ユーザー管理';
  return <div className="account-frame"><aside className="account-rail"><SectionHead kicker="Operations" title="運用" /><nav className="account-nav"><button className={view === 'admin-list' ? 'active' : ''} onClick={() => onNavigate('admin-list')}>ユーザー管理</button><button className={view === 'admin-ai-keys' ? 'active' : ''} onClick={() => onNavigate('admin-ai-keys')}>AIキー管理</button><button className={view === 'audit' ? 'active' : ''} onClick={() => onNavigate('audit')}>監査ログ</button></nav></aside><main className="account-main">{view === 'admin-ai-keys' ? <AdminAiKeysView /> : <RoadmapOperationsView title={title} />}</main></div>;
}

function RoadmapOperationsView({ title }: { title: string }) {
  return <section className="reg-card" role="region" aria-label={title}><SectionHead kicker="Phase 2/3" title={title} lead="管理者機能は Identity roles/claims と認可 policy を決めてから接続します。" /><NoticeBanner tone="warning">MVPではAIキー管理とシナリオ作成補助AIのモック接続を先に実装しています。</NoticeBanner></section>;
}

function AdminAiKeysView() {
  const api = useMemo(() => createFetchAdminAiApi(), []);
  const [keys, setKeys] = useState<AiProviderKey[]>([]);
  const [provider, setProvider] = useState('runpod');
  const [displayName, setDisplayName] = useState('Runpod Serverless');
  const [secret, setSecret] = useState('');
  const [notice, setNotice] = useState('デプロイ設定と管理画面で登録したAIキーを確認できます。キー本体は再表示しません。');
  const [error, setError] = useState<AdminAiApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    try { setKeys(await api.listKeys()); } catch (caught) { setError(caught as AdminAiApiError); }
  };

  useEffect(() => { void reload(); }, []);

  const changeProvider = (next: string) => {
    setProvider(next);
    setDisplayName(next === 'runpod' ? 'Runpod Serverless' : 'OpenAI');
  };

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const key = await api.saveKey(provider, { displayName, secret });
      setKeys(keys.map((item) => item.provider === key.provider ? key : item));
      setNotice(`${key.displayName}のAIキーを保存しました。`);
      setSecret('');
    } catch (caught) { setError(caught as AdminAiApiError); } finally { setBusy(false); }
  };

  const test = async (target: string) => {
    setBusy(true); setError(null);
    try {
      const key = await api.testKey(target);
      setKeys(keys.map((item) => item.provider === target ? key : item));
      setNotice(`${key.displayName}への接続テストに成功しました。`);
    } catch (caught) { setError(caught as AdminAiApiError); } finally { setBusy(false); }
  };

  const remove = async (target: string) => {
    setBusy(true); setError(null);
    try { await api.deleteKey(target); await reload(); setNotice('管理画面で保存したAIキーを削除しました。'); } catch (caught) { setError(caught as AdminAiApiError); } finally { setBusy(false); }
  };

  return <section className="reg-card" role="region" aria-label="AIキー管理"><SectionHead kicker="Admin / AI Providers" title="AI Provider管理" lead="OpenAIまたはRunpodの接続状態を確認し、必要に応じてAPIキーを登録します。" />
    <NoticeBanner tone={error ? 'danger' : 'info'} testId="ai-key-notice">{error?.message ?? notice}</NoticeBanner>
    <div className="card-grid two">
      <div className="reg-card"><h2>管理画面からキーを登録</h2><div className="field"><label htmlFor="ai-provider">Provider</label><select id="ai-provider" value={provider} onChange={(event) => changeProvider(event.target.value)}><option value="runpod">Runpod</option><option value="openai">OpenAI</option></select>{firstAdminAiFieldError(error, 'provider') && <p className="field-error">{firstAdminAiFieldError(error, 'provider')}</p>}</div><TextField label="表示名" value={displayName} onChange={setDisplayName} error={firstAdminAiFieldError(error, 'displayName')} /><TextField label="APIキー" value={secret} onChange={setSecret} placeholder={provider === 'runpod' ? 'rpa_...' : 'sk-...'} error={firstAdminAiFieldError(error, 'secret')} /><p className="field-help">Vaultまたは環境変数で設定済みの場合、ここで同じキーを再登録する必要はありません。</p><div className="button-row"><Button variant="primary" onClick={save} disabled={busy || !secret.trim()}>キーを保存</Button></div></div>
      <div className="reg-card"><h2>設定の優先順位</h2><ol className="provider-priority"><li><strong>Vault / 環境変数</strong><span>デプロイ時に注入された設定を最優先で使用します。</span></li><li><strong>管理画面</strong><span>環境設定がないProviderでは暗号化してDBへ保存します。</span></li></ol><p className="muted">「使用中」は現在Narrative生成に選択されているProviderです。</p></div>
    </div>
    <div className="reg-card flush provider-table-wrap"><table className="user-table" aria-label="AIキー一覧"><thead><tr><th>Provider</th><th>接続設定</th><th>キー</th><th>検証状態</th><th>操作</th></tr></thead><tbody>{keys.map((key) => <tr key={key.provider} data-testid={'ai-key-row-' + key.provider}><td><strong>{key.displayName}</strong><span className="provider-id">{key.provider}</span></td><td><div className="provider-badges">{key.active && <span className="provider-badge active">使用中</span>}<span className={`provider-badge ${key.credentialSource}`}>{key.credentialSource === 'environment' ? 'Vault / 環境変数' : key.credentialSource === 'database' ? '管理画面' : '未設定'}</span></div></td><td>{key.maskedKey}</td><td><span className={`provider-status ${key.status}`}>{key.status === 'valid' ? '接続済み' : key.status === 'untested' ? '未検証' : key.status}</span></td><td><div className="inline-actions"><Button onClick={() => void test(key.provider)} disabled={busy || !key.configured}>接続テスト</Button>{key.credentialSource === 'database' && <Button variant="danger" onClick={() => void remove(key.provider)} disabled={busy}>削除</Button>}</div></td></tr>)}</tbody></table></div>
  </section>;
}

function AuthHints() {
  return <div><IdentitySeal state="active" initials="霧" /><h3>Identity標準基盤</h3><ol><li>UserManagerでユーザーとパスワードを管理します。</li><li>SignInManagerでcookieセッションを発行します。</li><li>Reset token providerでパスワード再設定を行います。</li></ol></div>;
}

function SessionSummary({ user }: { user: AccountUser }) {
  const items = useMemo(() => [{ term: '認証', value: 'Identity cookie' }, { term: 'メール確認', value: user.emailConfirmed ? '確認済み' : '未確認' }, { term: '状態', value: user.state === 'active' ? '有効' : user.state }], [user]);
  return <><h2>アカウント状態</h2><DefinitionList items={items} /></>;
}

function initials(name: string) {
  return name.trim().slice(0, 2) || '霧';
}

function localError(message: string, errors: Record<string, string[]>): AccountApiError {
  const error = new Error(message) as AccountApiError;
  error.errors = errors;
  return error;
}
