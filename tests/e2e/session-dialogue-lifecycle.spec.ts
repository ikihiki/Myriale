import { expect, test, type Page, type Route } from './fixtures';

const sessionId = 'SES-E2E-0001';
const scenarioId = 'SCN-STAR-LIBRARY';
const createdAt = '2026-07-22T12:00:00.000Z';

const openingTurn = {
  id: 'TURN-E2E-0001',
  position: 1,
  previousTurnId: null,
  kind: 'narrative',
  narrative: {
    schemaVersion: '1.0',
    turnType: 'action',
    heading: '水没した閲覧室',
    body: '水没した閲覧室で目を覚ます。銀の鍵が淡く光っている。',
    playerInputId: null,
    playerInput: null,
    acceptedAfterTurnId: null,
    signals: [],
    interpretation: null,
  },
  narrativeHandoff: null,
  createdAt,
};

const scenario = {
  id: scenarioId,
  title: '星喰いの地下図書館',
  summary: '地下に沈んだ王都を探索する物語。',
  genre: 'ダークファンタジー探索譚',
  tone: '静かで不穏、淡い希望',
  lore: '星座は魔法体系の鍵。',
  aiFreedom: '中: 設定を守りつつ提案する',
  heroMode: 'select',
  heroFreeGenerationAllowed: false,
  hero: 'ミラ / 星図を読む巡礼者\nセオ / 星図を燃やす護衛',
  opening: openingTurn.narrative.body,
  illustrationStyle: '銅版画風',
  illustrationMood: '湿った静けさ',
  illustrationNegative: '現代車両',
  sampleScene: '水没した閲覧室。',
  status: 'published',
  updatedAt: '2026-07-22',
};

type SessionFixture = {
  id: string;
  scenarioId: string;
  status: string;
  headTurnId: string;
  revision: number;
  interpretationEnabled: boolean;
  turns: Array<Record<string, unknown>>;
  pendingInputs: Array<Record<string, unknown>>;
  inputs: Array<Record<string, unknown>>;
  executions: Array<Record<string, unknown>>;
  artifacts: Array<Record<string, unknown>>;
  activity: Array<Record<string, unknown>>;
  noteProposals: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
};

const createSessionFixture = (): SessionFixture => ({
  id: sessionId,
  scenarioId,
  status: 'Active',
  headTurnId: openingTurn.id,
  revision: 1,
  interpretationEnabled: false,
  turns: [openingTurn],
  pendingInputs: [],
  inputs: [],
  executions: [],
  artifacts: [],
  activity: [{ type: 'turn', id: openingTurn.id, order: 1 }],
  noteProposals: [],
  createdAt,
  updatedAt: createdAt,
});

const json = (route: Route, body: unknown, status = 200) => route.fulfill({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

async function installApiRoutes(page: Page) {
  let session = createSessionFixture();
  const createRequests: Array<Record<string, unknown>> = [];
  const inputRequests: Array<Record<string, unknown>> = [];
  const inputAttempts = new Map<string, number>();

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (request.method() === 'GET' && path === '/api/account/me') {
      return json(route, {
        id: 'USR-E2E-0001',
        displayName: 'E2Eプレイヤー',
        email: 'e2e-player@myriale.invalid',
        bio: '',
        emailConfirmed: true,
        state: 'active',
        canDebugDialogue: true,
      });
    }

    if (request.method() === 'GET' && path === `/api/scenarios/${scenarioId}`) {
      return json(route, scenario);
    }

    if (request.method() === 'POST' && path === '/api/sessions/') {
      const body = request.postDataJSON() as Record<string, unknown>;
      createRequests.push(body);
      session = { ...createSessionFixture(), interpretationEnabled: body.interpretationEnabled === true };
      return json(route, session, 201);
    }

    if (request.method() === 'GET' && path === `/api/sessions/${sessionId}`) {
      return json(route, session);
    }

    if (request.method() === 'GET' && path === `/api/sessions/${sessionId}/memory/`) {
      return json(route, { lorebook: [], summaries: [] });
    }

    if (request.method() === 'POST' && path === `/api/sessions/${sessionId}/inputs`) {
      const body = request.postDataJSON() as Record<string, unknown>;
      inputRequests.push(body);
      const text = String(body.text);
      const attempt = (inputAttempts.get(text) ?? 0) + 1;
      inputAttempts.set(text, attempt);

      if (text === '古い扉の紋章を調べる' && attempt === 1) {
        return json(route, {
          code: 'provider_unavailable',
          message: 'Narrative provider is temporarily unavailable.',
        }, 503);
      }

      const sequence = session.inputs.length + 1;
      const inputId = `INPUT-E2E-${String(sequence).padStart(4, '0')}`;
      const executionId = `EXEC-E2E-${String(sequence).padStart(4, '0')}`;
      const turnId = `TURN-E2E-${String(sequence + 1).padStart(4, '0')}`;
      const position = sequence + 1;
      const input = {
        id: inputId,
        requestId: body.requestId,
        text,
        interactionType: body.interactionType,
        acceptedAfterTurnId: session.headTurnId,
        acceptedSessionRevision: session.revision,
        supersedesInputId: null,
        createdAt,
      };
      const acceptedExecution = {
        id: executionId,
        sessionId,
        kind: 'narrative',
        triggerType: 'player-input',
        triggerId: inputId,
        status: 'queued',
        revision: 1,
        isRetryable: false,
        attemptCount: 0,
        maxAttempts: 3,
        createdAt,
        capabilities: { canRetry: false, canCancel: true, canDismiss: false },
      };
      const completedExecution = {
        ...acceptedExecution,
        status: 'succeeded',
        revision: 2,
        attemptCount: 1,
        startedAt: createdAt,
        completedAt: createdAt,
        capabilities: { canRetry: false, canCancel: false, canDismiss: false },
      };
      const narrativeBody = text === '書架の奥にいる人物へ声をかける'
        ? '書架の奥から司書が現れ、静かに名乗った。'
        : '古い扉の紋章は銀の鍵と同じ星座を描いている。';
      const turn = {
        id: turnId,
        position,
        previousTurnId: session.headTurnId,
        kind: 'narrative',
        narrative: {
          schemaVersion: '1.0',
          turnType: 'action',
          heading: `対話 ${position}`,
          body: narrativeBody,
          playerInputId: inputId,
          playerInput: text,
          acceptedAfterTurnId: session.headTurnId,
          signals: [],
          interpretation: null,
        },
        narrativeHandoff: null,
        createdAt,
      };
      const nextOrder = session.activity.length + 1;
      session = {
        ...session,
        headTurnId: turnId,
        revision: session.revision + 1,
        turns: [...session.turns, turn],
        inputs: [...session.inputs, input],
        executions: [...session.executions, completedExecution],
        activity: [
          ...session.activity,
          { type: 'input', id: inputId, order: nextOrder },
          { type: 'execution', id: executionId, order: nextOrder + 1, causalId: inputId },
          { type: 'turn', id: turnId, order: nextOrder + 2, causalId: executionId },
        ],
        updatedAt: createdAt,
      };
      return json(route, { input, execution: acceptedExecution }, 202);
    }

    return route.continue();
  });

  return { createRequests, inputRequests };
}

const openStory = (page: Page, id: string) =>
  page.goto(`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`);

test('creates a session, completes multiple dialogues, reloads, and reuses the Request ID on retry', async ({ page }) => {
  const api = await installApiRoutes(page);

  await openStory(page, 'アプリ-myriale-app--network-backed-session-lifecycle');
  await page.getByRole('button', { name: '星喰いの地下図書館で開始' }).click();
  await expect(page.getByRole('region', { name: 'イントロと主人公選択' })).toBeVisible();
  await page.getByRole('button', { name: '開始内容を確認' }).click();
  await expect(page.getByTestId('start-review-dialog')).toBeVisible();
  await page.getByRole('button', { name: '物語を始める' }).click();

  await expect(page.getByTestId('session-activity-feed')).toContainText('水没した閲覧室');
  expect(api.createRequests).toHaveLength(1);
  expect(api.createRequests[0].scenarioId).toBe(scenarioId);
  expect(api.createRequests[0].requestId).toMatch(/^session-/);

  await openStory(page, 'アプリ-myriale-app--network-backed-session-reload');
  const composer = page.getByLabel('自由に行動や会話を入力');
  await composer.fill('書架の奥にいる人物へ声をかける');
  await page.getByRole('button', { name: '行動を送る' }).click();
  await expect(page.getByTestId('session-activity-feed')).toContainText('書架の奥から司書が現れ、静かに名乗った。');

  await composer.fill('古い扉の紋章を調べる');
  await page.getByRole('button', { name: '行動を送る' }).click();
  await expect(page.getByTestId('dialogue-notice')).toHaveAttribute('data-notice-kind', 'service-unavailable');
  await expect(composer).toHaveValue('古い扉の紋章を調べる');
  await page.getByRole('button', { name: '同じ入力を再試行' }).click();
  await expect(page.getByTestId('session-activity-feed')).toContainText('古い扉の紋章は銀の鍵と同じ星座を描いている。');

  const retryRequests = api.inputRequests.filter((request) => request.text === '古い扉の紋章を調べる');
  expect(retryRequests).toHaveLength(2);
  expect(retryRequests[0].requestId).toMatch(/^narrative-/);
  expect(retryRequests[1].requestId).toBe(retryRequests[0].requestId);

  await page.reload();
  await expect(page.getByTestId('session-activity-feed')).toContainText('書架の奥から司書が現れ、静かに名乗った。');
  await expect(page.getByTestId('session-activity-feed')).toContainText('古い扉の紋章は銀の鍵と同じ星座を描いている。');
  await expect(page.getByTestId('session-input-item')).toHaveCount(2);
});
