import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { SessionListPresentation } from '../features/session-list/SessionListPresentation';
import type { SessionListItem, SessionListState } from '../features/session-list/sessionListModel';

const activeSession: SessionListItem = {
  id: 'SES-LIVE-1098',
  status: 'active',
  scenarioTitle: '星喰いの地下図書館',
  heroName: 'リュカ',
  turnLabel: '第14ターン',
  summary: '禁書庫の扉を開き、星図に刻まれた次の道を探している。',
  updatedLabel: '2026/07/23 19:30',
};
const completedSession: SessionListItem = {
  id: 'SES-DONE-2042',
  status: 'completed',
  scenarioTitle: '灰の駅と宛名のない切符',
  heroName: 'ノア',
  turnLabel: '第31ターン',
  summary: '夜明けを運ぶ列車を見送り、旅を終えた。',
  updatedLabel: '2026/07/20 22:10',
};

const openSession = fn();
const findScenario = fn();

const meta = {
  title: 'ユーザーストーリー/Session list',
  component: SessionListPresentation,
  args: {
    account: { name: 'ミリア', email: 'reader@myriale.example', initials: 'ミリ', role: 'Reader' },
    state: { status: 'ready', sessions: [activeSession] },
    showCompleted: false,
    onShowCompletedChange: fn(),
    onOpenSession: openSession,
    onFindScenario: findScenario,
    onRetry: fn(),
    onLogout: fn(),
  },
} satisfies Meta<typeof SessionListPresentation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const 進行中の物語を開く: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('星喰いの地下図書館')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'この物語に戻る' }));
    await expect(openSession).toHaveBeenCalledWith('SES-LIVE-1098');
  },
};

function CompletedToggleStory({ onlyCompleted = false }: { onlyCompleted?: boolean }) {
  const [showCompleted, setShowCompleted] = useState(false);
  const state: SessionListState = {
    status: 'ready',
    sessions: showCompleted
      ? onlyCompleted ? [completedSession] : [activeSession, completedSession]
      : onlyCompleted ? [] : [activeSession],
  };
  return <SessionListPresentation
    account={{ name: 'ミリア', email: 'reader@myriale.example', initials: 'ミリ', role: 'Reader' }}
    state={state}
    showCompleted={showCompleted}
    onShowCompletedChange={setShowCompleted}
    onOpenSession={openSession}
    onFindScenario={findScenario}
    onRetry={fn()}
    onLogout={fn()}
  />;
}

export const 完了済みの物語を表示する: Story = {
  render: () => <CompletedToggleStory />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText('灰の駅と宛名のない切符')).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: '完了済みも表示' }));
    await expect(canvas.getByRole('region', { name: '完了済みのセッション' })).toBeVisible();
    await expect(canvas.getByText('灰の駅と宛名のない切符')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: '物語を読み返す' }));
    await expect(openSession).toHaveBeenCalledWith('SES-DONE-2042');
  },
};

export const 完了済みだけでも新規開始できる: Story = {
  render: () => <CompletedToggleStory onlyCompleted />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('進行中のセッションはありません')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: '完了済みも表示' }));
    await expect(canvas.getByText('灰の駅と宛名のない切符')).toBeVisible();
    await expect(canvas.getByText('進行中のセッションはありません')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'シナリオを探す' }));
    await expect(findScenario).toHaveBeenCalled();
  },
};

export const セッションがない: Story = {
  args: { state: { status: 'ready', sessions: [] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('進行中のセッションはありません')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'シナリオを探す' }));
    await expect(findScenario).toHaveBeenCalled();
  },
};

export const 読み込み失敗から再試行する: Story = {
  args: { state: { status: 'error', message: 'セッション一覧を読み込めませんでした。' } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'もう一度読み込む' })).toBeVisible();
  },
};
