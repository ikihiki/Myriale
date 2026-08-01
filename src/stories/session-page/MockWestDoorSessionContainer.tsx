import { useRef, useState } from 'react';
import type { AppChromeAccount } from '../../account/accountPresentation';
import { SessionPresentation } from '../../features/session-play/SessionPresentation';
import { toDialogueTurn, type SessionCommandResult } from '../../features/session-play/sessionModel';
import type { NarrativeInteractionType, ScenarioTurnStage, SessionApiResponse } from '../../features/session-play/sessionPlayApi';
import { westDoorSessionFixture, westDoorStageOrder } from './westDoorFixtures';

const demoAccount: AppChromeAccount = { name: 'デモプレイヤー', email: 'demo@myriale.example', initials: 'デモ', role: 'プレイヤー' };
const stageDelayMs = 180;

export function MockWestDoorSessionContainer({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<SessionApiResponse>(() => westDoorSessionFixture());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const running = useRef(false);

  const submit = async (input: string, _interactionType: NarrativeInteractionType): Promise<SessionCommandResult> => {
    if (running.current) return { ok: false, notice: 'Scenario Turnを処理中です。' };
    if (input.trim() !== '西の扉を開けて外に出る') return { ok: false, notice: 'このデモでは「西の扉を開けて外に出る」を入力してください。' };
    running.current = true;
    setIsSubmitting(true);
    westDoorStageOrder.forEach((stage, index) => {
      window.setTimeout(() => {
        setSession(westDoorSessionFixture(stage));
        if (stage === 'completed') {
          running.current = false;
          setIsSubmitting(false);
        }
      }, stageDelayMs * index);
    });
    return { ok: true, notice: '入力を受理し、西の扉に対するScenario Turnを開始しました。' };
  };

  const turns = session.turns.map(toDialogueTurn);
  return <SessionPresentation
    sessionId={sessionId}
    account={demoAccount}
    turns={turns}
    headingLinks={turns.map((turn) => ({ title: turn.turnTitle, startTurnId: turn.id, summary: '西扉デモの確定済みTurn' }))}
    sessionStateLabel="Active"
    activitySession={session}
    aiProfiles={[
      { id: 'runpod-recommended', displayName: '推奨（Deckard 40B AWQ）' },
      { id: 'runpod-economy', displayName: '最安（Qwen2.5 14B Abliterated AWQ）' },
    ]}
    defaultActionDecisionAiProfileId="runpod-recommended"
    defaultNarrativeAiProfileId="runpod-recommended"
    initialNotice="西と東の扉がある地下研究室です。自然言語で行動を入力してください。"
    isSubmitting={isSubmitting}
    onSubmit={submit}
    onRecommend={async () => ({ ok: true, value: '西の扉を開けて外に出る', notice: '西扉デモ用の入力例を設定しました。' })}
  />;
}
