import type { DialogueTurn, SessionCommandResult } from '../../features/session-play/sessionModel';

const PRIVATE_STATE_SENTINEL = 'internal-affinity:7';

export type AiManagedEntitySessionFixture = {
  turns: DialogueTurn[];
  revision: number;
  location: 'start' | 'corridor';
  aiState: { posture: 'cooperative' | 'protective'; privateReason: string } | undefined;
  narrativeCheckpoint: { input: string; revision: number } | null;
};

export const createAiManagedEntitySessionFixture = (): AiManagedEntitySessionFixture => ({
  turns: [{
    id: 1,
    turnTitle: '覚醒室で案内端末を見つける',
    narrative: '現在地は覚醒室。見えているEntityは案内AI端末と接続廊下への扉です。案内役のAI管理状態はまだ生成されていません。',
    kind: 'action',
  }],
  revision: 0,
  location: 'start',
  aiState: undefined,
  narrativeCheckpoint: null,
});

const appendTurn = (fixture: AiManagedEntitySessionFixture, input: string, title: string, narrative: string) => {
  fixture.turns = [...fixture.turns, {
    id: fixture.turns.length + 1,
    turnTitle: title,
    playerInput: input,
    interpretation: '現在地で対話または移動できるEntityへの行動として解釈しました。',
    narrative,
    kind: 'action',
  }];
};

export const submitAiManagedEntityFixtureTurn = (
  fixture: AiManagedEntitySessionFixture,
  rawInput: string,
): SessionCommandResult => {
  const input = rawInput.trim();

  if (/廊下|移動/.test(input)) {
    fixture.location = 'corridor';
    appendTurn(
      fixture,
      input,
      '接続廊下へ移動する',
      '接続廊下へ移動しました。現在見えているEntityは施設外への脱出扉と解析室への扉です。覚醒室の案内AI端末と、解析室内の光学装置は通常のNarrative contextから外れました。',
    );
    return { ok: true, notice: 'move-session後のruntime locationに合わせて、見えるEntityを切り替えました。' };
  }

  if (/失敗|retry|再試行/.test(input)) {
    if (!fixture.narrativeCheckpoint) {
      fixture.revision += 1;
      fixture.aiState = { posture: 'protective', privateReason: PRIVATE_STATE_SENTINEL };
      fixture.narrativeCheckpoint = { input, revision: fixture.revision };
      return {
        ok: false,
        notice: {
          kind: 'timeout',
          title: 'Narrative生成だけが失敗しました',
          message: `AI管理状態はrevision ${fixture.revision}で確定済みです。同じ入力で再試行しても状態更新は重複しません。`,
          tone: 'warning',
          retryable: true,
        },
      };
    }

    const committedRevision = fixture.narrativeCheckpoint.revision;
    fixture.narrativeCheckpoint = null;
    appendTurn(
      fixture,
      input,
      '確定済み状態からNarrativeを再生成する',
      `確定済みrevision ${committedRevision}を再利用してNarrativeだけを生成しました。案内役は短い敬語で安全な経路を示し、状態更新は一度だけです。`,
    );
    return { ok: true, notice: `Narrative retry完了。revision ${committedRevision}を再利用し、二重commitを防ぎました。` };
  }

  if (fixture.revision === 0) {
    fixture.revision = 1;
    fixture.aiState = { posture: 'cooperative', privateReason: PRIVATE_STATE_SENTINEL };
    appendTurn(
      fixture,
      input,
      '案内役と最初の対話を交わす',
      '案内AI端末は「私は施設の案内と安全管理を担当します」と落ち着いた短い敬語で答えます。構造化プロフィールの役割・価値観・話し方と補足Markdownに従い、AI管理状態をrevision 1として初めて保存しました。',
    );
    return { ok: true, notice: '初回interactionで未初期化のAI管理状態を生成し、revision 1としてcommitしました。' };
  }

  const previousRevision = fixture.revision;
  fixture.revision += 1;
  fixture.aiState = { posture: 'protective', privateReason: PRIVATE_STATE_SENTINEL };
  appendTurn(
    fixture,
    input,
    '保存された対話状態を引き継ぐ',
    `案内役は前の対話で築いた協力姿勢を踏まえ、危険を避ける順序で手掛かりを説明します。persisted revision ${previousRevision}を入力に使い、revision ${fixture.revision}へ更新しました。`,
  );
  return { ok: true, notice: `保存済みAI管理状態 revision ${previousRevision}を参照し、revision ${fixture.revision}をcommitしました。` };
};

export const privateStateSentinelForTest = PRIVATE_STATE_SENTINEL;
