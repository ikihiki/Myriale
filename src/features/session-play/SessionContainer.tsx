import { useEffect, useRef, useState } from 'react';
import { toAppChromeAccount } from '../../account/accountPresentation';
import { useAccountSession } from '../../account/hooks/useAccountSession';
import { useAppNavigation } from '../../shared/nav';
import { SessionPresentation, SessionPresentationStatus } from './SessionPresentation';
import { sessionInfoNotice, toDialogueTurn, toSessionNotice, type SessionCommandResult, type SessionNotice } from './sessionModel';
import {
  acceptSessionInput,
  getSession,
  hasActiveSessionExecutions,
  mutateSessionExecution,
  recommendNextAction,
  reviewSessionNoteProposal,
  type NarrativeInteractionType,
  normalizeSessionApiError,
  type SessionApiError,
  type SessionApiResponse,
} from './sessionPlayApi';
import type { NoteReviewRequest } from './SessionActivityFeed';

export function SessionContainer({ sessionId }: { sessionId: string }) {
  const appNavigate = useAppNavigation();
  const accountSession = useAccountSession();
  const chromeAccount = toAppChromeAccount(accountSession.user);
  const pollGeneration = useRef(0);
  const [session, setSession] = useState<SessionApiResponse | null>(null);
  const [loadNotice, setLoadNotice] = useState<SessionNotice | null>(null);
  const [liveNotice, setLiveNotice] = useState<SessionNotice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitInFlight = useRef(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const draftRequest = useRef<{ input: string; requestId: string; interactionType: NarrativeInteractionType } | null>(null);

  const goToLogin = () => appNavigate?.('login');
  const goToSessionList = () => appNavigate?.('scenarioList');
  const reload = () => window.location.reload();
  const logout = async () => {
    await accountSession.api.logout();
    accountSession.clearUser();
    goToLogin();
  };

  useEffect(() => {
    const abort = new AbortController();
    setSession(null);
    setLoadNotice(null);
    setLiveNotice(null);
    void getSession(sessionId, undefined, abort.signal)
      .then(setSession)
      .catch((reason: SessionApiError) => {
        if (reason.name === 'AbortError') return;
        const error = normalizeSessionApiError(reason, 'Sessionを読み込めませんでした。');
        if (error.kind === 'unauthorized') accountSession.clearUser();
        setLoadNotice(toSessionNotice(error, 'load'));
      });
    return () => abort.abort();
  }, [accountSession.clearUser, sessionId]);

  useEffect(() => {
    if (!session || !hasActiveSessionExecutions(session)) return;
    const abort = new AbortController();
    const interval = window.setInterval(() => {
      const generation = ++pollGeneration.current;
      void getSession(sessionId, undefined, abort.signal).then((next) => {
        if (generation !== pollGeneration.current) return;
        setSession((current) => !current || next.revision >= current.revision ? next : current);
      }).catch((reason: SessionApiError) => {
        if (reason.name !== 'AbortError') setLiveNotice(toSessionNotice(normalizeSessionApiError(reason, 'Sessionを更新できませんでした。'), 'poll'));
      });
    }, 750);
    return () => { window.clearInterval(interval); abort.abort(); };
  }, [session, sessionId]);

  if (!session) {
    return <SessionPresentationStatus
      account={chromeAccount}
      notice={loadNotice}
      onLogout={logout}
      onLogin={goToLogin}
      onReload={reload}
      onSessionList={goToSessionList}
    />;
  }

  const submit = async (input: string, interactionType: NarrativeInteractionType): Promise<SessionCommandResult> => {
    if (submitInFlight.current) return { ok: false, notice: sessionInfoNotice('Narrativeを生成中です。') };
    submitInFlight.current = true;
    const reusable = draftRequest.current?.input === input && draftRequest.current.interactionType === interactionType
      ? draftRequest.current
      : null;
    const requestId = reusable?.requestId ?? `narrative-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`;
    draftRequest.current = { input, requestId, interactionType };
    setIsSubmitting(true);
    try {
      const accepted = await acceptSessionInput(sessionId, input, requestId, undefined, interactionType);
      const nextOrder = Math.max(0, ...(session.activity ?? []).map((item) => item.order)) + 1;
      setSession({
        ...session,
        inputs: [...(session.inputs ?? []), accepted.input],
        executions: [...(session.executions ?? []), accepted.execution],
        activity: [...(session.activity ?? []),
          { type: 'input', id: accepted.input.id, order: nextOrder },
          { type: 'execution', id: accepted.execution.id, order: nextOrder + 1, causalId: accepted.input.id }],
      });
      draftRequest.current = null;
      return { ok: true, notice: 'Player Inputを保存し、Narrative生成を開始しました。ブラウザを閉じても処理は継続します。' };
    } catch (reason) {
      const error = normalizeSessionApiError(reason, 'Narrativeの生成に失敗しました。');
      if (error.kind === 'unauthorized') accountSession.clearUser();
      return { ok: false, notice: toSessionNotice(error, 'submit') };
    } finally {
      submitInFlight.current = false;
      setIsSubmitting(false);
    }
  };

  const recommend = async (): Promise<SessionCommandResult<string>> => {
    if (isRecommending || isSubmitting) return { ok: false, notice: sessionInfoNotice('別のAI処理が進行中です。') };
    setIsRecommending(true);
    try {
      return { ok: true, value: await recommendNextAction(sessionId), notice: 'AIの提案を入力欄へ設定しました。内容を編集してから送信できます。' };
    } catch (reason) {
      const error = normalizeSessionApiError(reason, '次の行動案を生成できませんでした。');
      if (error.kind === 'unauthorized') accountSession.clearUser();
      return { ok: false, notice: toSessionNotice(error, 'recommend') };
    } finally {
      setIsRecommending(false);
    }
  };

  const executionAction = async (executionId: string, action: 'retry' | 'cancel' | 'dismiss'): Promise<SessionCommandResult> => {
    try {
      const target = session.executions?.find((item) => item.id === executionId);
      const updated = await mutateSessionExecution(executionId, action);
      if (action === 'dismiss' && target?.triggerType === 'player-input') {
        setSession({
          ...session,
          inputs: session.inputs?.filter((item) => item.id !== target.triggerId),
          executions: session.executions?.filter((item) => item.id !== executionId),
          activity: session.activity?.filter((item) => item.id !== executionId && item.id !== target.triggerId),
        });
      } else {
        setSession({ ...session, executions: (session.executions ?? []).map((item) => item.id === executionId ? updated : item) });
      }
      return { ok: true, notice: action === 'retry' ? '同じ入力で再試行を開始しました。' : action === 'cancel' ? 'キャンセルを要求しました。' : '入力を取り消しました。' };
    } catch (reason) {
      return { ok: false, notice: toSessionNotice(normalizeSessionApiError(reason, 'Executionを更新できませんでした。'), 'execution') };
    }
  };

  const noteReview = async (artifactId: string, action: 'apply' | 'edit-apply' | 'reject' | 'snooze', request: NoteReviewRequest): Promise<SessionCommandResult> => {
    try {
      const updated = await reviewSessionNoteProposal(artifactId, action, request);
      setSession({ ...session, noteProposals: (session.noteProposals ?? []).map((item) => item.artifactId === artifactId ? updated : item) });
      return { ok: true, notice: action === 'apply' || action === 'edit-apply' ? 'ノート変更案を適用し、Revisionを作成しました。' : action === 'reject' ? 'ノート変更案を却下しました。' : 'ノート変更案を後で確認できるよう保留しました。' };
    } catch (reason) {
      return { ok: false, notice: toSessionNotice(normalizeSessionApiError(reason, 'ノート変更案を更新できませんでした。'), 'note-review') };
    }
  };

  const resumableInput = session.pendingInputs.at(-1);
  return <SessionPresentation
    sessionId={sessionId}
    account={chromeAccount}
    turns={session.turns.map(toDialogueTurn)}
    headingLinks={session.turns.map(toDialogueTurn).map((turn) => ({ title: turn.turnTitle, startTurnId: turn.id, summary: 'Serverに保存された確定済みTurn' }))}
    sessionStateLabel="Active"
    activitySession={session}
    initialInput={resumableInput?.input}
    initialInteractionType={resumableInput?.interactionType}
    initialNotice={resumableInput?.errorMessage ?? (resumableInput ? '未完了のPlayer Inputを復元しました。同じRequest IDで再試行できます。' : 'Serverに保存された確定済みTurnを表示しています。')}
    liveNotice={liveNotice}
    isSubmitting={isSubmitting}
    isRecommending={isRecommending}
    onLogout={logout}
    onLogin={goToLogin}
    onReload={reload}
    onSessionList={goToSessionList}
    onSubmit={submit}
    onRecommend={recommend}
    onExecutionAction={executionAction}
    onNoteReview={noteReview}
  />;
}
