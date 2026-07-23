import { Button, HomeCard, HomePanel, Label, Notice } from '../../components/ui';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import type { SessionListItem, SessionListState } from './sessionListModel';

const crumbs: Crumb[] = [{ label: 'Myriale', to: 'home' }, { label: 'セッション' }];

type Props = {
  account: { name: string; email: string; initials: string; role?: string } | null;
  state: SessionListState;
  showCompleted: boolean;
  onShowCompletedChange: (showCompleted: boolean) => void;
  onOpenSession: (sessionId: string) => void;
  onFindScenario: () => void;
  onRetry: () => void;
  onLogout: () => void | Promise<void>;
};

function SessionCards({ sessions, completed, onOpenSession }: { sessions: SessionListItem[]; completed?: boolean; onOpenSession: (sessionId: string) => void }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
      {sessions.map((session) => (
        <HomeCard
          as="article"
          key={session.id}
          data-testid={`session-list-${session.id}`}
          className={completed ? 'border-[rgba(111,79,216,.22)] bg-[rgba(238,234,247,.52)]' : undefined}
        >
          <Label textRole="eyebrowData" className="!tracking-[.08em] !text-[#6f4fd8]">
            {completed ? `完了 / ${session.turnLabel}` : session.turnLabel}
          </Label>
          <Label as="h3" textRole="sectionEditorial" className="m-0 !text-[26px] !leading-[1.12]">{session.scenarioTitle}</Label>
          <p className="m-0 line-clamp-4 leading-7 text-myr-ink-subtle">{session.summary}</p>
          <dl className="my-1 grid gap-1 text-sm text-myr-ink-subtle">
            <div className="flex gap-2"><dt className="font-bold">主人公</dt><dd className="m-0">{session.heroName || '未設定'}</dd></div>
            <div className="flex gap-2"><dt className="font-bold">最終更新</dt><dd className="m-0">{session.updatedLabel}</dd></div>
          </dl>
          <Button variant={completed ? 'secondary' : 'primary'} className="mt-2 w-fit" onClick={() => onOpenSession(session.id)}>
            {completed ? '物語を読み返す' : 'この物語に戻る'}
          </Button>
        </HomeCard>
      ))}
    </div>
  );
}

export function SessionListPresentation({
  account,
  state,
  showCompleted,
  onShowCompletedChange,
  onOpenSession,
  onFindScenario,
  onRetry,
  onLogout,
}: Props) {
  const activeSessions = state.status === 'ready' ? state.sessions.filter((session) => session.status === 'active') : [];
  const completedSessions = state.status === 'ready' ? state.sessions.filter((session) => session.status === 'completed') : [];

  return (
    <AppChrome section="sessions" breadcrumbs={crumbs} account={account} onLogout={onLogout}>
      <main className="mx-auto grid w-full max-w-myr-chrome gap-5 px-5 py-8 text-myr-ink max-sm:px-3" aria-label="セッション一覧">
        <header className="relative overflow-hidden rounded-[30px] border border-[rgba(217,164,65,.30)] bg-[radial-gradient(circle_at_85%_15%,rgba(124,92,255,.24),transparent_28%),linear-gradient(135deg,#1b1625,#332642)] px-7 py-8 text-myr-cream shadow-[0_24px_70px_rgba(18,16,25,.22)] max-sm:rounded-[22px] max-sm:px-5">
          <p className="kicker m-0 text-myr-gold">Your stories</p>
          <h1 className="mt-2 mb-3 font-['Yu_Mincho','Hiragino_Mincho_ProN',Georgia,serif] text-[clamp(38px,6vw,70px)] leading-none tracking-[-.06em]">物語を選ぶ</h1>
          <p className="m-0 max-w-180 leading-7 text-[#ddd2e8]">
            進行中の物語へ戻ったり、完了した物語を読み返したりできます。
          </p>
        </header>

        <HomePanel as="section" aria-label="進行中のセッション">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kicker m-0">In progress</p>
              <Label as="h2" textRole="sectionEditorial" className="m-0">進行中のセッション</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                aria-pressed={showCompleted}
                onClick={() => onShowCompletedChange(!showCompleted)}
              >
                {showCompleted ? '完了済みを隠す' : '完了済みも表示'}
              </Button>
              <Button variant="secondary" onClick={onFindScenario}>新しい物語を始める</Button>
            </div>
          </div>

          {state.status === 'loading' && <Notice tone="info">セッションを読み込んでいます。</Notice>}
          {state.status === 'error' && (
            <div className="grid gap-3">
              <Notice tone="danger">{state.message}</Notice>
              <Button variant="secondary" className="w-fit" onClick={onRetry}>もう一度読み込む</Button>
            </div>
          )}
          {state.status === 'ready' && activeSessions.length === 0 && (
            <HomeCard as="article" className="border-dashed bg-[rgba(220,231,242,.36)]">
              <Label as="h3" textRole="sectionEditorial" className="m-0">進行中のセッションはありません</Label>
              <p className="m-0 leading-7 text-myr-ink-subtle">シナリオを選んで、新しい物語を始められます。</p>
              <Button variant="primary" className="mt-2 w-fit" onClick={onFindScenario}>シナリオを探す</Button>
            </HomeCard>
          )}
          {state.status === 'ready' && activeSessions.length > 0 && (
            <SessionCards sessions={activeSessions} onOpenSession={onOpenSession} />
          )}
        </HomePanel>

        {state.status === 'ready' && showCompleted && (
          <HomePanel as="section" aria-label="完了済みのセッション">
            <div className="mb-4">
              <p className="kicker m-0">Completed</p>
              <Label as="h2" textRole="sectionEditorial" className="m-0">完了済みのセッション</Label>
            </div>
            {completedSessions.length > 0
              ? <SessionCards sessions={completedSessions} completed onOpenSession={onOpenSession} />
              : <p className="m-0 text-myr-ink-subtle">完了済みのセッションはありません。</p>}
          </HomePanel>
        )}
      </main>
    </AppChrome>
  );
}
