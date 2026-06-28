import { useState } from 'react';
import {
  AppFrame,
  AuthScaffold,
  Button,
  DefinitionList,
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
  defaultPasswordRequirements,
  passwordStrength,
  type AccountState,
  type AdminUser,
  type NavItem,
  type OAuthProvider,
} from '../../account/AccountKit';
import { MyrialeCheckbox, MyrialeRadioGroup } from '../../ui/MyrialeRadix';
import '../../account/account.css';
import { AppChrome, type Crumb } from '../../shared/AppChrome';

/**
 * UserManagementPage — one screen per user story in
 * docs/user-stories/user-management-user-stories.md (US-UM01..16).
 *
 * Every screen is assembled from the shared AccountKit components so the common
 * chrome (auth desk, signed-in frame, notice line, fields, status seal, table)
 * stays consistent across registration, login, profile, withdrawal and admin.
 * Each Storybook story renders one `view` and drives it with a play function.
 */

export type UMView =
  | 'register'
  | 'verify'
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
  | 'audit';

type Tone = 'info' | 'success' | 'warning' | 'danger';

const KNOWN = { email: 'reader@myriale.example', password: 'mist-library-2026' };

const accountNav: NavItem[] = [
  { id: 'profile', label: 'プロフィール' },
  { id: 'security', label: 'セキュリティ' },
  { id: 'export', label: 'データ書き出し' },
  { id: 'withdraw', label: '退会' },
];

const adminNav: NavItem[] = [
  { id: 'admin-list', label: 'ユーザー一覧' },
  { id: 'audit', label: '監査ログ' },
];

const seededUsers: AdminUser[] = [
  { id: 'USR-1031', name: '霧野しおり', email: 'shiori@example.com', registered: '2026-01-12', lastLogin: '2026-06-20', state: 'active', sessions: 14 },
  { id: 'USR-1042', name: '灰原ゆう', email: 'yu@example.com', registered: '2026-02-03', lastLogin: '2026-06-18', state: 'unverified', sessions: 2 },
  { id: 'USR-1088', name: '星見れん', email: 'ren@example.com', registered: '2026-03-21', lastLogin: '2026-05-30', state: 'suspended', sessions: 7 },
  { id: 'USR-1104', name: '夜長あおい', email: 'aoi@example.com', registered: '2026-04-09', lastLogin: '2026-06-22', state: 'active', sessions: 23 },
];

type AuditEntry = { id: number; time: string; actor: string; action: string };

const seededAudit: AuditEntry[] = [
  { id: 1, time: '2026-06-22 09:14', actor: 'reader@myriale.example', action: 'ログイン成功' },
  { id: 2, time: '2026-06-22 09:02', actor: 'unknown', action: 'ログイン失敗（パスワード不一致）' },
  { id: 3, time: '2026-06-21 22:40', actor: 'shiori@example.com', action: 'OAuth連携を追加（Google）' },
  { id: 4, time: '2026-06-20 18:03', actor: 'ren@example.com', action: '退会（論理削除）' },
];

const isAuthView = (view: UMView) => ['register', 'verify', 'login', 'reset', 'oauth'].includes(view);
const isAdminView = (view: UMView) => ['admin-list', 'admin-detail', 'audit'].includes(view);

export function UserManagementPage({ initialView = 'register' }: { initialView?: UMView }) {
  const [view, setView] = useState<UMView>(initialView);
  const [noticeText, setNoticeText] = useState('はじめにメールアドレスとパスワードでアカウントを作成します。');
  const [noticeTone, setNoticeTone] = useState<Tone>('info');

  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [verified, setVerified] = useState(initialView !== 'verify');
  const [userId, setUserId] = useState(initialView === 'register' ? '未発行' : 'USR-1031');
  const [deleted, setDeleted] = useState(false);

  // Reset flow
  const [resetStage, setResetStage] = useState<'request' | 'set'>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Profile
  const [displayName, setDisplayName] = useState('霧野しおり');
  const [bio, setBio] = useState('積ん読を成仏させる読書記録係。静かな探索譚が好み。');
  const [language, setLanguage] = useState('ja');
  const [notifyNotes, setNotifyNotes] = useState(true);
  const [draftName, setDraftName] = useState('霧野しおり');
  const [draftBio, setDraftBio] = useState('積ん読を成仏させる読書記録係。静かな探索譚が好み。');
  const [draftLang, setDraftLang] = useState('ja');
  const [draftNotify, setDraftNotify] = useState(true);

  // Security / OAuth linking
  const [linkedGoogle, setLinkedGoogle] = useState(false);
  const [linkReauth, setLinkReauth] = useState('');

  // Export
  const [exportScenarios, setExportScenarios] = useState(true);
  const [exportSessions, setExportSessions] = useState(true);
  const [exportNotes, setExportNotes] = useState(true);
  const [exportFormat, setExportFormat] = useState('markdown');
  const [exportResult, setExportResult] = useState('');

  // Withdraw
  const [ackUnderstood, setAckUnderstood] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [deletePolicy, setDeletePolicy] = useState<'erase' | 'anonymize'>('erase');

  // Admin
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUser[]>(seededUsers);
  const [selectedUserId, setSelectedUserId] = useState<string>('USR-1088');
  const [auditQuery, setAuditQuery] = useState('');
  const [audit, setAudit] = useState<AuditEntry[]>(seededAudit);

  const flash = (text: string, tone: Tone = 'info') => {
    setNoticeText(text);
    setNoticeTone(tone);
  };

  const accountState: AccountState = deleted ? 'deleted' : verified ? 'active' : 'unverified';
  const sealInitials = displayName.slice(0, 2) || '会員';
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];

  const logAudit = (action: string, actor = KNOWN.email) => {
    setAudit((current) => [
      { id: current.length + 1, time: '2026-06-22 09:20', actor, action },
      ...current,
    ]);
  };

  /* ---------------- Auth handlers ---------------- */

  const submitRegister = () => {
    setEmailError(undefined);
    setPasswordError(undefined);
    if (!email.trim()) {
      setEmailError('メールアドレスを入力してください。');
      flash('登録には一意のメールアドレスが必要です。', 'danger');
      return;
    }
    if (passwordStrength(password) < defaultPasswordRequirements.length) {
      setPasswordError('パスワードは8文字以上で、英字と数字を含めてください。');
      flash('パスワードが要件を満たしていません。', 'danger');
      return;
    }
    if (password !== passwordConfirm) {
      setPasswordError('確認用パスワードが一致しません。');
      flash('確認用パスワードが一致しません。', 'danger');
      return;
    }
    setUserId('USR-2F9A');
    setVerified(false);
    flash(`「${email}」でアカウントを作成しました。UserIdを発行し、初回ログイン状態になりました。`, 'success');
    logAudit('アカウント新規作成', email);
  };

  const openVerificationLink = () => {
    setVerified(true);
    flash('メールアドレスを確認しました。確認済みフラグが立ち、利用制限が解除されます。', 'success');
    logAudit('メール確認完了');
  };

  const submitLogin = () => {
    setEmailError(undefined);
    setPasswordError(undefined);
    if (!email.trim() || !password.trim()) {
      flash('メールアドレスとパスワードを入力してください。', 'danger');
      return;
    }
    if (email !== KNOWN.email || password !== KNOWN.password) {
      setPasswordError('メールアドレスまたはパスワードが正しくありません。');
      flash('認証に失敗しました。メールアドレスかパスワードをご確認ください。', 'danger');
      logAudit('ログイン失敗（パスワード不一致）', email || 'unknown');
      return;
    }
    flash('ログインに成功しました。セッションを開始し、自分のデータにアクセスできます。', 'success');
    logAudit('ログイン成功', email);
    setView('profile');
  };

  const submitResetRequest = () => {
    if (!resetEmail.trim()) {
      flash('登録済みのメールアドレスを入力してください。', 'danger');
      return;
    }
    setResetStage('set');
    flash('入力されたアドレスが登録済みであれば、期限付きのリセットリンクを送信しました。', 'info');
  };

  const submitNewPassword = () => {
    if (passwordStrength(newPassword) < defaultPasswordRequirements.length) {
      flash('新しいパスワードが要件を満たしていません。', 'danger');
      return;
    }
    flash('新しいパスワードを保存しました。次回から新パスワードでログインできます。', 'success');
    logAudit('パスワード再設定');
  };

  const chooseOAuth = (provider: OAuthProvider) => {
    flash(`${provider.label}で認可しました。外部IDと紐づくアカウントでログインし、次回も同じプロバイダで入れます。`, 'success');
    logAudit(`OAuthログイン（${provider.label}）`);
    if (!isAuthView(view)) return;
    setView('profile');
  };

  /* ---------------- Profile / account handlers ---------------- */

  const saveProfile = () => {
    if (!draftName.trim()) {
      flash('表示名は空にできません。', 'danger');
      return;
    }
    setDisplayName(draftName);
    setBio(draftBio);
    setLanguage(draftLang);
    setNotifyNotes(draftNotify);
    flash('プロフィールを保存しました。UI上の表示に反映されます。', 'success');
    setView('profile');
  };

  const linkGoogle = () => {
    if (!linkReauth.trim()) {
      flash('本人確認のため、現在のパスワードを入力してください。', 'warning');
      return;
    }
    setLinkedGoogle(true);
    setLinkReauth('');
    flash('本人確認を経てGoogleを連携しました。既存のシナリオ/セッション/ノートは保持されます。', 'success');
    logAudit('OAuth連携を追加（Google）');
  };

  const logoutOtherDevices = () => {
    flash('他のすべての端末のセッションを無効化しました。', 'success');
    logAudit('他端末ログアウト');
  };

  const runExport = () => {
    const parts = [
      exportScenarios && 'シナリオ',
      exportSessions && 'セッションログ',
      exportNotes && 'ノート',
    ].filter(Boolean);
    if (parts.length === 0) {
      flash('書き出す対象を1つ以上選択してください。', 'warning');
      setExportResult('');
      return;
    }
    const ext = exportFormat === 'json' ? 'JSON' : 'Markdown';
    setExportResult(`${parts.join(' / ')} を ${ext} 形式で書き出しました（myriale-export.${exportFormat === 'json' ? 'json' : 'md'}）。`);
    flash('エクスポートを作成しました。手元に記録を残せます。', 'success');
    logAudit('データエクスポート');
  };

  const confirmWithdraw = () => {
    if (!ackUnderstood) {
      flash('退会の注意事項に同意してください。', 'warning');
      return;
    }
    if (!withdrawPassword.trim()) {
      flash('本人確認のため、再認証のパスワードを入力してください。', 'warning');
      return;
    }
    setDeleted(true);
    flash(
      deletePolicy === 'erase'
        ? 'アカウントを削除しました。シナリオ/セッション/ノートも完全削除され、ログインできなくなります。'
        : 'アカウントを削除しました。公開物は匿名化して保持し、ログインはできなくなります。',
      'danger',
    );
    logAudit(`退会（${deletePolicy === 'erase' ? '完全削除' : '匿名化'}）`);
  };

  /* ---------------- Admin handlers ---------------- */

  const filteredUsers = users.filter((user) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return [user.name, user.email, user.id].some((field) => field.toLowerCase().includes(needle));
  });

  const openAdminDetail = (user: AdminUser) => {
    setSelectedUserId(user.id);
    setView('admin-detail');
    flash(`${user.name}（${user.id}）の詳細を開きました。個人情報の参照は権限で制御されます。`, 'info');
  };

  const toggleSuspend = () => {
    const next: AccountState = selectedUser.state === 'suspended' ? 'active' : 'suspended';
    setUsers((current) => current.map((user) => (user.id === selectedUser.id ? { ...user, state: next } : user)));
    flash(
      next === 'suspended'
        ? `${selectedUser.name} を停止しました。ログイン不可になり、変更は監査ログに残ります。`
        : `${selectedUser.name} を復帰させました。変更は監査ログに残ります。`,
      next === 'suspended' ? 'danger' : 'success',
    );
    logAudit(`${next === 'suspended' ? '停止' : '復帰'}: ${selectedUser.name}`, 'ops@myriale.example');
  };

  const filteredAudit = audit.filter((entry) => {
    const needle = auditQuery.trim().toLowerCase();
    if (!needle) return true;
    return [entry.actor, entry.action].some((field) => field.toLowerCase().includes(needle));
  });

  /* ---------------- View renderers ---------------- */

  const notice = <NoticeBanner tone={noticeTone}>{noticeText}</NoticeBanner>;

  const renderAuth = () => {
    if (view === 'register') {
      return (
        <AuthScaffold
          ariaLabel="新規登録"
          kicker="US-UM01 / Sign up"
          title="アカウントを作成する"
          lead="メールアドレスとパスワードだけで登録できます。メールアドレスは一意である必要があります。"
          context={authContext('登録するとできること', ['下書きのシナリオを保存する', '自分のセッションを続きから遊ぶ', 'ノートとロアブックを編集する'])}
          footer={<><span>アカウントをお持ちですか？</span><Button variant="text" onClick={() => { setView('login'); flash('ログイン画面に切り替えました。', 'info'); }}>ログイン</Button></>}
        >
          {notice}
          <TextField label="メールアドレス" type="email" inputMode="email" autoComplete="email" value={email} onChange={setEmail} placeholder="reader@example.com" required help="登録済みのメールでは作成できません（一意制約）。" error={emailError} />
          <PasswordField label="パスワード" value={password} onChange={setPassword} showStrength showChecklist testId="register-password" error={passwordError} />
          <PasswordField label="パスワード（確認）" value={passwordConfirm} onChange={setPasswordConfirm} autoComplete="new-password" />
          <div className="button-row">
            <Button variant="primary" onClick={submitRegister}>登録する</Button>
            <span className="muted" data-testid="issued-user-id">UserId: {userId}</span>
          </div>
          <OAuthProviders verb="登録" onChoose={chooseOAuth} />
        </AuthScaffold>
      );
    }
    if (view === 'verify') {
      return (
        <AuthScaffold
          ariaLabel="メール確認"
          kicker="US-UM02 / Verify email"
          title="メールアドレスを確認する"
          lead="なりすましや不正登録を減らすため、確認メールのリンクを開いてメールアドレスを確認します。"
          context={authContext('未確認のあいだは', ['一部の公開・共有機能が制限されます', '確認後すぐに通常利用へ戻れます'])}
        >
          {notice}
          <div className="inline-actions" style={{ marginBottom: 14 }}>
            <IdentitySeal state={accountState} initials={sealInitials} size="sm" caption="会員之證" />
            <span data-testid="verify-state"><StatusBadge state={accountState} /></span>
          </div>
          <p className="muted">確認メールを <strong>{KNOWN.email}</strong> に送信しました。メール内のリンクを開くと確認が完了します。</p>
          <div className="button-row">
            <Button variant="primary" onClick={openVerificationLink} disabled={verified}>{verified ? '確認済み' : '確認リンクを開く'}</Button>
            <Button variant="text" onClick={() => flash('確認メールを再送しました。', 'info')}>確認メールを再送</Button>
          </div>
        </AuthScaffold>
      );
    }
    if (view === 'login') {
      return (
        <AuthScaffold
          ariaLabel="ログイン"
          kicker="US-UM03 / Sign in"
          title="ログインする"
          lead="登録した資格情報でログインすると、自分のシナリオ・セッション・ノートにアクセスできます。"
          context={authContext('デモ用の資格情報', [`メール: ${KNOWN.email}`, `パスワード: ${KNOWN.password}`])}
          footer={<><Button variant="text" onClick={() => { setView('reset'); setResetStage('request'); flash('パスワード再設定画面に切り替えました。', 'info'); }}>パスワードをお忘れですか？</Button></>}
        >
          {notice}
          <TextField label="メールアドレス" type="email" inputMode="email" autoComplete="email" value={email} onChange={setEmail} placeholder="reader@example.com" error={emailError} />
          <PasswordField label="パスワード" value={password} onChange={setPassword} autoComplete="current-password" testId="login-password" error={passwordError} />
          <div className="button-row">
            <Button variant="primary" onClick={submitLogin}>ログインする</Button>
          </div>
          <OAuthProviders verb="ログイン" onChoose={chooseOAuth} />
        </AuthScaffold>
      );
    }
    if (view === 'reset') {
      return (
        <AuthScaffold
          ariaLabel="パスワード再設定"
          kicker="US-UM05 / Reset password"
          title="パスワードをリセットする"
          lead="メールアドレスを入力してリセットを開始し、送られたリンクから新しいパスワードを設定します。"
          context={authContext('安全のための配慮', ['リセットリンクは期限付きです', 'アカウントの有無を過度に明かしません'])}
          footer={<><Button variant="text" onClick={() => { setView('login'); flash('ログイン画面に戻りました。', 'info'); }}>ログインに戻る</Button></>}
        >
          {notice}
          {resetStage === 'request' ? (
            <>
              <TextField label="メールアドレス" type="email" inputMode="email" autoComplete="email" value={resetEmail} onChange={setResetEmail} placeholder="reader@example.com" help="登録の有無にかかわらず、同じ案内を表示します。" />
              <div className="button-row"><Button variant="primary" onClick={submitResetRequest}>リセットメールを送信</Button></div>
            </>
          ) : (
            <>
              <PasswordField label="新しいパスワード" value={newPassword} onChange={setNewPassword} showStrength showChecklist testId="reset-password" />
              <div className="button-row"><Button variant="primary" onClick={submitNewPassword}>新しいパスワードを保存</Button></div>
            </>
          )}
        </AuthScaffold>
      );
    }
    // oauth
    return (
      <AuthScaffold
        ariaLabel="OAuthで続ける"
        kicker="US-UM06 / OAuth"
        title="OAuthで登録・ログイン"
        lead="外部IDプロバイダで認可すると、パスワード管理なしで登録・ログインできます。"
        context={authContext('OAuthのうれしさ', ['パスワードを覚えなくてよい', '次回も同じプロバイダで入れる', '同一メールの既存アカウントは統合導線へ'])}
        footer={<><Button variant="text" onClick={() => { setView('login'); flash('メール/パスワードのログインに切り替えました。', 'info'); }}>メールでログイン</Button></>}
      >
        {notice}
        <OAuthProviders verb="続ける" onChoose={chooseOAuth} />
        <p className="field-help">既存のメール/パスワードアカウントとメールが一致する場合は、ログイン後にアカウント統合（US-UM07）へ案内します。</p>
      </AuthScaffold>
    );
  };

  const accountAside = (
    <>
      <h2>アカウント</h2>
      <IdentitySeal state={accountState} initials={sealInitials} caption="会員之證" />
      <div className="snapshot-line"><span>UserId</span><b>{userId}</b></div>
      <div className="snapshot-line"><span>状態</span><StatusBadge state={accountState} /></div>
      <div className="snapshot-line"><span>OAuth</span><b>{linkedGoogle ? 'Google 連携済み' : '未連携'}</b></div>
    </>
  );

  const renderAccountBody = () => {
    if (view === 'profile') {
      return (
        <section className="reg-card" aria-label="プロフィール">
          <SectionHead kicker="US-UM08 / Profile" title="プロフィール" lead="登録情報や設定をいつでも確認できます。" />
          <div className="inline-actions" style={{ marginBottom: 16 }}>
            <IdentitySeal state={accountState} initials={sealInitials} caption={displayName} />
            <StatusBadge state={accountState} />
          </div>
          <DefinitionList
            testId="profile-summary"
            items={[
              { term: '表示名', value: displayName },
              { term: '自己紹介', value: bio },
              { term: '言語/表示', value: language === 'ja' ? '日本語' : language === 'en' ? 'English' : '한국어' },
              { term: '通知設定', value: notifyNotes ? 'ノート更新を通知する' : '通知しない' },
            ]}
          />
          <div className="button-row">
            <Button variant="primary" onClick={() => { setDraftName(displayName); setDraftBio(bio); setDraftLang(language); setDraftNotify(notifyNotes); setView('profile-edit'); flash('プロフィール編集を開きました。', 'info'); }}>プロフィールを編集</Button>
          </div>
        </section>
      );
    }
    if (view === 'profile-edit') {
      return (
        <section className="reg-card" aria-label="プロフィール編集">
          <SectionHead kicker="US-UM09 / Edit profile" title="プロフィールを編集" lead="表示名やアイコン、設定を自分好みに更新できます。" />
          <TextField label="表示名" value={draftName} onChange={setDraftName} required testId="edit-display-name" />
          <TextAreaField label="自己紹介" value={draftBio} onChange={setDraftBio} />
          <SelectField label="言語/表示" value={draftLang} onChange={setDraftLang} options={[{ value: 'ja', label: '日本語' }, { value: 'en', label: 'English' }, { value: 'ko', label: '한국어' }]} />
          <MyrialeCheckbox
            className="checkbox-row"
            label="ノート更新を通知する"
            aria-label="ノート更新を通知する"
            checked={draftNotify}
            onCheckedChange={setDraftNotify}
          />
          <div className="button-row">
            <Button variant="primary" onClick={saveProfile}>変更を保存</Button>
            <Button variant="ghost" onClick={() => { setView('profile'); flash('編集をキャンセルしました。', 'info'); }}>キャンセル</Button>
          </div>
        </section>
      );
    }
    if (view === 'security') {
      return (
        <div className="stack">
          <section className="reg-card" aria-label="ログイン履歴">
            <SectionHead kicker="US-UM10 / Security" title="セキュリティ設定" lead="ログイン履歴の確認や、他端末のログアウトで不正利用リスクを下げられます。" />
            <h3>ログイン履歴</h3>
            <ul className="audit-list" data-testid="login-history">
              <li><time>2026-06-22 09:14</time><span>Chrome / macOS・東京（現在のセッション）</span></li>
              <li><time>2026-06-20 21:30</time><span>Safari / iPhone・横浜</span></li>
              <li><time>2026-06-18 08:05</time><span>Edge / Windows・大阪</span></li>
            </ul>
            <div className="button-row">
              <Button variant="ghost" onClick={logoutOtherDevices}>他のすべての端末からログアウト</Button>
              <Button variant="text" disabled>2要素認証を設定（将来対応）</Button>
            </div>
          </section>

          <section className="reg-card" aria-label="OAuth連携">
            <SectionHead kicker="US-UM07 / Link OAuth" title="OAuthアカウントの連携" lead="既存アカウントにOAuthログインを紐づけ、データが分裂しないようにします。" />
            <div className="snapshot-line"><span>Google</span><StatusBadge state={linkedGoogle ? 'active' : 'pending'}>{linkedGoogle ? '連携済み' : '未連携'}</StatusBadge></div>
            {!linkedGoogle && (
              <>
                <PasswordField label="本人確認のためのパスワード" value={linkReauth} onChange={setLinkReauth} autoComplete="current-password" help="同一メールの別アカウント生成を防ぐため、再認証してから連携します。" testId="link-reauth" />
                <div className="button-row"><Button variant="primary" onClick={linkGoogle}>Googleを連携</Button></div>
              </>
            )}
            {linkedGoogle && <p className="muted">Googleを連携しました。既存のシナリオ/セッション/ノートはそのまま保持されています。</p>}
          </section>
        </div>
      );
    }
    if (view === 'export') {
      return (
        <section className="reg-card" aria-label="データ書き出し">
          <SectionHead kicker="US-UM12 / Export" title="データを書き出す" lead="退会前に、自分のデータを手元に残せます。形式はMarkdown / JSONから選べます。" />
          <MyrialeCheckbox className="checkbox-row" label="シナリオ" aria-label="シナリオを含める" checked={exportScenarios} onCheckedChange={setExportScenarios} />
          <MyrialeCheckbox className="checkbox-row" label="セッションログ" aria-label="セッションログを含める" checked={exportSessions} onCheckedChange={setExportSessions} />
          <MyrialeCheckbox className="checkbox-row" label="ノート" aria-label="ノートを含める" checked={exportNotes} onCheckedChange={setExportNotes} />
          <SelectField label="形式" value={exportFormat} onChange={setExportFormat} options={[{ value: 'markdown', label: 'Markdown' }, { value: 'json', label: 'JSON' }]} />
          <div className="button-row"><Button variant="primary" onClick={runExport}>エクスポートを作成</Button></div>
          {exportResult && <NoticeBanner tone="success" testId="export-result">{exportResult}</NoticeBanner>}
        </section>
      );
    }
    // withdraw
    return (
      <section className="reg-card danger-zone" aria-label="退会">
        <SectionHead kicker="US-UM11 / Withdraw" title="アカウントを削除（退会）" lead="サービス利用を終了します。注意事項の確認と本人確認（再認証）が必要です。" />
        {deleted ? (
          <div data-testid="withdraw-result">
            <div className="inline-actions" style={{ marginBottom: 12 }}>
              <IdentitySeal state="deleted" initials={sealInitials} caption="抹消済み" />
              <StatusBadge state="deleted" />
            </div>
            <p className="muted">{noticeText}</p>
          </div>
        ) : (
          <>
            <p className="muted">削除すると、このアカウントではログインできなくなります。下記の方針を選択してください。</p>
            <MyrialeRadioGroup
              className="delete-policy-group"
              label="データの取り扱い方針"
              value={deletePolicy}
              onValueChange={(value) => setDeletePolicy(value as typeof deletePolicy)}
              options={[
                { value: 'erase', label: 'シナリオ/セッション/ノートを完全削除する' },
                { value: 'anonymize', label: '公開物は匿名化して保持する' },
              ]}
            />
            <MyrialeCheckbox
              className="checkbox-row"
              label="退会すると元に戻せないことを理解しました"
              aria-label="退会の注意事項を理解しました"
              checked={ackUnderstood}
              onCheckedChange={setAckUnderstood}
            />
            <PasswordField label="本人確認のためのパスワード" value={withdrawPassword} onChange={setWithdrawPassword} autoComplete="current-password" testId="withdraw-password" />
            <div className="button-row">
              <Button variant="danger" onClick={confirmWithdraw} disabled={!ackUnderstood || !withdrawPassword.trim()}>アカウントを削除する</Button>
              <Button variant="text" onClick={() => { setView('export'); flash('先にデータを書き出すこともできます。', 'info'); }}>先にデータを書き出す</Button>
            </div>
          </>
        )}
      </section>
    );
  };

  const renderAdminBody = () => {
    if (view === 'admin-list') {
      return (
        <section className="reg-card flush" aria-label="ユーザー一覧">
          <div style={{ padding: '22px 22px 0' }}>
            <SectionHead kicker="US-UM13 / Admin" title="ユーザー一覧" lead="運用・サポートのため、ユーザーの基本情報を閲覧・検索できます。" />
            <div className="toolbar">
              <div className="field grow">
                <label htmlFor="admin-search">ユーザーを検索</label>
                <input id="admin-search" aria-label="ユーザーを検索" type="search" value={query} placeholder="名前 / メール / UserId" onChange={(event) => setQuery(event.target.value)} />
              </div>
              <span className="muted">{filteredUsers.length} 件</span>
            </div>
          </div>
          <UserTable users={filteredUsers} selectedId={selectedUserId} onSelect={openAdminDetail} caption="ユーザー一覧テーブル" />
        </section>
      );
    }
    if (view === 'admin-detail') {
      return (
        <div className="stack">
          <section className="reg-card" aria-label="ユーザー詳細">
            <SectionHead kicker="US-UM14・15 / Moderation & support" title={selectedUser.name} lead="状態の変更（停止/復帰）や、サポート対応のための利用状況を参照できます。" />
            <div className="inline-actions" style={{ marginBottom: 14 }}>
              <IdentitySeal state={selectedUser.state} initials={selectedUser.name.slice(0, 2)} caption={selectedUser.id} />
              <span data-testid="detail-state"><StatusBadge state={selectedUser.state} /></span>
            </div>
            <DefinitionList
              testId="detail-summary"
              items={[
                { term: 'UserId', value: selectedUser.id },
                { term: 'メール', value: <span className="muted">権限により一部マスク: s••••@example.com</span> },
                { term: '登録日', value: selectedUser.registered },
                { term: '最終ログイン', value: selectedUser.lastLogin },
                { term: '利用状況', value: `セッション ${selectedUser.sessions} 件` },
              ]}
            />
            <div className="button-row">
              <Button variant={selectedUser.state === 'suspended' ? 'primary' : 'danger'} onClick={toggleSuspend}>
                {selectedUser.state === 'suspended' ? '復帰させる' : '停止する'}
              </Button>
              <Button variant="ghost" onClick={() => { setView('admin-list'); flash('ユーザー一覧に戻りました。', 'info'); }}>一覧へ戻る</Button>
              <Button variant="text" onClick={() => { setView('audit'); flash('監査ログを開きました。', 'info'); }}>監査ログを見る</Button>
            </div>
          </section>
        </div>
      );
    }
    // audit
    return (
      <section className="reg-card" aria-label="監査ログ">
        <SectionHead kicker="US-UM16 / Audit log" title="監査ログ" lead="認証・権限・削除などの重要操作を記録し、検索できます。" />
        <div className="toolbar">
          <div className="field grow">
            <label htmlFor="audit-search">監査ログを検索</label>
            <input id="audit-search" aria-label="監査ログを検索" type="search" value={auditQuery} placeholder="操作 / 対象で絞り込み" onChange={(event) => setAuditQuery(event.target.value)} />
          </div>
          <span className="muted">{filteredAudit.length} 件</span>
        </div>
        <ul className="audit-list" data-testid="audit-log">
          {filteredAudit.map((entry) => (
            <li key={entry.id}>
              <time>{entry.time}</time>
              <span><strong>{entry.action}</strong> — {entry.actor}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  /* ---------------- Frame selection ---------------- */

  // Map each view to where it sits in the real app's information architecture.
  const authCrumbLabel: Record<string, string> = {
    register: '新規登録', verify: 'メール確認', login: 'ログイン', reset: 'パスワード再設定', oauth: 'OAuth',
  };
  const accountCrumbLabel: Record<string, string> = {
    profile: 'プロフィール', 'profile-edit': 'プロフィール編集', security: 'セキュリティ', export: 'データ書き出し', withdraw: '退会',
  };
  const adminCrumbLabel: Record<string, string> = {
    'admin-list': 'ユーザー一覧', 'admin-detail': 'ユーザー詳細', audit: '監査ログ',
  };

  const chromeAccount = deleted
    ? null
    : { name: displayName, email: KNOWN.email, initials: sealInitials, role: 'アカウント所有者' };

  if (isAuthView(view)) {
    const crumbs: Crumb[] = [{ label: 'Myriale', to: 'scenarioRegister' }, { label: 'アカウント' }, { label: authCrumbLabel[view] ?? 'アカウント' }];
    return (
      <AppChrome section="account" breadcrumbs={crumbs} account={null}>
        <div className="account-kit">{renderAuth()}</div>
      </AppChrome>
    );
  }

  if (isAdminView(view)) {
    const adminActive = view === 'admin-detail' ? 'admin-list' : view;
    const crumbs: Crumb[] = [
      { label: 'Myriale', to: 'scenarioRegister' },
      { label: '運用', to: 'adminUsers' },
      ...(view === 'admin-detail' ? [{ label: 'ユーザー一覧', to: 'adminUsers' as const }] : []),
      { label: adminCrumbLabel[view] ?? '運用' },
    ];
    return (
      <AppChrome
        section="operations"
        breadcrumbs={crumbs}
        account={{ name: '運用 司書', email: 'ops@myriale.example', initials: '運', role: '管理者' }}
      >
        <div className="account-kit">
          <AppFrame
            nav={adminNav}
            active={adminActive}
            onNavigate={(id) => { setView(id as UMView); flash('画面を切り替えました。', 'info'); }}
            onLogout={() => { setView('login'); flash('管理者をログアウトしました。', 'info'); }}
            user={{ name: '運用 司書', email: 'ops@myriale.example', state: 'active', initials: '運' }}
          >
            {notice}
            {renderAdminBody()}
          </AppFrame>
        </div>
      </AppChrome>
    );
  }

  const accountActive = view === 'profile-edit' ? 'profile' : view;
  const accountCrumbs: Crumb[] = [
    { label: 'Myriale', to: 'scenarioRegister' },
    { label: 'アカウント', to: 'profile' },
    ...(view === 'profile-edit' ? [{ label: 'プロフィール', to: 'profile' as const }] : []),
    { label: accountCrumbLabel[view] ?? 'アカウント' },
  ];
  return (
    <AppChrome section="account" breadcrumbs={accountCrumbs} account={chromeAccount}>
      <div className="account-kit">
        <AppFrame
          nav={accountNav}
          active={accountActive}
          onNavigate={(id) => { setView(id as UMView); flash('画面を切り替えました。', 'info'); }}
          onLogout={() => { setView('login'); flash('ログアウトしました。認証セッションを無効化しました。', 'success'); }}
          user={{ name: displayName, email: KNOWN.email, state: accountState, initials: sealInitials }}
          aside={accountAside}
        >
          {notice}
          {renderAccountBody()}
        </AppFrame>
      </div>
    </AppChrome>
  );
}

function authContext(title: string, items: string[]) {
  return (
    <>
      <IdentitySeal state="active" initials="會員" caption="Myriale 会員之證" />
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  );
}
