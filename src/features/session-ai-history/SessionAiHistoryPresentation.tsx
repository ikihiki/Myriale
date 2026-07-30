import type { AppChromeAccount } from '../../account/accountPresentation';
import { Badge, Button, DarkPanel, Label, Notice, PageCanvas, PageShell, Panel } from '../../components/ui';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import type { SessionAiHistoryState, SessionAiInteraction } from './sessionAiHistoryModel';

type Props = {
  account: AppChromeAccount | null;
  sessionId: string;
  state: SessionAiHistoryState;
  onBack: () => void;
  onRetry: () => void;
  onLogout: () => void | Promise<void>;
};

function statusTone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  const normalized = status.toLowerCase();
  if (['succeeded', 'success', 'completed'].includes(normalized)) return 'success';
  if (['failed', 'error'].includes(normalized)) return 'danger';
  if (['queued', 'pending', 'retry-wait'].includes(normalized)) return 'warning';
  if (['running', 'processing'].includes(normalized)) return 'info';
  return 'neutral';
}

function DataItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid min-w-0 gap-1 border-l border-myr-ink/12 pl-3">
      <dt className="text-[11px] font-black tracking-[.08em] text-myr-ink-subtle uppercase">{label}</dt>
      <dd className={`m-0 min-w-0 break-words text-sm font-bold ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}

function PayloadBlock({ title, eyebrow, content, defaultOpen = false }: { title: string; eyebrow: string; content: string; defaultOpen?: boolean }) {
  return (
    <details className="group rounded-myr-card border border-white/12 bg-white/5" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-bold text-myr-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-myr-gold">
        <span className="grid gap-0.5">
          <small className="font-mono text-[10px] tracking-[.12em] text-myr-gold uppercase">{eyebrow}</small>
          <span>{title}</span>
        </span>
        <span className="text-myr-gold transition-transform group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true">＋</span>
      </summary>
      <pre className="m-0 max-h-[32rem] overflow-auto whitespace-pre-wrap border-t border-white/10 px-4 py-4 font-mono text-xs leading-6 text-[#f7f1ff]">{content}</pre>
    </details>
  );
}

function InteractionCard({ interaction, index }: { interaction: SessionAiInteraction; index: number }) {
  return (
    <article className="relative grid gap-5 rounded-myr-panel border border-myr-ink/14 bg-[rgba(255,254,249,.82)] p-5 shadow-myr-card" aria-labelledby={`interaction-${interaction.id}`}>
      <div className="absolute top-0 left-0 grid h-full w-1.5 grid-rows-2 overflow-hidden rounded-l-myr-panel" aria-hidden="true">
        <span className="bg-myr-iris" />
        <span className="bg-myr-gold" />
      </div>
      <header className="flex flex-wrap items-start justify-between gap-4 pl-2">
        <div className="grid gap-1">
          <p className="m-0 font-mono text-[11px] font-bold tracking-[.12em] text-myr-iris uppercase">Exchange {String(index + 1).padStart(2, '0')} · Sequence {interaction.sequence}</p>
          <Label as="h2" textRole="sectionEditorial" id={`interaction-${interaction.id}`} className="m-0 !text-[25px]">{interaction.stage}</Label>
          <p className="m-0 text-sm text-myr-ink-subtle">AIプロファイル <code className="font-mono text-xs">{interaction.aiProfileId}</code> / 試行 {interaction.attemptNumber}</p>
        </div>
        <Badge tone={statusTone(interaction.status)} dot>{interaction.status}</Badge>
      </header>

      <dl className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-4 gap-y-5 pl-2">
        <DataItem label="Provider" value={interaction.provider} />
        <DataItem label="Model" value={interaction.model} />
        <DataItem label="Started" value={interaction.startedLabel} />
        <DataItem label="Completed" value={interaction.completedLabel ?? '処理中'} />
        <DataItem label="Latency" value={interaction.latencyLabel} />
        <DataItem label="Tokens" value={interaction.tokenLabel} />
      </dl>

      <DarkPanel className="grid gap-3 !rounded-myr-card !p-3.5">
        <PayloadBlock title="送信したプロンプト" eyebrow="Request" content={interaction.sentPrompt} defaultOpen />
        <PayloadBlock title="AIから受信した結果" eyebrow="Response" content={interaction.receivedResult} defaultOpen />
        {interaction.validationResult && <PayloadBlock title="検証結果" eyebrow="Validation" content={interaction.validationResult} />}
      </DarkPanel>

      <footer className="grid gap-2 border-t border-myr-ink/10 pt-3 pl-2 text-xs text-myr-ink-subtle sm:grid-cols-2">
        <span>Execution: <code className="font-mono">{interaction.executionId}</code></span>
        <span>Attempt: <code className="font-mono">{interaction.executionAttemptId}</code></span>
        {interaction.providerRequestId && <span>Provider request: <code className="font-mono">{interaction.providerRequestId}</code></span>}
        {interaction.finishReason && <span>Finish reason: <strong>{interaction.finishReason}</strong></span>}
        {interaction.errorCode && <span className="font-bold text-myr-ruby">Error: {interaction.errorCode}</span>}
      </footer>
    </article>
  );
}

export function SessionAiHistoryPresentation({ account, sessionId, state, onBack, onRetry, onLogout }: Props) {
  const history = state.status === 'ready' ? state.history : null;
  const crumbs: Crumb[] = [
    { label: 'Myriale', to: 'home' },
    { label: 'セッション', to: 'sessionList' },
    { label: history?.scenarioTitle ?? sessionId },
    { label: 'AI履歴' },
  ];

  return (
    <AppChrome section="sessions" breadcrumbs={crumbs} account={account} onLogout={onLogout}>
      <PageCanvas>
        <PageShell width="chrome" className="gap-7" aria-label="セッションAI履歴">
          <header className="grid gap-5 border-b border-myr-ink/14 pb-6">
            <Button variant="secondary" className="w-fit" onClick={onBack}>← セッションに戻る</Button>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div className="grid gap-1">
                <p className="kicker m-0">AI inspection ledger</p>
                <Label as="h1" textRole="sectionEditorial" className="m-0">AI対話履歴</Label>
                <p className="m-0 max-w-3xl leading-7 text-myr-ink-subtle">シナリオ実行中にAIへ送信した内容と応答を、処理順に確認します。閲覧可否はサーバーがセッションとユーザーの関係から判定します。</p>
              </div>
              {history && (
                <div className="grid min-w-38 gap-0 rounded-myr-card border border-myr-iris/20 bg-myr-iris/8 px-5 py-3 text-right">
                  <strong className="font-myr-display text-4xl leading-none text-myr-iris">{history.interactions.length}</strong>
                  <span className="text-xs font-bold tracking-[.08em] text-myr-ink-subtle">AI EXCHANGES</span>
                </div>
              )}
            </div>
          </header>

          {state.status === 'loading' && <Notice tone="info">AI履歴を読み込んでいます。</Notice>}
          {state.status === 'error' && (
            <div className="grid gap-3">
              <Notice tone="danger" role="alert">{state.message}</Notice>
              <Button variant="secondary" className="w-fit" onClick={onRetry}>もう一度読み込む</Button>
            </div>
          )}
          {history && (
            <>
              <Panel as="section" className="grid gap-4" aria-label="セッション概要">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <p className="kicker m-0">Scenario</p>
                    <Label as="h2" textRole="sectionEditorial" className="m-0 !text-[26px]">{history.scenarioTitle}</Label>
                  </div>
                  <Badge tone="neutral">Session {history.sessionId}</Badge>
                </div>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DataItem label="Scenario ID" value={history.scenarioId} mono />
                  <DataItem label="Session ID" value={history.sessionId} mono />
                </dl>
              </Panel>

              {history.interactions.length === 0 ? (
                <Panel as="section" className="grid gap-2 border-dashed text-center">
                  <Label as="h2" textRole="sectionEditorial" className="m-0 !text-[24px]">AI対話の記録はまだありません</Label>
                  <p className="m-0 text-myr-ink-subtle">このセッションでAI処理が実行されると、送受信内容がここに時系列で表示されます。</p>
                </Panel>
              ) : (
                <section className="grid gap-5" aria-label="AI対話の時系列">
                  {history.interactions.map((interaction, index) => <InteractionCard key={interaction.id} interaction={interaction} index={index} />)}
                </section>
              )}
            </>
          )}
        </PageShell>
      </PageCanvas>
    </AppChrome>
  );
}
