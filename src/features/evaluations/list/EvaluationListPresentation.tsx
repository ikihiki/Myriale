import { Badge, Button, HomeCard, Notice } from '../../../components/ui';
import type { EvaluationSessionSummary } from '../api/evaluationsApi';
import { EvaluationPageFrame } from '../shared/EvaluationPageFrame';
import { EvaluationLoadState } from '../shared/EvaluationLoadState';
import type { EvaluationAccount, LoadState } from '../shared/evaluationPageModel';

export function EvaluationListPresentation({ account, state, onOpen, onCreate, onRetry, onNavigate, onLogout }: { account: EvaluationAccount; state: LoadState<EvaluationSessionSummary[]>; onOpen: (id: string) => void; onCreate: () => void; onRetry: () => void; onNavigate: Parameters<typeof EvaluationPageFrame>[0]['onNavigate']; onLogout: () => void | Promise<void> }) {
  return <EvaluationPageFrame account={account} title="評価セッション" kicker="Independent evaluation workspace" description="固定ケースと引用したSession状況を、複数候補・人手rubricで独立して評価します。" onNavigate={onNavigate} onLogout={onLogout}>
    <EvaluationLoadState state={state} onRetry={onRetry}>{(sessions) => sessions.length === 0
      ? <HomeCard as="section" className="grid gap-3 border-dashed"><h2 className="m-0">まだ評価セッションがありません</h2><p className="m-0 text-myr-ink-subtle">Draftを作成し、状況・候補・rubricを固定してから実行します。</p><Button className="w-fit" onClick={onCreate}>最初の評価を作成</Button></HomeCard>
      : <div className="grid gap-4 md:grid-cols-2">{sessions.map((session) => <HomeCard as="article" key={session.id} data-testid={`evaluation-${session.id}`} className="grid gap-4">
        <div className="flex items-start justify-between gap-3"><div><p className="m-0 text-xs font-black uppercase tracking-[.12em] text-myr-iris">{session.id}</p><h2 className="m-0 mt-1 text-2xl">{session.name}</h2></div><Badge tone={session.status === 'completed' ? 'success' : session.status === 'completedWithErrors' ? 'warning' : 'info'}>{session.status}</Badge></div>
        <p className="m-0 text-sm leading-6 text-myr-ink-subtle">{session.description || '説明はありません。'}</p>
        <dl className="m-0 grid grid-cols-3 gap-2 text-center"><div><dt className="text-xs text-myr-ink-subtle">Situations</dt><dd className="m-0 text-xl font-black">{session.situationCount}</dd></div><div><dt className="text-xs text-myr-ink-subtle">Candidates</dt><dd className="m-0 text-xl font-black">{session.candidateCount}</dd></div><div><dt className="text-xs text-myr-ink-subtle">Responses</dt><dd className="m-0 text-xl font-black">{session.completedResponseCount}/{session.plannedResponseCount}</dd></div></dl>
        {session.reviewProgress && <Notice tone="info">Human review {session.reviewProgress.completed}/{session.reviewProgress.total}</Notice>}
        <Button variant="secondary" className="w-fit" onClick={() => onOpen(session.id)}>評価を開く</Button>
      </HomeCard>)}</div>}
    </EvaluationLoadState>
  </EvaluationPageFrame>;
}
