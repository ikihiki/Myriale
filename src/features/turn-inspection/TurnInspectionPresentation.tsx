import type { AppChromeAccount } from '../../account/accountPresentation';
import { Badge, Button, Label, Notice, PageCanvas, PageShell, Panel } from '../../components/ui';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import { stringifyInspectionValue, type AiInteraction, type TimelineEntry, type TurnInspectionState } from './turnInspectionModel';

type Props = {
  account: AppChromeAccount | null;
  sessionId: string;
  turnId: string;
  state: TurnInspectionState;
  onBack: () => void;
  onRetry: () => void;
  onLogout: () => void | Promise<void>;
};

const codeClass = 'm-0 max-h-[28rem] max-w-full overflow-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-xl border border-[#303847] bg-[#171b24] p-4 font-mono text-xs leading-6 text-[#f7f4ec]';

function DataItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="grid min-w-0 gap-1 border-l border-[#c8c1b5] pl-3"><dt className="text-[11px] font-black tracking-[.08em] text-[#55515d] uppercase">{label}</dt><dd className={`m-0 min-w-0 break-words [overflow-wrap:anywhere] text-sm font-bold text-[#211d29] ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd></div>;
}

function JsonBlock({ title, value, open = false }: { title: string; value: unknown; open?: boolean }) {
  return <details className="min-w-0 rounded-xl border border-[#c8c1b5] bg-[#fffdf7]" open={open}><summary className="cursor-pointer px-4 py-3 font-extrabold text-[#211d29] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b43c7]">{title}</summary><pre className={`${codeClass} rounded-t-none border-x-0 border-b-0`}>{stringifyInspectionValue(value)}</pre></details>;
}

function Timeline({ title, entries }: { title: string; entries: TimelineEntry[] }) {
  if (!entries.length) return null;
  return <section className="grid min-w-0 gap-3" aria-label={title}><Label as="h3" textRole="sectionEditorial" className="m-0 !text-xl">{title}</Label><ol className="m-0 grid min-w-0 gap-2 p-0">{entries.map((entry, index) => <li key={`${entry.stage}-${index}`} className="grid min-w-0 gap-2 rounded-xl border border-[#cec7bb] bg-[#fffdf7] p-3 sm:grid-cols-[minmax(0,1fr)_auto]"><div className="min-w-0"><strong className="block break-words text-[#211d29]">{entry.label}</strong><span className="block break-words text-xs text-[#55515d]">{entry.startedLabel} → {entry.completedLabel}</span></div><strong className="text-[#4d36b8] tabular-nums">{entry.durationLabel}</strong></li>)}</ol></section>;
}

function InteractionCard({ interaction, index }: { interaction: AiInteraction; index: number }) {
  return <article className="grid min-w-0 gap-4 rounded-2xl border border-[#c8c1b5] bg-[#fffdf7] p-5 shadow-sm" aria-labelledby={`interaction-${interaction.id}`}>
    <header className="flex min-w-0 flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="m-0 font-mono text-[11px] font-bold tracking-widest text-[#4d36b8] uppercase">AI exchange {index + 1} · sequence {interaction.sequence}</p><Label as="h3" textRole="sectionEditorial" id={`interaction-${interaction.id}`} className="m-0 break-words !text-2xl">{interaction.stage}</Label><p className="m-0 break-words text-sm text-[#55515d]">Profile <code>{interaction.aiProfileId}</code> · attempt {interaction.attemptNumber}</p></div><Badge tone={interaction.status === 'succeeded' ? 'success' : interaction.status === 'failed' ? 'danger' : 'info'}>{interaction.status}</Badge></header>
    <dl className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(145px,1fr))] gap-4"><DataItem label="Provider" value={interaction.providerLabel} /><DataItem label="Model" value={interaction.modelLabel} /><DataItem label="Elapsed" value={interaction.latencyLabel} /><DataItem label="Tokens" value={interaction.tokenLabel} /><DataItem label="AI started (exact)" value={interaction.startedAt} mono /><DataItem label="AI completed (exact)" value={interaction.completedAt ?? '—'} mono /></dl>
    <div className="grid min-w-0 gap-3"><JsonBlock title="送信したプロンプト" value={interaction.sentPromptLabel} open /><JsonBlock title="AIから受信した結果" value={interaction.receivedResultLabel} open />{interaction.validationResult && <JsonBlock title="検証結果" value={interaction.validationResult} />}</div>
  </article>;
}

export function TurnInspectionPresentation({ account, sessionId, turnId, state, onBack, onRetry, onLogout }: Props) {
  const inspection = state.status === 'ready' ? state.inspection : null;
  const crumbs: Crumb[] = [{ label: 'Myriale', to: 'home' }, { label: 'セッション', to: 'sessionList' }, { label: inspection?.scenarioTitle ?? sessionId }, { label: `Turn ${inspection?.turn.position ?? turnId}` }, { label: '実行詳細' }];
  return <AppChrome section="sessions" breadcrumbs={crumbs} account={account} onLogout={onLogout}><PageCanvas><PageShell width="chrome" className="min-w-0 gap-7 text-[#211d29]" aria-label="Turn実行詳細">
    <header className="grid min-w-0 gap-5 border-b border-[#c8c1b5] pb-6"><Button variant="secondary" className="w-fit" onClick={onBack}>← セッションに戻る</Button><div className="flex min-w-0 flex-wrap items-end justify-between gap-5"><div className="min-w-0"><p className="kicker m-0 text-[#4d36b8]">Turn-scoped execution inspection</p><Label as="h1" textRole="sectionEditorial" className="m-0 break-words">Turn 実行詳細</Label><p className="m-0 max-w-3xl break-words leading-7 text-[#55515d]">Player InputからAI処理、ルール適用、状態変化まで、このTurnだけの実行経路を確認します。閲覧権限はサーバーが判定します。</p></div>{inspection?.execution && <div className="grid min-w-44 rounded-xl border border-[#7059d8] bg-[#eee9ff] px-5 py-4 text-right"><span className="text-xs font-black tracking-widest text-[#4d36b8] uppercase">Elapsed time</span><strong className="font-myr-display text-4xl text-[#38249c] tabular-nums">{inspection.execution.elapsedLabel}</strong></div>}</div></header>
    {state.status === 'loading' && <Notice tone="info">Turnの実行詳細を読み込んでいます。</Notice>}
    {state.status === 'error' && <div className="grid gap-3"><Notice tone="danger" role="alert">{state.message}</Notice><Button variant="secondary" className="w-fit" onClick={onRetry}>もう一度読み込む</Button></div>}
    {inspection && <>
      <Panel as="section" className="grid min-w-0 gap-4" aria-label="Turn概要"><div className="flex min-w-0 flex-wrap items-baseline justify-between gap-3"><div className="min-w-0"><p className="kicker m-0 text-[#4d36b8]">{inspection.scenarioTitle}</p><Label as="h2" textRole="sectionEditorial" className="m-0 break-words !text-3xl">Turn {inspection.turn.position}</Label></div><Badge tone="neutral">{inspection.turn.kind}</Badge></div><dl className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3"><DataItem label="Turn ID" value={inspection.turn.id} mono /><DataItem label="Session ID" value={inspection.sessionId} mono /><DataItem label="Created" value={inspection.turn.createdLabel} /></dl>{inspection.playerInput && <div className="min-w-0 rounded-xl border border-[#d0c6e7] bg-[#f3effd] p-4"><strong className="text-[#38249c]">Player Input</strong><p className="m-0 mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[#211d29]">{inspection.playerInput.text}</p></div>}</Panel>
      {inspection.execution && <Panel as="section" className="grid min-w-0 gap-5" aria-label="Execution timing"><div><p className="kicker m-0 text-[#4d36b8]">Execution</p><Label as="h2" textRole="sectionEditorial" className="m-0 !text-3xl">実行タイミング</Label></div><dl className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3"><DataItem label="Execution ID" value={inspection.execution.id} mono /><DataItem label="Status / stage" value={`${inspection.execution.status} / ${inspection.execution.stage ?? '—'}`} /><DataItem label="Elapsed" value={inspection.execution.elapsedLabel} /><DataItem label="Started" value={inspection.execution.startedLabel} /><DataItem label="Completed" value={inspection.execution.completedLabel} /></dl><Timeline title="Execution timeline" entries={inspection.execution.timeline} /></Panel>}
      <Panel as="section" className="grid min-w-0 gap-5" aria-label="Rule engine details"><div><p className="kicker m-0 text-[#4d36b8]">Rule engine</p><Label as="h2" textRole="sectionEditorial" className="m-0 !text-3xl">入力から確定状態まで</Label><p className="m-0 max-w-3xl text-[#55515d]">ルールエンジンへ渡した入力、選択されたルール／アクションと引数、適用前後の状態、効果と派生情報を順に示します。</p></div>{inspection.ruleEngine ? <><dl className="grid min-w-0 gap-4 sm:grid-cols-3"><DataItem label="Started" value={inspection.ruleEngine.startedLabel} /><DataItem label="Completed" value={inspection.ruleEngine.completedLabel} /><DataItem label="Duration" value={inspection.ruleEngine.durationLabel} /></dl><Timeline title="Rule-engine timeline" entries={inspection.ruleEngine.timeline} /><div className="grid min-w-0 gap-3 lg:grid-cols-2"><JsonBlock title="Rule input" value={inspection.ruleEngine.input} open /><JsonBlock title="Selected rule / action" value={inspection.ruleEngine.selectedAction} open /><JsonBlock title="Arguments" value={inspection.ruleEngine.arguments} /><JsonBlock title="Before state" value={inspection.ruleEngine.preState} /><JsonBlock title="After state" value={inspection.ruleEngine.postState} /><JsonBlock title="Applied effects" value={inspection.ruleEngine.appliedEffects} /><JsonBlock title="Derived changes" value={inspection.ruleEngine.derivedChanges} /><JsonBlock title="Facts" value={inspection.ruleEngine.facts} /><JsonBlock title="Events" value={inspection.ruleEngine.events} /><JsonBlock title="Hints" value={inspection.ruleEngine.hints} /></div></> : <Notice tone="info">このTurnにはルールエンジンの記録がありません。</Notice>}</Panel>
      <section className="grid min-w-0 gap-4" aria-label="AI interactions"><div><p className="kicker m-0 text-[#4d36b8]">AI interactions</p><Label as="h2" textRole="sectionEditorial" className="m-0 !text-3xl">AI送受信</Label></div>{inspection.interactions.length ? inspection.interactions.map((item, index) => <InteractionCard key={item.id} interaction={item} index={index} />) : <Notice tone="info">このTurnにはAI対話の記録がありません。</Notice>}</section>
      <details className="min-w-0 rounded-xl border border-[#c8c1b5] bg-[#fffdf7]"><summary className="cursor-pointer px-4 py-3 font-extrabold text-[#211d29]">Raw inspection JSON</summary><pre className={`${codeClass} rounded-t-none border-x-0 border-b-0`}>{inspection.rawJson}</pre></details>
    </>}
  </PageShell></PageCanvas></AppChrome>;
}
