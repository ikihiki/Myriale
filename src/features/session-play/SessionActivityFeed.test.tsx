import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionActivityFeed } from './SessionActivityFeed';
import { sessionActivityFixture } from './sessionActivityFixtures';
import { hasActiveSessionExecutions } from './sessionPlayApi';

afterEach(cleanup);

describe('SessionActivityFeed', () => {
  it('renders accepted input and failure as separate elements without creating an error turn', () => {
    render(<SessionActivityFeed session={sessionActivityFixture('failed')} />);
    expect(screen.getByTestId('session-input-item').textContent).toContain('銀の鍵を扉にかざす');
    expect(screen.getAllByTestId('narrative-turn-item')).toHaveLength(2);
    expect(screen.getAllByRole('alert')[0].textContent).toContain('Player Inputと既存のNarrativeは保存されています');
  });

  it('keeps retry in the stable execution slot', () => {
    const onAction = vi.fn();
    render(<SessionActivityFeed session={sessionActivityFixture('failed')} onExecutionAction={onAction} />);
    fireEvent.click(screen.getAllByRole('button', { name: '再試行' })[0]);
    expect(onAction).toHaveBeenCalledWith('EXE-narrative-failed', 'retry');
    expect(screen.getAllByTestId(/^execution-/)).toHaveLength(3);
  });

  it('shows diagnostics only when the server includes them', () => {
    const production = sessionActivityFixture('failed');
    production.executions = production.executions?.map((execution) => ({ ...execution, developmentDiagnostics: null }));
    const { rerender } = render(<SessionActivityFeed session={production} />);
    expect(screen.queryByText('開発者向け詳細')).toBeNull();
    rerender(<SessionActivityFeed session={sessionActivityFixture('failed')} />);
    expect(screen.getAllByText('開発者向け詳細').length).toBeGreaterThan(0);
  });

  it('polls only while at least one execution is active', () => {
    expect(hasActiveSessionExecutions(sessionActivityFixture('running'))).toBe(true);
    expect(hasActiveSessionExecutions(sessionActivityFixture('failed'))).toBe(false);
  });
});
