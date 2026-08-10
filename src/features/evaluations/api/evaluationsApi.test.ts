import { describe, expect, it } from 'vitest';
import type { BlindReviewAssignment, BlindReviewItem } from './evaluationsApi';

type ForbiddenReviewerKeys = 'model' | 'modelId' | 'profile' | 'profileId' | 'provider' | 'providerId' | 'machineScore' | 'machineJudgment' | 'latencyMilliseconds' | 'inputTokens' | 'outputTokens' | 'costUsd' | 'telemetry';
type RootLeaks = Extract<keyof BlindReviewAssignment | keyof BlindReviewItem, ForbiddenReviewerKeys>;
const reviewerContractHasNoForbiddenKeys: RootLeaks extends never ? true : false = true;

describe('blind reviewer contract', () => {
  it('does not expose identity, machine score, or telemetry keys', () => {
    expect(reviewerContractHasNoForbiddenKeys).toBe(true);
  });
});
