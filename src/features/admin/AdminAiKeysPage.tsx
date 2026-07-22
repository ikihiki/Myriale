import { useEffect, useMemo, useState } from 'react';
import { Button, Input } from '../../components/ui';
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
  const [provider, setProvider] = useState('runpod');
  const [displayName, setDisplayName] = useState('Runpod Serverless');
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
      <div data-myriale-theme="archive" className="min-h-[calc(100vh-118px)] bg-[image:var(--myr-screen-background)] p-3 font-myr-body text-myr-ink md:p-5">
        <main className="mx-auto grid min-h-[calc(100vh-158px)] max-w-[1180px] content-start rounded-myr-panel border border-white/40 bg-[image:var(--myr-paper-background)] [background-size:26px_100%,auto] p-5 shadow-myr-panel md:p-8" aria-label="AI Provider管理">
          <p className="mb-2 text-myr-caption font-extrabold tracking-[0.16em] text-myr-ink-subtle uppercase">Operations / AI providers</p>
          <header className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-myr-ink/15 pb-5 md:flex-row md:items-end">
            <div>
              <h1 className="m-0 max-w-[820px] font-myr-display text-[clamp(2.25rem,5vw,4.75rem)] leading-[0.95] tracking-[-0.055em]">物語を動かすAIを、ここで整える。</h1>
              <p className="mt-4 max-w-[700px] text-sm leading-7 text-myr-slate"><strong className="text-myr-ink">OpenAIとRunpodの接続状態を管理します。</strong> Vaultから注入された設定はそのまま表示し、管理画面で同じキーを再登録せずに疎通確認できます。</p>
            </div>
            <span className="rounded-full border border-myr-ink/15 bg-myr-paper/80 px-4 py-2 font-myr-mono text-xs font-black text-myr-slate">{keys.filter((key) => key.configured).length} / {keys.length} configured</span>
          </header>

          <div className={`mb-5 rounded-myr-card border px-4 py-3 text-sm font-bold ${error ? 'border-myr-ruby/35 bg-myr-ruby/10 text-myr-ruby' : 'border-myr-iris/25 bg-myr-iris/10 text-myr-ink'}`} role="status" data-testid="ai-key-notice">
            {error?.message ?? notice}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
            <section className="rounded-myr-card border border-myr-ink/15 bg-myr-paper/75 p-5 shadow-myr-card" aria-labelledby="provider-registration-heading">
              <p className="mb-2 font-myr-mono text-myr-caption font-black tracking-[0.14em] text-myr-ruby uppercase">Credential override</p>
              <h2 id="provider-registration-heading" className="m-0 font-myr-display text-[clamp(1.75rem,3vw,2.5rem)] leading-none tracking-myr-display">管理画面からキーを登録</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-xs font-black tracking-myr-label text-myr-slate">Provider
                  <select className="!rounded-myr-card !border !border-myr-ink/15 !bg-myr-paper-bright !px-3 !py-3 !text-base !text-myr-ink" value={provider} onChange={(event) => changeProvider(event.target.value)}>
                    <option value="runpod">Runpod</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </label>
                <label className="grid gap-2 text-xs font-black tracking-myr-label text-myr-slate">表示名
                  <Input aria-label="表示名" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                </label>
              </div>
              <label className="mt-4 grid gap-2 text-xs font-black tracking-myr-label text-myr-slate">APIキー
                <Input aria-label="APIキー" type="password" value={secret} onChange={(event) => setSecret(event.target.value)} placeholder={provider === 'runpod' ? 'rpa_...' : 'sk-...'} />
              </label>
              <p className="mt-3 text-xs leading-5 text-myr-slate">Vaultまたは環境変数で設定済みの場合、ここで同じキーを再登録する必要はありません。</p>
              <Button className="mt-4 !rounded-full !bg-myr-ink !px-5 !py-2.5 !text-sm !font-extrabold !text-myr-paper transition hover:!-translate-y-0.5 hover:!bg-myr-iris disabled:!cursor-not-allowed disabled:!opacity-40" onClick={() => void save()} disabled={busy || !secret.trim()}>キーを保存</Button>
            </section>

            <aside className="rounded-myr-card border border-myr-ink/15 bg-myr-vellum/45 p-5" aria-label="設定の優先順位">
              <p className="mb-2 font-myr-mono text-myr-caption font-black tracking-[0.14em] text-myr-ruby uppercase">Resolution order</p>
              <h2 className="m-0 font-myr-display text-[clamp(1.75rem,3vw,2.5rem)] leading-none tracking-myr-display">設定の優先順位</h2>
              <ol className="mt-5 grid gap-4 p-0">
                <li className="grid grid-cols-[2rem_1fr] gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-myr-ink font-myr-mono text-xs font-black text-myr-paper">1</span><div><strong className="block">Vault / 環境変数</strong><span className="text-sm leading-6 text-myr-slate">デプロイ時に注入された設定を最優先で使用します。</span></div></li>
                <li className="grid grid-cols-[2rem_1fr] gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-myr-ink font-myr-mono text-xs font-black text-myr-paper">2</span><div><strong className="block">管理画面</strong><span className="text-sm leading-6 text-myr-slate">環境設定がないProviderでは暗号化してDBへ保存します。</span></div></li>
              </ol>
            </aside>
          </div>

          <section className="mt-4 overflow-hidden rounded-myr-card border border-myr-ink/15 bg-myr-paper/80 shadow-myr-card" aria-label="AIキー一覧">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-myr-iris/10 font-myr-mono text-myr-caption tracking-[0.1em] text-myr-slate uppercase"><tr><th className="px-4 py-3">Provider</th><th className="px-4 py-3">接続設定</th><th className="px-4 py-3">キー</th><th className="px-4 py-3">検証状態</th><th className="px-4 py-3">操作</th></tr></thead>
                <tbody>{keys.map((key) => (
                  <tr className="border-t border-myr-ink/10" key={key.provider} data-testid={`ai-key-row-${key.provider}`}>
                    <td className="px-4 py-4"><strong className="block font-extrabold">{key.displayName}</strong><span className="font-myr-mono text-xs text-myr-slate">{key.provider}</span></td>
                    <td className="px-4 py-4"><div className="flex flex-wrap gap-1.5">{key.active && <span className="rounded-full bg-myr-ink px-2.5 py-1 text-myr-caption font-black text-myr-paper">使用中</span>}<span className={`rounded-full px-2.5 py-1 text-myr-caption font-black ${key.credentialSource === 'environment' ? 'bg-myr-iris/15 text-myr-iris' : key.credentialSource === 'database' ? 'bg-myr-gold/30 text-myr-ink' : 'bg-myr-ink/8 text-myr-slate'}`}>{sourceLabel(key.credentialSource)}</span></div></td>
                    <td className="px-4 py-4 font-myr-mono text-xs">{key.maskedKey}</td>
                    <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${key.status === 'valid' ? 'bg-[#2f6f57]/15 text-[#2f6f57]' : 'bg-myr-ink/8 text-myr-slate'}`}>{statusLabel(key.status)}</span></td>
                    <td className="px-4 py-4"><div className="flex flex-wrap gap-2"><Button className="!rounded-full !border !border-myr-ink/25 !bg-transparent !px-4 !py-2 !font-extrabold !text-myr-ink hover:!border-myr-iris hover:!text-myr-iris disabled:!cursor-not-allowed disabled:!opacity-35" onClick={() => void test(key.provider)} disabled={busy || !key.configured}>接続テスト</Button>{key.credentialSource === 'database' && <Button className="!rounded-full !bg-myr-ruby !px-4 !py-2 !font-extrabold !text-white disabled:!opacity-35" onClick={() => void remove(key.provider)} disabled={busy}>削除</Button>}</div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </AppChrome>
  );
}
