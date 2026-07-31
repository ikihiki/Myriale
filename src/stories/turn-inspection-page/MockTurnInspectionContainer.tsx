import { useState } from 'react';
import { fn } from '@storybook/test';
import { TurnInspectionPresentation } from '../../features/turn-inspection/TurnInspectionPresentation';
import type { TurnInspectionState } from '../../features/turn-inspection/turnInspectionModel';
import { emptyTurnInspection, turnInspection } from './turnInspectionFixtures';

export type TurnInspectionStoryScenario = 'success' | 'empty' | 'loading' | 'error';

export function MockTurnInspectionContainer({ sessionId, turnId, scenario = 'success', onBack = fn() }: { sessionId: string; turnId: string; scenario?: TurnInspectionStoryScenario; onBack?: () => void }) {
  const readyInspection = { ...turnInspection, sessionId, turn: { ...turnInspection.turn, id: turnId } };
  const initialState: TurnInspectionState = scenario === 'loading' ? { status: 'loading' } : scenario === 'error' ? { status: 'error', message: 'Turnの実行詳細を読み込めませんでした。時間をおいて再試行してください。' } : { status: 'ready', inspection: scenario === 'empty' ? { ...emptyTurnInspection, sessionId, turn: { ...emptyTurnInspection.turn, id: turnId } } : readyInspection };
  const [state, setState] = useState(initialState);
  return <TurnInspectionPresentation account={{ name: '霧野しおり', email: 'author@myriale.example', initials: '霧野', role: 'シナリオ作者' }} sessionId={sessionId} turnId={turnId} state={state} onBack={onBack} onRetry={() => setState({ status: 'ready', inspection: readyInspection })} onLogout={fn()} />;
}
