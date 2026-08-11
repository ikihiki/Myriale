import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createFetchEvaluationsApi,
  type BlindReviewAssignment,
  type BlindReviewItem,
} from './evaluationsApi';

type ForbiddenReviewerKeys =
  | 'model'
  | 'modelId'
  | 'profile'
  | 'profileId'
  | 'provider'
  | 'providerId'
  | 'machineScore'
  | 'machineJudgment'
  | 'latencyMilliseconds'
  | 'inputTokens'
  | 'outputTokens'
  | 'costUsd'
  | 'telemetry';
type RootLeaks = Extract<
  keyof BlindReviewAssignment | keyof BlindReviewItem,
  ForbiddenReviewerKeys
>;
const reviewerContractHasNoForbiddenKeys: RootLeaks extends never
  ? true
  : false = true;

const summary = {
  id: 'EVS-1',
  title: 'Contract test',
  purpose: 'integration',
  status: 'draft',
  revision: 2,
  situationCount: 0,
  candidateCount: 0,
  plannedAttemptCount: 0,
  terminalAttemptCount: 0,
  succeededAttemptCount: 0,
  failedAttemptCount: 0,
  reviewedItemCount: 0,
  identitiesRevealed: false,
  createdAt: '2026-08-10T00:00:00Z',
};
const session = {
  summary,
  config: {},
  rubric: [],
  reviewPolicy: { mode: 'double-blind' },
  situations: [],
  candidates: [],
};
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

afterEach(() => vi.unstubAllGlobals());

describe('evaluation API contracts', () => {
  it('maps create input to the backend request and nested session response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(session, 201));
    vi.stubGlobal('fetch', fetchMock);
    const result = await createFetchEvaluationsApi().createSession({
      name: 'Contract test',
      description: 'integration',
      sourceScenarioId: 'SCN-1',
    });
    expect(result.id).toBe('EVS-1');
    expect(result.name).toBe('Contract test');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/evaluation-sessions',
      expect.objectContaining({ method: 'POST' }),
    );
    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(body).toMatchObject({
      title: 'Contract test',
      purpose: 'integration',
      tags: ['scenario:SCN-1'],
      sensitivity: 'internal',
      retentionPolicy: 'standard',
    });
    expect(body).not.toHaveProperty('name');
  });

  it('uses the accepted start route/status then reloads the session DTO', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ session: summary, attempts: [] }, 202))
      .mockResolvedValueOnce(
        json({ ...session, summary: { ...summary, status: 'queued' } }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const result = await createFetchEvaluationsApi().start('EVS-1');
    expect(result.status).toBe('queued');
    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/evaluation-sessions/EVS-1:start',
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    expect(fetchMock.mock.calls[1][0]).toBe('/api/evaluation-sessions/EVS-1');
  });

  it('preserves the complete narrative response for blind review', async () => {
    const body = '長い本文'.repeat(100);
    const fetchMock = vi.fn().mockResolvedValue(
      json({
        opaqueCode: 'REV-1',
        status: 'draft',
        revision: 0,
        rubric: [{ id: 'quality', label: 'Quality', required: true }],
        items: [
          {
            id: 'ITEM-1',
            candidateCode: 'C-A',
            stage: 'narrative',
            situation: { prompt: 'blind' },
            response: { heading: '見出し', body },
            displayOrder: 1,
            judgments: [],
          },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await createFetchEvaluationsApi().getBlindAssignment('REV-1');

    expect(result.item?.responseText).toBe(`見出し\n\n${body}`);
    expect(result.item?.responseText).not.toContain('...');
  });

  it('submits reviewer judgments through criterion PUTs and the assignment submit route', async () => {
    const open = {
      opaqueCode: 'REV-1',
      status: 'draft',
      revision: 3,
      rubric: [{ id: 'quality', label: 'Quality', required: true }],
      items: [
        {
          id: 'ITEM-1',
          candidateCode: 'C-A',
          stage: 'narrative',
          situation: { prompt: 'blind' },
          response: { text: 'answer' },
          displayOrder: 1,
          judgments: [],
        },
      ],
    };
    const judged = {
      ...open,
      revision: 4,
      items: [
        {
          ...open.items[0],
          judgments: [
            { criterionKey: 'quality', score: 5, comment: 'good', revision: 1 },
          ],
        },
      ],
    };
    const locked = { ...judged, revision: 5, status: 'locked' };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(open))
      .mockResolvedValueOnce(json({ criterionKey: 'quality', score: 5 }))
      .mockResolvedValueOnce(json(judged))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(json(locked));
    vi.stubGlobal('fetch', fetchMock);
    const result = await createFetchEvaluationsApi().submitBlindJudgment(
      'REV-1',
      'ITEM-1',
      { scores: { quality: 5 }, note: 'good' },
    );
    expect(result.status).toBe('locked');
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      '/api/evaluation-review-assignments/REV-1',
      '/api/evaluation-review-assignments/REV-1/judgments/ITEM-1',
      '/api/evaluation-review-assignments/REV-1',
      '/api/evaluation-review-assignments/REV-1:submit?revision=4',
      '/api/evaluation-review-assignments/REV-1',
    ]);
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body))).toMatchObject({
      assignmentRevision: 3,
      criterionKey: 'quality',
      score: 5,
      comment: 'good',
    });
  });

  it('downloads synchronous exports from the backend GET endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{"ok":true}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:export') });
    const result = await createFetchEvaluationsApi().createExport(
      'EVS-1',
      'json',
    );
    expect(result.downloadUrl).toBe('blob:export');
    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/evaluation-sessions/EVS-1/exports?format=json&redacted=true',
    );
    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty('method');
  });
});

describe('blind reviewer contract', () => {
  it('does not expose identity, machine score, or telemetry keys', () => {
    expect(reviewerContractHasNoForbiddenKeys).toBe(true);
  });
});
