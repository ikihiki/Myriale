import { useState } from 'react';
import { fn } from '@storybook/test';
import { SessionAiHistoryPresentation } from '../../features/session-ai-history/SessionAiHistoryPresentation';
import type { SessionAiHistoryState } from '../../features/session-ai-history/sessionAiHistoryModel';
import { emptySessionAiHistory, sessionAiHistory } from './sessionAiHistoryFixtures';

export type SessionAiHistoryStoryScenario = 'success' | 'empty' | 'loading' | 'error';

export function MockSessionAiHistoryContainer({
  sessionId,
  scenario = 'success',
  onBack = fn(),
}: {
  sessionId: string;
  scenario?: SessionAiHistoryStoryScenario;
  onBack?: () => void;
}) {
  const initialState: SessionAiHistoryState = scenario === 'loading'
    ? { status: 'loading' }
    : scenario === 'error'
      ? { status: 'error', message: 'AI履歴を読み込めませんでした。時間をおいて再試行してください。' }
      : { status: 'ready', history: scenario === 'empty' ? emptySessionAiHistory : { ...sessionAiHistory, sessionId } };
  const [state, setState] = useState(initialState);

  return (
    <SessionAiHistoryPresentation
      account={{ name: '霧野しおり', email: 'author@myriale.example', initials: '霧野', role: 'シナリオ作者' }}
      sessionId={sessionId}
      state={state}
      onBack={onBack}
      onRetry={() => setState({ status: 'ready', history: { ...sessionAiHistory, sessionId } })}
      onLogout={fn()}
    />
  );
}
