import { Button, HomeCard, Label, Notice } from '../../components/ui';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import { MyrialeCheckbox } from '../../ui/MyrialeRadix';
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
      <main className="mx-auto grid w-full max-w-myr-chrome gap-10 px-5 py-10 text-myr-ink max-sm:px-3 max-sm:py-6" aria-label="セッション一覧">
        <section className="grid gap-5" aria-label="進行中のセッション">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-myr-ink/14 pb-4">
            <div>
              <p className="kicker m-0">In progress</p>
              <Label as="h1" textRole="sectionEditorial" className="m-0">進行中のセッション</Label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <MyrialeCheckbox
                checked={showCompleted}
                onCheckedChange={onShowCompletedChange}
                label={<span className="grid gap-0.5"><strong className="font-black">完了済みも表示</strong><small className="text-[11px] font-semibold tracking-[.04em] text-myr-ink-subtle">ARCHIVE</small></span>}
                className="rounded-xl border border-myr-ink/12 bg-myr-paper/72 px-3 py-2 shadow-[0_5px_18px_rgba(36,27,47,.06)] transition-[border-color,background,box-shadow] hover:border-myr-iris/35 hover:bg-white [&_.myr-ui-checkbox]:size-6 [&_.myr-ui-checkbox]:rounded-[8px] [&_.myr-ui-checkbox]:border-2 [&_.myr-ui-checkbox]:border-myr-ink/25 [&_.myr-ui-checkbox]:bg-transparent [&_.myr-ui-checkbox]:shadow-none [&_.myr-ui-checkbox[data-state=checked]]:border-myr-iris [&_.myr-ui-checkbox[data-state=checked]]:bg-myr-iris [&_.myr-ui-checkbox-indicator]:text-myr-gold"
              />
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
        </section>

        {state.status === 'ready' && showCompleted && (
          <section className="grid gap-5 border-t border-myr-ink/14 pt-8" aria-label="完了済みのセッション">
            <div>
              <p className="kicker m-0">Completed</p>
              <Label as="h2" textRole="sectionEditorial" className="m-0">完了済みのセッション</Label>
            </div>
            {completedSessions.length > 0
              ? <SessionCards sessions={completedSessions} completed onOpenSession={onOpenSession} />
              : <p className="m-0 text-myr-ink-subtle">完了済みのセッションはありません。</p>}
          </section>
        )}
      </main>
    </AppChrome>
  );
}
