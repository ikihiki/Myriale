import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Input, Label, Notice, PageCanvas, PageShell, Panel, Textarea } from '../../components/ui';
import { toAppChromeAccount } from '../../account/accountPresentation';
import { createFetchAdminAiApi, type AdminAiApiError, type AdminAiCredential, type AdminAiProfile, type AiPromptTestResult } from '../../account/api/adminAiApi';
import { useAccountSession } from '../../account/hooks/useAccountSession';
import { AppChrome, type Crumb } from '../../shared/AppChrome';

const crumbs: Crumb[] = [{ label: 'Myriale', to: 'home' }, { label: '運用', to: 'adminUsers' }, { label: 'AI Provider管理' }];
const fallbackAdmin = { name: '霧野しおり', email: 'admin@myriale.example', initials: '霧野', role: '管理者' };
const blankProfile = { id: 'custom-profile', displayName: 'Custom AI', baseUrl: '', model: '', systemPrompt: '', credentialId: 'custom-credential', enabled: true, revision: undefined as number | undefined, lockedId: false };
const blankCredential = { id: 'custom-credential', displayName: 'Custom credential', secret: '', revision: undefined as number | undefined };

export function AdminAiProvidersPage() {
  const api = useMemo(() => createFetchAdminAiApi(), []);
  const session = useAccountSession();
  const [profiles, setProfiles] = useState<AdminAiProfile[]>([]);
  const [credentials, setCredentials] = useState<AdminAiCredential[]>([]);
  const [profileForm, setProfileForm] = useState(blankProfile);
  const [credentialForm, setCredentialForm] = useState(blankCredential);
  const [promptProfile, setPromptProfile] = useState<AdminAiProfile | null>(null);
  const [prompt, setPrompt] = useState('このAIが利用可能か、日本語で短く応答してください。');
  const [promptResult, setPromptResult] = useState<AiPromptTestResult | null>(null);
  const [notice, setNotice] = useState('Profile定義とCredentialを別々に管理します。Secretは再表示しません。');
  const [error, setError] = useState<AdminAiApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => { const [nextProfiles, nextCredentials] = await Promise.all([api.listProfiles(), api.listCredentials()]); setProfiles(nextProfiles); setCredentials(nextCredentials); };
  useEffect(() => { void reload().catch((caught) => setError(caught as AdminAiApiError)); }, []);
  const run = async (action: () => Promise<void>, success: string) => { setBusy(true); setError(null); try { await action(); await reload(); setNotice(success); } catch (caught) { setError(caught as AdminAiApiError); } finally { setBusy(false); } };

  const saveProfile = () => run(async () => {
    if (profileForm.revision === undefined) await api.createProfile({ id: profileForm.id, displayName: profileForm.displayName, baseUrl: profileForm.baseUrl, model: profileForm.model, systemPrompt: profileForm.systemPrompt, credentialId: profileForm.credentialId, enabled: profileForm.enabled });
    else await api.updateProfile(profileForm.id, { displayName: profileForm.displayName, baseUrl: profileForm.baseUrl, model: profileForm.model, systemPrompt: profileForm.systemPrompt, credentialId: profileForm.credentialId, expectedRevision: profileForm.revision });
    setProfileForm(blankProfile);
  }, 'Profileを保存しました。');
  const saveCredential = () => run(async () => {
    if (credentialForm.revision === undefined) await api.setCredential(credentialForm);
    else await api.replaceCredential(credentialForm.id, { displayName: credentialForm.displayName, secret: credentialForm.secret, expectedRevision: credentialForm.revision });
    setCredentialForm(blankCredential);
  }, 'Credentialを保存しました。');
  const testPrompt = async () => {
    if (!promptProfile) return; setBusy(true); setError(null); setPromptResult(null);
    try { setPromptResult(await api.testPrompt(promptProfile, prompt)); setNotice('テストプロンプトを送信しました。'); } catch (caught) { setError(caught as AdminAiApiError); } finally { setBusy(false); }
  };

  return <AppChrome section="operations" breadcrumbs={crumbs} account={toAppChromeAccount(session.user, '管理者') ?? fallbackAdmin}>
    <PageCanvas data-myriale-theme="archive"><PageShell width="content" aria-label="AI Provider管理">
      <Label as="p" textRole="eyebrow" className="mb-2">Operations / AI providers</Label>
      <header className="mb-6 border-b border-myr-ink/15 pb-5"><Label as="h1" textRole="display" className="m-0">ProfileとCredentialを、別々に整える。</Label><p className="mt-3 max-w-myr-form text-sm leading-7 text-myr-slate">デプロイ所有のProfile/SecretとDB所有の管理リソースを統合表示します。すべての変更はrevisionで競合を検出します。</p></header>
      <Notice className="mb-5" tone={error ? 'danger' : 'info'} variant="soft" role={error ? 'alert' : 'status'} data-testid="ai-admin-notice">{error?.message ?? notice}</Notice>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel as="section" aria-labelledby="profile-heading">
          <Label as="p" textRole="eyebrowData">Profile definition</Label><Label as="h2" textRole="section" id="profile-heading">Profileを作成・編集</Label>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-xs font-black">Profile ID<Input aria-label="Profile ID" disabled={profileForm.lockedId} value={profileForm.id} onChange={(e) => setProfileForm({ ...profileForm, id: e.target.value })}/></label>
            <label className="grid gap-2 text-xs font-black">表示名<Input aria-label="Profile表示名" value={profileForm.displayName} onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}/></label>
            <label className="grid gap-2 text-xs font-black md:col-span-2">Base URL<Input aria-label="Profile Base URL" value={profileForm.baseUrl} onChange={(e) => setProfileForm({ ...profileForm, baseUrl: e.target.value })}/></label>
            <label className="grid gap-2 text-xs font-black">Model<Input aria-label="Profile Model" value={profileForm.model} onChange={(e) => setProfileForm({ ...profileForm, model: e.target.value })}/></label>
            <label className="grid gap-2 text-xs font-black">Credential ID<Input aria-label="Profile Credential ID" value={profileForm.credentialId} onChange={(e) => setProfileForm({ ...profileForm, credentialId: e.target.value })}/></label>
            <label className="grid gap-2 text-xs font-black md:col-span-2">追加システムプロンプト<Textarea className="!min-h-40" aria-label="Profile追加システムプロンプト" value={profileForm.systemPrompt} onChange={(e) => setProfileForm({ ...profileForm, systemPrompt: e.target.value })} maxLength={20000}/><span className="font-normal leading-5 text-myr-slate">アプリの正史・JSON契約を維持したまま、このAI固有の文体や描写方針を追加します。空欄なら追加しません。</span></label>
          </div><Button className="mt-4" variant="secondary" disabled={busy || !profileForm.id || !profileForm.baseUrl || !profileForm.model} onClick={() => void saveProfile()}>Profileを保存</Button>
        </Panel>
        <Panel as="section" aria-labelledby="credential-heading">
          <Label as="p" textRole="eyebrowData">Credential secret</Label><Label as="h2" textRole="section" id="credential-heading">Credentialを設定・置換</Label>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-2 text-xs font-black">Credential ID<Input aria-label="Credential ID" disabled={credentialForm.revision !== undefined} value={credentialForm.id} onChange={(e) => setCredentialForm({ ...credentialForm, id: e.target.value })}/></label>
            <label className="grid gap-2 text-xs font-black">表示名<Input aria-label="Credential表示名" value={credentialForm.displayName} onChange={(e) => setCredentialForm({ ...credentialForm, displayName: e.target.value })}/></label>
            <label className="grid gap-2 text-xs font-black">Secret<Input aria-label="Credential Secret" type="password" value={credentialForm.secret} onChange={(e) => setCredentialForm({ ...credentialForm, secret: e.target.value })}/></label>
          </div><Button className="mt-4" variant="secondary" disabled={busy || !credentialForm.id || !credentialForm.secret} onClick={() => void saveCredential()}>Credentialを保存</Button>
        </Panel>
      </div>

      <Panel as="section" className="mt-4" aria-labelledby="profiles-list-heading"><Label as="h2" textRole="section" id="profiles-list-heading">Profiles</Label>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-190 text-left text-sm"><thead><tr><th>Profile</th><th>Credential</th><th>状態</th><th>操作</th></tr></thead><tbody>{profiles.map((profile) => <tr className="border-t border-myr-ink/10" key={profile.id} data-testid={`ai-profile-row-${profile.id}`}>
          <td className="py-4"><strong>{profile.displayName}</strong><span className="block font-myr-mono text-xs">{profile.id} · r{profile.revision}</span><span className="block text-xs text-myr-slate">{profile.model} · {profile.source}</span></td>
          <td><span className="font-myr-mono text-xs">{profile.credentialId} · r{profile.credentialRevision}</span><Badge tone={profile.credentialConfigured ? 'success' : 'neutral'}>{profile.credentialSource}</Badge></td>
          <td><div className="flex gap-1">{profile.active && <Badge>使用中</Badge>}<Badge tone={profile.enabled ? 'success' : 'neutral'}>{profile.enabled ? '有効' : '無効'}</Badge><Badge>{profile.validationStatus}</Badge></div></td>
          <td><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" disabled={busy} onClick={() => setProfileForm({ id: profile.id, displayName: profile.displayName, baseUrl: profile.baseUrl, model: profile.model, systemPrompt: profile.systemPrompt, credentialId: profile.credentialId, enabled: profile.enabled, revision: profile.source === 'database' ? profile.revision : undefined, lockedId: true })}>{profile.source === 'database' ? '編集' : 'DBで上書き'}</Button><Button size="sm" variant="ghost" disabled={busy || !profile.credentialConfigured} onClick={() => void run(() => api.testConnection(profile), '接続テストを完了しました。')}>接続テスト</Button><Button size="sm" variant="ghost" disabled={busy || !profile.credentialConfigured} onClick={() => { setPromptProfile(profile); setPromptResult(null); }}>プロンプト</Button><Button size="sm" variant="secondary" disabled={busy || profile.active || !profile.enabled || !profile.credentialConfigured} onClick={() => void run(() => api.activateProfile(profile.id), '使用するProfileを変更しました。')}>使用</Button>{profile.source === 'database' && <><Button size="sm" variant="ghost" disabled={busy || profile.active} onClick={() => void run(() => api.setProfileEnabled(profile.id, !profile.enabled, profile.revision), 'Profile状態を変更しました。')}>{profile.enabled ? '無効化' : '有効化'}</Button><Button size="sm" variant="danger" disabled={busy || profile.active} onClick={() => void run(() => api.deleteProfile(profile.id, profile.revision), 'Profileを削除しました。')}>削除</Button></>}</div></td>
        </tr>)}</tbody></table></div>
      </Panel>

      <Panel as="section" className="mt-4" aria-labelledby="credentials-list-heading"><Label as="h2" textRole="section" id="credentials-list-heading">Credentials</Label>
        <div className="mt-4 grid gap-3">{credentials.map((credential) => <div className="flex flex-wrap items-center justify-between gap-3 border-t border-myr-ink/10 pt-3" key={credential.id} data-testid={`ai-credential-row-${credential.id}`}><div><strong>{credential.displayName}</strong><span className="ml-2 font-myr-mono text-xs">{credential.id} · r{credential.revision}</span><span className="ml-2 font-myr-mono text-xs">{credential.maskedSecret}</span><Badge className="ml-2">{credential.referencedProfileCount} refs</Badge></div><div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => setCredentialForm({ id: credential.id, displayName: credential.displayName, secret: '', revision: credential.revision })}>置換</Button><Button size="sm" variant="danger" disabled={busy || credential.referencedProfileCount > 0} onClick={() => void run(() => api.deleteCredential(credential.id, credential.revision), 'Credentialを削除しました。')}>削除</Button></div></div>)}</div>
      </Panel>

      {promptProfile && <Panel as="section" className="mt-4" aria-label={`${promptProfile.displayName}のプロンプトテスト`}><Label as="h2" textRole="section">{promptProfile.displayName}へテスト送信</Label><Textarea className="mt-3 !min-h-32" aria-label="テスト用プロンプト" value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={10000}/><Button className="mt-3" disabled={busy || !prompt.trim()} onClick={() => void testPrompt()}>送信</Button>{promptResult && <pre className="mt-4 whitespace-pre-wrap rounded-myr-card bg-myr-ink p-4 text-myr-paper" data-testid="ai-prompt-result">{promptResult.response}</pre>}</Panel>}
    </PageShell></PageCanvas>
  </AppChrome>;
}
