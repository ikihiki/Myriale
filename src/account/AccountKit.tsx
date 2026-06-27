import {
  useId,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';

/**
 * AccountKit — the UI that recurs across every user-management page.
 *
 * docs/user-stories/user-management-user-stories.md describes registration,
 * login, OAuth, profile, withdrawal and admin screens. Those pages share the
 * same chrome (auth desk, signed-in frame, notice line, form fields, status
 * pills, identity seal, tables). This module factors that chrome into small,
 * presentational, reusable components so each can be inspected on its own as a
 * component story and deployed across the wireframes.
 */

export type AccountState =
  | 'active'
  | 'unverified'
  | 'suspended'
  | 'deleted'
  | 'pending';

const stateMeta: Record<AccountState, { label: string }> = {
  active: { label: '有効' },
  unverified: { label: 'メール未確認' },
  suspended: { label: '停止中' },
  deleted: { label: '削除済み' },
  pending: { label: '保留中' },
};

/* ------------------------------------------------------------------ */
/* Identity seal — the signature element. A wax-seal sigil whose colour */
/* encodes account state, tying a core UM concept to one memorable mark. */
/* ------------------------------------------------------------------ */

export function IdentitySeal({
  state = 'active',
  initials,
  caption,
  size = 'md',
}: {
  state?: AccountState;
  initials: string;
  caption?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={`identity-seal identity-${state} identity-${size}`}>
      <span
        className="identity-seal-mark"
        role="img"
        aria-label={`Myriale 会員之證 / ${stateMeta[state].label}`}
      >
        {initials}
      </span>
      {caption && <small className="identity-seal-caption">{caption}</small>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Brand block                                                         */
/* ------------------------------------------------------------------ */

export function DeskBrand({ subtitle = 'AI story atelier' }: { subtitle?: string }) {
  return (
    <div className="desk-brand">
      <span className="desk-sigil" aria-hidden="true">
        霧
      </span>
      <div>
        <strong>Myriale</strong>
        <small>{subtitle}</small>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Notice banner — the role=status line every page uses for feedback.  */
/* ------------------------------------------------------------------ */

export function NoticeBanner({
  children,
  tone = 'info',
  testId = 'um-notice',
}: {
  children: ReactNode;
  tone?: 'info' | 'success' | 'warning' | 'danger';
  testId?: string;
}) {
  return (
    <div className={`um-notice tone-${tone}`} role="status" data-testid={testId}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section heading                                                     */
/* ------------------------------------------------------------------ */

export function SectionHead({
  kicker,
  title,
  lead,
}: {
  kicker: string;
  title: string;
  lead?: string;
}) {
  return (
    <header className="section-head">
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
      {lead && <p className="section-lead">{lead}</p>}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

export function Button({
  variant = 'ghost',
  className = '',
  type = 'button',
  ...props
}: { variant?: 'primary' | 'ghost' | 'danger' | 'text' } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={`btn btn-${variant} ${className}`.trim()} {...props} />;
}

/* ------------------------------------------------------------------ */
/* Form fields                                                         */
/* ------------------------------------------------------------------ */

function Field({
  label,
  htmlFor,
  required,
  help,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  help?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`.trim()}>
      <label htmlFor={htmlFor}>
        {label}
        {required && <span className="req-star" aria-hidden="true"> *</span>}
      </label>
      {children}
      {help && !error && <p className="field-help">{help}</p>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  help,
  error,
  required,
  autoComplete,
  inputMode,
  name,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'search';
  placeholder?: string;
  help?: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'search';
  name?: string;
  testId?: string;
}) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} required={required} help={help} error={error}>
      <input
        id={id}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        name={name}
        data-testid={testId}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  help,
  error,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  help?: string;
  error?: string;
  testId?: string;
}) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} help={help} error={error}>
      <textarea
        id={id}
        aria-label={label}
        value={value}
        placeholder={placeholder}
        data-testid={testId}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  help,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  help?: string;
  testId?: string;
}) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} help={help}>
      <select
        id={id}
        aria-label={label}
        value={value}
        data-testid={testId}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* Password field with strength meter + requirement checklist          */
/* ------------------------------------------------------------------ */

export type PasswordRequirement = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

export const defaultPasswordRequirements: PasswordRequirement[] = [
  { id: 'length', label: '8文字以上', test: (value) => value.length >= 8 },
  { id: 'letter', label: '英字を含む', test: (value) => /[A-Za-z]/.test(value) },
  { id: 'number', label: '数字を含む', test: (value) => /[0-9]/.test(value) },
];

export function passwordStrength(value: string, requirements = defaultPasswordRequirements): number {
  return requirements.filter((requirement) => requirement.test(value)).length;
}

export function strengthLabel(strength: number, total: number): string {
  if (strength === 0) return 'これから入力';
  if (strength <= 1) return '弱い';
  if (strength < total) return 'ふつう';
  return '要件を満たしています';
}

export function PasswordField({
  label = 'パスワード',
  value,
  onChange,
  autoComplete = 'new-password',
  requirements,
  showStrength = false,
  showChecklist = false,
  help,
  error,
  testId,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  requirements?: PasswordRequirement[];
  showStrength?: boolean;
  showChecklist?: boolean;
  help?: string;
  error?: string;
  testId?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const reqs = requirements ?? defaultPasswordRequirements;
  const strength = passwordStrength(value, reqs);

  return (
    <Field label={label} htmlFor={id} help={help} error={error}>
      <div className="password-field">
        <input
          id={id}
          aria-label={label}
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          data-testid={testId}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="password-toggle"
          aria-pressed={visible}
          aria-label={visible ? 'パスワードを隠す' : 'パスワードを表示'}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? '隠す' : '表示'}
        </button>
      </div>
      {showStrength && (
        <div className="strength-block">
          <div className="strength-meter" data-strength={strength} aria-hidden="true">
            <span style={{ width: `${(strength / reqs.length) * 100}%` }} />
          </div>
          <p className="strength-label" data-testid={testId ? `${testId}-strength` : undefined}>
            強度: {strengthLabel(strength, reqs.length)}
          </p>
        </div>
      )}
      {showChecklist && (
        <ul className="req-list" aria-label="パスワード要件">
          {reqs.map((requirement) => {
            const met = requirement.test(value);
            return (
              <li key={requirement.id} className={met ? 'met' : ''} data-met={met}>
                <span aria-hidden="true">{met ? '✓' : '○'}</span> {requirement.label}
              </li>
            );
          })}
        </ul>
      )}
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* OAuth provider buttons                                              */
/* ------------------------------------------------------------------ */

export type OAuthProvider = { id: string; label: string; glyph: string };

export const defaultProviders: OAuthProvider[] = [
  { id: 'google', label: 'Google', glyph: 'G' },
  { id: 'github', label: 'GitHub', glyph: '⌥' },
];

export function OAuthProviders({
  providers = defaultProviders,
  onChoose,
  verb = '続ける',
}: {
  providers?: OAuthProvider[];
  onChoose?: (provider: OAuthProvider) => void;
  verb?: string;
}) {
  return (
    <div className="oauth-stack">
      <div className="or-divider">
        <span>または</span>
      </div>
      <div className="oauth-row">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className="oauth-button"
            aria-label={`${provider.label}で${verb}`}
            onClick={() => onChoose?.(provider)}
          >
            <span className="oauth-glyph" aria-hidden="true">
              {provider.glyph}
            </span>
            {provider.label}で{verb}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Status badge                                                        */
/* ------------------------------------------------------------------ */

export function StatusBadge({ state, children }: { state: AccountState; children?: ReactNode }) {
  return (
    <span className={`status-badge status-${state}`} data-state={state}>
      <span className="status-dot" aria-hidden="true" />
      {children ?? stateMeta[state].label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Definition list                                                     */
/* ------------------------------------------------------------------ */

export type DefItem = { term: string; value: ReactNode };

export function DefinitionList({ items, testId }: { items: DefItem[]; testId?: string }) {
  return (
    <dl className="def-list" data-testid={testId}>
      {items.map((item) => (
        <div key={item.term}>
          <dt>{item.term}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/* Admin user table                                                    */
/* ------------------------------------------------------------------ */

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  registered: string;
  lastLogin: string;
  state: AccountState;
  sessions: number;
};

export function UserTable({
  users,
  selectedId,
  onSelect,
  caption,
}: {
  users: AdminUser[];
  selectedId?: string;
  onSelect?: (user: AdminUser) => void;
  caption: string;
}) {
  return (
    <table className="user-table">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">ユーザー</th>
          <th scope="col">状態</th>
          <th scope="col">登録日</th>
          <th scope="col">最終ログイン</th>
          <th scope="col">
            <span className="sr-only">操作</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr
            key={user.id}
            className={selectedId === user.id ? 'selected' : ''}
            data-testid={`user-row-${user.id}`}
          >
            <td>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </td>
            <td>
              <StatusBadge state={user.state} />
            </td>
            <td>{user.registered}</td>
            <td>{user.lastLogin}</td>
            <td>
              {onSelect && (
                <Button variant="text" aria-label={`${user.name}を開く`} onClick={() => onSelect(user)}>
                  開く
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ------------------------------------------------------------------ */
/* Auth desk scaffold — centred card layout for pre-login pages.       */
/* ------------------------------------------------------------------ */

export function AuthScaffold({
  ariaLabel,
  kicker,
  title,
  lead,
  children,
  context,
  footer,
}: {
  ariaLabel: string;
  kicker: string;
  title: string;
  lead?: string;
  children: ReactNode;
  context?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="auth-desk">
      <main className="auth-card" aria-label={ariaLabel}>
        <DeskBrand />
        <SectionHead kicker={kicker} title={title} lead={lead} />
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
      </main>
      {context && (
        <aside className="auth-context" aria-label="補足情報">
          {context}
        </aside>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Signed-in app frame — rail nav + main + optional aside.             */
/* ------------------------------------------------------------------ */

export type NavItem = { id: string; label: string };

export function AppFrame({
  nav,
  active,
  onNavigate,
  onLogout,
  user,
  children,
  aside,
}: {
  nav: NavItem[];
  active: string;
  onNavigate: (id: string) => void;
  onLogout: () => void;
  user: { name: string; email: string; state: AccountState; initials: string };
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className={`account-frame ${aside ? 'has-aside' : ''}`.trim()}>
      <aside className="account-rail" aria-label="アカウントナビゲーション">
        <DeskBrand subtitle="Account" />
        <div className="rail-identity">
          <IdentitySeal state={user.state} initials={user.initials} size="sm" />
          <div>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
        </div>
        <nav className="account-nav" aria-label="アカウント画面切り替え">
          {nav.map((item) => (
            <button
              key={item.id}
              className={active === item.id ? 'active' : ''}
              aria-current={active === item.id ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <Button variant="text" className="rail-logout" onClick={onLogout}>
          ログアウト
        </Button>
      </aside>
      <main className="account-main">{children}</main>
      {aside && (
        <aside className="account-aside" aria-label="状態サマリー">
          {aside}
        </aside>
      )}
    </div>
  );
}
