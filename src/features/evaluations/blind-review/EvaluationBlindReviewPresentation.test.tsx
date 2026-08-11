import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BlindReviewAssignment } from '../api/evaluationsApi';
import { EvaluationBlindReviewPresentation } from './EvaluationBlindReviewPresentation';

afterEach(cleanup);

const assignment: BlindReviewAssignment = {
  assignmentId: 'REV-1',
  evaluationLabel: 'Blind evaluation review',
  status: 'open',
  currentIndex: 0,
  total: 1,
  item: {
    itemId: 'ITEM-1',
    situationLabel: 'narrative situation',
    situationContext: 'context',
    candidateCode: 'C-A',
    responseText: '完全なレスポンス本文',
    rubric: [
      {
        criterionId: 'quality',
        label: '品質',
        description: '品質を評価する',
        scaleMin: 1,
        scaleMax: 5,
        required: true,
      },
    ],
  },
};

describe('EvaluationBlindReviewPresentation', () => {
  it('shows the full response and blocks scores outside the rubric range', () => {
    render(
      <EvaluationBlindReviewPresentation
        account={null}
        state={{ status: 'ready', data: assignment }}
        saving={false}
        onSave={vi.fn()}
        onSubmit={vi.fn()}
        onRetry={vi.fn()}
        onNavigate={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(screen.getByTestId('blind-response').textContent).toBe(
      '完全なレスポンス本文',
    );
    expect(screen.getByText('1〜5の範囲で入力')).not.toBeNull();

    const score = screen.getByLabelText('品質 score');
    fireEvent.change(score, { target: { value: '40000' } });

    expect(score.getAttribute('aria-invalid')).toBe('true');
    expect(
      screen.getByText('評価点はRubricに定義された範囲内で入力してください。'),
    ).not.toBeNull();
    expect(
      screen.getByRole('button', { name: 'Draftを保存' }).hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen.getByRole('button', { name: '提出して次へ' }).hasAttribute('disabled'),
    ).toBe(true);

    fireEvent.change(score, { target: { value: '5' } });
    expect(score.getAttribute('aria-invalid')).toBe('false');
    expect(
      screen.getByRole('button', { name: 'Draftを保存' }).hasAttribute('disabled'),
    ).toBe(false);
    expect(
      screen.getByRole('button', { name: '提出して次へ' }).hasAttribute('disabled'),
    ).toBe(false);
  });
});
