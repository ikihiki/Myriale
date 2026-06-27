import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { SessionNotesAutoGenerationWireframe } from '../SessionNotesAutoGenerationWireframe';
import '../styles.css';

const meta = {
  title: 'Session notes auto generation/Wireframe from user stories',
  component: SessionNotesAutoGenerationWireframe,
  parameters: {
    notes: 'docs/user-stories/session-notes-auto-generation-user-stories.md の各ユーザーストーリー（US-AN01〜AN07）を、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。',
  },
} satisfies Meta<typeof SessionNotesAutoGenerationWireframe>;

export default meta;
type Story = StoryObj<typeof meta>;

export const USAN01CreatePendingNote: Story = {
  name: 'US-AN01: 重要情報からノートを自動作成してほしい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Turn確定後に新規エンティティを検出し、Pendingノート案を生成する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Turnからノート候補を抽出' }));
      await expect(canvas.getByTestId('notes-notice')).toHaveTextContent('新規Note案をPending生成');
      await expect(canvas.getByTestId('diff-view')).toHaveTextContent('螺旋階段');
      await expect(canvas.getByTestId('diff-view')).toHaveTextContent('Turn');
    });
  },
};

export const USAN02UpdateExistingNote: Story = {
  name: 'US-AN02: 既存ノートを自動更新してほしい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('既存Noteの未記載属性を更新差分として表示する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '銀の鍵の通知を開く' }));
      await expect(canvas.getByRole('table', { name: 'ノート差分テーブル' })).toHaveTextContent('用途');
      await expect(canvas.getByTestId('diff-before')).toHaveTextContent('用途不明');
      await expect(canvas.getByTestId('diff-after')).toHaveTextContent('閉じた星座');
    });
  },
};

export const USAN03NotificationBadgeAndList: Story = {
  name: 'US-AN03: ノート更新通知を見たい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('通知バッジ件数と通知一覧から差分ビューへ移動できる', async () => {
      await expect(canvas.getByTestId('notification-badge')).toHaveTextContent('3件');
      await expect(canvas.getByLabelText('通知一覧')).toHaveTextContent('新規Note案');
      await userEvent.click(canvas.getByRole('button', { name: '地下図書館の位置の通知を開く' }));
      await expect(canvas.getByTestId('diff-view')).toHaveTextContent('Canonへの上書き候補');
    });
  },
};

export const USAN04ReviewApplyRejectSnooze: Story = {
  name: 'US-AN04: 通知から更新案をレビューして採用/却下したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('差分を確認して採用し、自動確定ではなくユーザー操作で反映する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '採用' }));
      await expect(canvas.getByTestId('notes-notice')).toHaveTextContent('差分を採用');
      await expect(canvas.getByTestId('pending-count')).toHaveTextContent('Pending 2件');
    });
  },
};

export const USAN05TuneNotificationSettings: Story = {
  name: 'US-AN05: 通知頻度や粒度を設定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('通知タイミング・対象・自動採用ポリシーを調整する', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('通知タイミング'), '章の終わり');
      await userEvent.selectOptions(canvas.getByLabelText('通知対象'), '人物のみ');
      await userEvent.selectOptions(canvas.getByLabelText('自動採用ポリシー'), 'Canonは必ず確認');
      await expect(canvas.getByLabelText('通知タイミング')).toHaveValue('章の終わり');
      await expect(canvas.getByLabelText('通知対象')).toHaveValue('人物のみ');
      await expect(canvas.getByLabelText('自動採用ポリシー')).toHaveValue('Canonは必ず確認');
    });
  },
};

export const USAN06ConflictDecision: Story = {
  name: 'US-AN06: 矛盾が出たら判断が必要と通知してほしい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Canon上書き候補を矛盾通知として開き、噂/誤認として保持する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '地下図書館の位置の通知を開く' }));
      await expect(canvas.getByTestId('diff-view')).toHaveTextContent('Canon');
      await userEvent.click(canvas.getByRole('button', { name: '噂/誤認として保持' }));
      await expect(canvas.getByTestId('notes-notice')).toHaveTextContent('噂/誤認');
    });
  },
};

export const USAN07UpdateSummaryForContext: Story = {
  name: 'US-AN07: ノート更新と同時に要約も育てたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('章要約とState要約を更新し、次ターンContext構成を確認する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '要約を更新' }));
      await expect(canvas.getByTestId('chapter-summary')).toHaveTextContent('章要約を更新');
      await expect(canvas.getByTestId('state-summary')).toHaveTextContent('Scenario Lore + Lorebook Canon');
      await expect(canvas.getByTestId('notes-notice')).toHaveTextContent('トークン削減用');
    });
  },
};
