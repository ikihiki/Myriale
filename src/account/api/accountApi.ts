export type AccountUser = {
  id: string;
  displayName: string;
  email: string;
  bio: string;
  emailConfirmed: boolean;
  state: 'active' | 'deleted' | string;
  canDebugDialogue?: boolean;
};

export type AccountApiError = Error & {
  status?: number;
  errors?: Record<string, string[]>;
};

export type RegisterPayload = { displayName: string; email: string; password: string };
export type LoginPayload = { email: string; password: string };
export type UpdateProfilePayload = { displayName: string; bio: string };
export type PasswordResetRequestPayload = { email: string };
export type ConfirmPasswordResetPayload = { email: string; token: string; newPassword: string };
export type WithdrawPayload = { confirmation: string };

export type PasswordResetRequested = { message: string; resetToken?: string | null };

export type AccountApi = {
  getMe: (signal?: AbortSignal) => Promise<AccountUser | null>;
  register: (payload: RegisterPayload) => Promise<AccountUser>;
  login: (payload: LoginPayload) => Promise<AccountUser>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<AccountUser>;
  requestPasswordReset: (payload: PasswordResetRequestPayload) => Promise<PasswordResetRequested>;
  confirmPasswordReset: (payload: ConfirmPasswordResetPayload) => Promise<void>;
  withdraw: (payload: WithdrawPayload) => Promise<void>;
};

const ACCOUNT_API_PATH = '/api/account';

export function getAccountApiBaseUrl() {
  const configured = import.meta.env.VITE_MYRIAL_API_BASE_URL?.trim();
  if (configured && configured.length > 0) return `${configured.replace(/\/$/, '')}${ACCOUNT_API_PATH}`;
  return import.meta.env.VITE_MYRIAL_API_MODE === 'proxy' ? ACCOUNT_API_PATH : null;
}

export function createFetchAccountApi(baseUrl = getAccountApiBaseUrl()): AccountApi {
  if (!baseUrl) return createDemoAccountApi();

  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
      ...init,
    });

    if (response.status === 401) {
      const error = new Error('認証が必要です。') as AccountApiError;
      error.status = 401;
      throw error;
    }

    if (!response.ok) throw await toApiError(response);
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return text ? (JSON.parse(text) as T) : (undefined as T);
  };

  return {
    async getMe(signal) {
      try {
        return await request<AccountUser>('/me', { signal });
      } catch (error) {
        if ((error as AccountApiError).status === 401) return null;
        throw error;
      }
    },
    register: (payload) => request<AccountUser>('/register', jsonPost(payload)),
    login: (payload) => request<AccountUser>('/login', jsonPost(payload)),
    logout: () => request<void>('/logout', { method: 'POST' }),
    updateProfile: (payload) => request<AccountUser>('/profile', { method: 'PUT', body: JSON.stringify(payload) }),
    requestPasswordReset: (payload) => request<PasswordResetRequested>('/password-reset/request', jsonPost(payload)),
    confirmPasswordReset: (payload) => request<void>('/password-reset/confirm', jsonPost(payload)),
    withdraw: (payload) => request<void>('/withdraw', jsonPost(payload)),
  };
}

function jsonPost(payload: unknown): RequestInit {
  return { method: 'POST', body: JSON.stringify(payload) };
}

async function toApiError(response: Response): Promise<AccountApiError> {
  let body: { message?: string; errors?: Record<string, string[]> } | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  const error = new Error(body?.message ?? `Account API returned ${response.status}.`) as AccountApiError;
  error.status = response.status;
  error.errors = body?.errors;
  return error;
}

export function firstFieldError(error: unknown, field: string) {
  return (error as AccountApiError | undefined)?.errors?.[field]?.[0];
}

export function createDemoAccountApi(): AccountApi {
  let demoUser: AccountUser | null = {
    id: 'USR-1031',
    displayName: '霧野しおり',
    email: 'reader@myriale.example',
    bio: '星図を読む巡礼者。夜の図書館で物語を探しています。',
    emailConfirmed: true,
    state: 'active',
    canDebugDialogue: true,
  };
  let demoResetToken = 'demo-reset-token';

  return {
    async getMe() {
      return demoUser;
    },
    async register(payload) {
      if (payload.email === 'reader@myriale.example') throw demoError('このメールアドレスは既に登録されています。', 409, { email: ['既に登録されています。'] });
      demoUser = { id: 'USR-2F9A', displayName: payload.displayName || '新しい旅人', email: payload.email, bio: '', emailConfirmed: false, state: 'active' };
      return demoUser;
    },
    async login(payload) {
      if (payload.email !== 'reader@myriale.example' || payload.password !== 'mist-library-2026') throw demoError('メールアドレスまたはパスワードが違います。', 401);
      demoUser = { id: 'USR-1031', displayName: '霧野しおり', email: 'reader@myriale.example', bio: '星図を読む巡礼者。夜の図書館で物語を探しています。', emailConfirmed: true, state: 'active', canDebugDialogue: true };
      return demoUser;
    },
    async logout() {
      demoUser = null;
    },
    async updateProfile(payload) {
      if (!demoUser) throw demoError('認証が必要です。', 401);
      demoUser = { ...demoUser, displayName: payload.displayName, bio: payload.bio };
      return demoUser;
    },
    async requestPasswordReset() {
      demoResetToken = 'demo-reset-token';
      return { message: '登録済みの場合、パスワード再設定の案内を送信しました。', resetToken: demoResetToken };
    },
    async confirmPasswordReset(payload) {
      if (payload.token !== demoResetToken) throw demoError('パスワードを再設定できませんでした。', 400, { token: ['トークンが正しくありません。'] });
    },
    async withdraw(payload) {
      if (!demoUser) throw demoError('認証が必要です。', 401);
      if (payload.confirmation.toLowerCase() !== demoUser.email.toLowerCase()) throw demoError('退会確認の入力が一致しません。', 400, { confirmation: ['登録メールアドレスを入力してください。'] });
      demoUser = null;
    },
  };
}

function demoError(message: string, status: number, errors?: Record<string, string[]>): AccountApiError {
  const error = new Error(message) as AccountApiError;
  error.status = status;
  error.errors = errors;
  return error;
}
