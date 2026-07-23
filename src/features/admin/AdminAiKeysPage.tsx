import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Inset, Input, Label, Notice, PageCanvas, PageShell, Panel } from '../../components/ui';
import { toAppChromeAccount } from '../../account/accountPresentation';
import { createFetchAdminAiApi, type AdminAiApiError, type AiProviderKey } from '../../account/api/adminAiApi';
import { useAccountSession } from '../../account/hooks/useAccountSession';
import { AppChrome, type Crumb } from '../../shared/AppChrome';

const crumbs: Crumb[] = [
  { label: 'Myriale', to: 'home' },
  { label: '運用', to: 'adminUsers' },
  { label: 'AI Provider管理' },
];

const fallbackAdmin = { name: '霧野しおり', email: 'admin@myriale.example', initials: '霧野', role: '管理者' };

function sourceLabel(source: AiProviderKey['credentialSource']) {
  if (source === 'environment') return 'Vault / 環境変数';
  if (source === 'database') return '管理画面';
  return '未設定';
}

function statusLabel(status: string) {
  if (status === 'valid') return '接続済み';
  if (status === 'untested') return '未検証';
  return status;
}

export function AdminAiKeysPage() {
  const api = useMemo(() => createFetchAdminAiApi(), []);
  const session = useAccountSession();
  const [keys, setKeys] = useState<AiProviderKey[]>([]);
  const [provider, setProvider] = useState('openai');
  const [displayName, setDisplayName] = useState('OpenAI');
  const [secret, setSecret] = useState('');
  const [notice, setNotice] = useState('デプロイ設定と管理画面で登録したAIキーを確認できます。キー本体は再表示しません。');
  const [error, setError] = useState<AdminAiApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    try {
      setKeys(await api.listKeys());
    } catch (caught) {
      setError(caught as AdminAiApiError);
    }
  };

  useEffect(() => { void reload(); }, []);

  const changeProvider = (next: string) => {
    setProvider(next);
    setDisplayName(next === 'runpod' ? 'Runpod Serverless' : 'OpenAI');
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const key = await api.saveKey(provider, { displayName, secret });
      setKeys((current) => current.map((item) => item.provider === key.provider ? key : item));
      setNotice(`${key.displayName}のAIキーを保存しました。`);
      setSecret('');
    } catch (caught) {
      setError(caught as AdminAiApiError);
    } finally {
      setBusy(false);
    }
  };

  const test = async (target: string) => {
    setBusy(true);
    setError(null);
    try {
      const key = await api.testKey(target);
      setKeys((current) => current.map((item) => item.provider === target ? key : item));
      setNotice(`${key.displayName}への接続テストに成功しました。`);
    } catch (caught) {
      setError(caught as AdminAiApiError);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (target: string) => {
    setBusy(true);
    setError(null);
    try {
      await api.deleteKey(target);
      await reload();
      setNotice('管理画面で保存したAIキーを削除しました。');
    } catch (caught) {
      setError(caught as AdminAiApiError);
    } finally {
      setBusy(false);
    }
  };

  const account = toAppChromeAccount(session.user, '管理者') ?? fallbackAdmin;

  return (
    <AppChrome section="operations" breadcrumbs={crumbs} account={account}>
      <PageCanvas data-myriale-theme="archive">
        <PageShell width="content" aria-label="AI Provider管理">
          <Label as="p" textRole="eyebrow" className="mb-2">Operations / AI providers</Label>
          <header className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-myr-ink/15 pb-5 md:flex-row md:items-end">
            <div>
              <Label as="h1" textRole="display" className="m-0 max-w-myr-section">物語を動かすAIを、ここで整える。</Label>
              <Label as="p" textRole="bodySm" className="mt-4 max-w-myr-form !leading-7"><strong className="text-myr-ink">OpenAIとRunpodの接続状態を管理します。</strong> Vaultから注入された設定はそのまま表示し、管理画面で同じキーを再登録せずに疎通確認できます。</Label>
            </div>
            <Badge className="px-4 py-2 font-myr-mono">{keys.filter((key) => key.configured).length} / {keys.length} configured</Badge>
          </header>

          <Notice className="mb-5" tone={error ? 'danger' : 'info'} variant="soft" role={error ? 'alert' : 'status'} data-testid="ai-key-notice">
            {error?.message ?? notice}
          </Notice>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
            <Panel as="section" aria-labelledby="provider-registration-heading">
              <Label as="p" textRole="eyebrowData" className="mb-2">Credential override</Label>
              <Label as="h2" textRole="section" id="provider-registration-heading" className="m-0">管理画面からキーを登録</Label>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Label as="label" textRole="label" className="grid gap-2">Provider
                  <select className="!rounded-myr-card !border !border-myr-ink/15 !bg-myr-paper-bright !px-3 !py-3 !text-base !text-myr-ink" value={provider} onChange={(event) => changeProvider(event.target.value)}>
                    <option value="openai">OpenAI</option>
                    <option value="runpod">Runpod</option>
                  </select>
                </Label>
                <Label as="label" textRole="label" className="grid gap-2">表示名
                  <Input aria-label="表示名" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                </Label>
              </div>
              <label className="mt-4 grid gap-2 text-xs font-black tracking-myr-label text-myr-slate">APIキー
                <Input aria-label="APIキー" type="password" value={secret} onChange={(event) => setSecret(event.target.value)} placeholder={provider === 'runpod' ? 'rpa_...' : 'sk-...'} />
              </label>
              <p className="mt-3 text-xs leading-5 text-myr-slate">Vaultまたは環境変数で設定済みの場合、ここで同じキーを再登録する必要はありません。</p>
              <Button variant="secondary" className="mt-4" onClick={() => void save()} disabled={busy || !secret.trim()}>キーを保存</Button>
            </Panel>

            <Inset as="aside" aria-label="設定の優先順位">
              <Label as="p" textRole="eyebrowData" className="mb-2">Resolution order</Label>
              <Label as="h2" textRole="section" className="m-0">設定の優先順位</Label>
              <ol className="mt-5 grid gap-4 p-0">
                <li className="grid grid-cols-[2rem_1fr] gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-myr-ink font-myr-mono text-xs font-black text-myr-paper">1</span><div><strong className="block">Vault / 環境変数</strong><span className="text-sm leading-6 text-myr-slate">デプロイ時に注入された設定を最優先で使用します。</span></div></li>
                <li className="grid grid-cols-[2rem_1fr] gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-myr-ink font-myr-mono text-xs font-black text-myr-paper">2</span><div><strong className="block">管理画面</strong><span className="text-sm leading-6 text-myr-slate">環境設定がないProviderでは暗号化してDBへ保存します。</span></div></li>
              </ol>
            </Inset>
          </div>

          <section className="mt-4 overflow-hidden rounded-myr-card border border-myr-ink/15 bg-myr-paper/80 shadow-myr-card" aria-label="AIキー一覧">
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 border-collapse text-left text-sm">
                <thead className="bg-myr-iris/10 font-myr-mono text-myr-caption tracking-[0.1em] text-myr-slate uppercase"><tr><th className="px-4 py-3">Provider</th><th className="px-4 py-3">接続設定</th><th className="px-4 py-3">キー</th><th className="px-4 py-3">検証状態</th><th className="px-4 py-3">操作</th></tr></thead>
                <tbody>{keys.map((key) => (
                  <tr className="border-t border-myr-ink/10" key={key.provider} data-testid={`ai-key-row-${key.provider}`}>
                    <td className="px-4 py-4"><strong className="block font-extrabold">{key.displayName}</strong><span className="font-myr-mono text-xs text-myr-slate">{key.provider}</span></td>
                    <td className="px-4 py-4"><div className="flex flex-wrap gap-1.5">{key.active && <Badge className="!border-myr-ink !bg-myr-ink !text-myr-paper">使用中</Badge>}<Badge tone={key.credentialSource === 'environment' ? 'info' : key.credentialSource === 'database' ? 'warning' : 'neutral'}>{sourceLabel(key.credentialSource)}</Badge></div></td>
                    <td className="px-4 py-4 font-myr-mono text-xs">{key.maskedKey}</td>
                    <td className="px-4 py-4"><Badge tone={key.status === 'valid' ? 'success' : 'neutral'}>{statusLabel(key.status)}</Badge></td>
                    <td className="px-4 py-4"><div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={() => void test(key.provider)} disabled={busy || !key.configured}>接続テスト</Button>{key.credentialSource === 'database' && <Button variant="danger" size="sm" onClick={() => void remove(key.provider)} disabled={busy}>削除</Button>}</div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        </PageShell>
      </PageCanvas>
    </AppChrome>
  );
}
