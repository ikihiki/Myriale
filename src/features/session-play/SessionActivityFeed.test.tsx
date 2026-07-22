import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionActivityFeed } from './SessionActivityFeed';
import { sessionActivityFixture } from './sessionActivityFixtures';
import { hasActiveSessionExecutions } from './sessionPlayApi';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('SessionActivityFeed', () => {
  it('renders accepted input and failure as separate elements without creating an error turn', () => {
    render(<SessionActivityFeed session={sessionActivityFixture('failed')} />);
    expect(screen.getByTestId('session-input-item').textContent).toContain('銀の鍵を扉にかざす');
    expect(screen.getAllByTestId('narrative-turn-item')).toHaveLength(2);
    expect(screen.getAllByRole('alert')[0].textContent).not.toContain('入力内容は保存されています');
    expect(screen.getAllByRole('alert')[0].textContent).not.toContain('Player Inputと既存のNarrativeは保存されています');
  });

  it('offers retry and input cancellation without a close action', () => {
    const onAction = vi.fn();
    render(<SessionActivityFeed session={sessionActivityFixture('failed')} onExecutionAction={onAction} />);
    fireEvent.click(screen.getAllByRole('button', { name: '再試行' })[0]);
    expect(onAction).toHaveBeenCalledWith('EXE-narrative-failed', 'retry');
    fireEvent.click(screen.getByRole('button', { name: '入力取り消し' }));
    expect(onAction).toHaveBeenCalledWith('EXE-narrative-failed', 'dismiss');
    expect(screen.queryByRole('button', { name: '閉じる' })).toBeNull();
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

  it('shows prompt, received result, and validation outcome in development diagnostics', () => {
    render(<SessionActivityFeed session={sessionActivityFixture('failed')} />);
    expect(screen.getAllByText('送信したプロンプト').length).toBeGreaterThan(0);
    expect(screen.getAllByText('受信した結果').length).toBeGreaterThan(0);
    expect(screen.getAllByText('バリデーション結果').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Bearer secret/i)).toBeNull();
  });

  it('renders player input as an offset chat bubble and error actions on the second row', () => {
    render(<SessionActivityFeed session={sessionActivityFixture('failed')} />);
    const input = screen.getByTestId('session-input-item');
    expect(input.classList.contains('session-input-item')).toBe(true);
    const error = screen.getByTestId('execution-EXE-narrative-failed');
    expect(error.children[1].classList.contains('execution-actions')).toBe(true);
  });

  it('updates elapsed generation time and toggles diagnostics from the status line', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-21T12:00:05Z'));
    render(<SessionActivityFeed session={sessionActivityFixture('running')} />);
    const execution = screen.getByTestId('execution-EXE-narrative-running');
    expect(execution.textContent).toContain('5秒');
    const details = execution.querySelector('details');
    const summary = execution.querySelector('summary');
    expect(summary?.textContent).toContain('物語: 生成しています');
    expect(details?.open).toBe(false);
    fireEvent.click(summary!);
    expect(details?.open).toBe(true);
    act(() => vi.advanceTimersByTime(1000));
    expect(execution.textContent).toContain('6秒');
  });

  it('removes a completed execution after its exit animation', () => {
    vi.useFakeTimers();
    render(<SessionActivityFeed session={sessionActivityFixture('succeeded')} />);
    expect(screen.getByTestId('execution-EXE-narrative-succeeded')).not.toBeNull();
    act(() => vi.advanceTimersByTime(720));
    expect(screen.queryByTestId('execution-EXE-narrative-succeeded')).toBeNull();
  });

  it('keeps a completed execution visible without the exit animation when the debug setting is enabled', () => {
    vi.useFakeTimers();
    const { rerender } = render(<SessionActivityFeed session={sessionActivityFixture('succeeded')} />);
    let execution = screen.getByTestId('execution-EXE-narrative-succeeded');
    expect(execution.classList.contains('execution-is-completing')).toBe(true);

    rerender(<SessionActivityFeed session={sessionActivityFixture('succeeded')} keepSucceededStatusVisible />);
    execution = screen.getByTestId('execution-EXE-narrative-succeeded');
    expect(execution.classList.contains('execution-is-completing')).toBe(false);
    act(() => vi.advanceTimersByTime(720));
    expect(execution.textContent).toContain('生成が完了しました');
  });

  it('cancels and restarts the exit animation when the debug setting is toggled repeatedly', () => {
    vi.useFakeTimers();
    const session = sessionActivityFixture('succeeded');
    const { rerender } = render(<SessionActivityFeed session={session} />);
    act(() => vi.advanceTimersByTime(300));

    rerender(<SessionActivityFeed session={session} keepSucceededStatusVisible />);
    let execution = screen.getByTestId('execution-EXE-narrative-succeeded');
    expect(execution.classList.contains('execution-is-completing')).toBe(false);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByTestId('execution-EXE-narrative-succeeded')).not.toBeNull();

    rerender(<SessionActivityFeed session={session} />);
    execution = screen.getByTestId('execution-EXE-narrative-succeeded');
    expect(execution.classList.contains('execution-is-completing')).toBe(true);
    act(() => vi.advanceTimersByTime(300));
    rerender(<SessionActivityFeed session={session} keepSucceededStatusVisible />);
    expect(screen.getByTestId('execution-EXE-narrative-succeeded').classList.contains('execution-is-completing')).toBe(false);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByTestId('execution-EXE-narrative-succeeded')).not.toBeNull();
  });

  it('reveals only the modeled short public input interpretation for a server-backed turn', () => {
    const session = sessionActivityFixture('succeeded');
    session.turns = session.turns.map((turn) => turn.id === 'TRN-2'
      ? { ...turn, narrative: { ...turn.narrative!, interpretation: '行動: Playerは銀の鍵を掲げ、扉との対応を確認した。' } }
      : turn);

    render(<SessionActivityFeed session={session} />);
    const summary = screen.getByText('入力の解釈');
    expect(summary.closest('details')?.open).toBe(false);
    fireEvent.click(summary);
    expect(screen.getByText('行動: Playerは銀の鍵を掲げ、扉との対応を確認した。')).not.toBeNull();
  });

  it('does not add an interpretation disclosure when the server does not provide one', () => {
    render(<SessionActivityFeed session={sessionActivityFixture('succeeded')} />);
    expect(screen.queryByText('入力の解釈')).toBeNull();
  });

  it('polls only while at least one execution is active', () => {
    expect(hasActiveSessionExecutions(sessionActivityFixture('running'))).toBe(true);
    expect(hasActiveSessionExecutions(sessionActivityFixture('failed'))).toBe(false);
  });
});
