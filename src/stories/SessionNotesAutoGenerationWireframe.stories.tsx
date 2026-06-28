import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { MyrialeApp } from '../app/MyrialeApp';
import { createDemoDb } from '../app/demoData';
import '../styles.css';

const meta = {
  title: 'Session notes auto generation/Wireframe from user stories',
  component: MyrialeApp,
  render: () => <MyrialeApp initialUrl="/sessions/SES-PREP-1098/play" initialDb={createDemoDb('notesReview')} />,
  parameters: {
    notes: 'ノート系ユーザーストーリーは独立画面ではなく、セッション中のサイド/全画面ノートワークスペースとして表示します。',
  },
} satisfies Meta<typeof MyrialeApp>;

export default meta;
type Story = StoryObj<typeof meta>;

const notes = (canvas: ReturnType<typeof within>) => within(canvas.getByTestId('session-notes-full'));

export const USAN01CreatePendingNote: Story = {
  name: 'US-AN01: 重要情報からノートを自動作成してほしい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('セッション画面内の全画面ノートで新規ノートを作成し、編集ダイアログを開く', async () => {
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('route playSession');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('notes full');
      await userEvent.click(notes(canvas).getByRole('button', { name: '場所追加' }));
      await expect(canvas.getByRole('dialog', { name: 'ノート編集' })).toHaveTextContent('地下天文台');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('open location-4');
    });
  },
};

export const USAN02UpdateExistingNote: Story = {
  name: 'US-AN02: 既存ノートをセッション中に更新したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('既存ノートをダイアログで開き、項目を編集する', async () => {
      await userEvent.click(notes(canvas).getByRole('button', { name: '月読ミナトを編集' }));
      await userEvent.clear(canvas.getByLabelText('別名'));
      await userEvent.type(canvas.getByLabelText('別名'), '水際の案内人');
      await expect(canvas.getByRole('dialog', { name: 'ノート編集' })).toHaveTextContent('月読ミナト');
      await expect(canvas.getByTestId('session-notes-notice')).toHaveTextContent('編集中');
    });
  },
};

export const USAN03NotificationBadgeAndList: Story = {
  name: 'US-AN03: セッション中にノート一覧をすぐ見たい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('プレイ画面のノート全画面に一覧・検索・Contextが同時に表示される', async () => {
      await expect(notes(canvas).getByLabelText('ノート一覧')).toHaveTextContent('月読ミナト');
      await expect(notes(canvas).getByLabelText('ノートContext')).toHaveTextContent('Canon Notes');
      await expect(notes(canvas).getByTestId('canon-count')).toHaveTextContent('2件');
    });
  },
};

export const USAN04ReviewApplyRejectSnooze: Story = {
  name: 'US-AN04: ノート更新判断をセッション中に行いたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('整合性判断を同じノートワークスペースで行う', async () => {
      await userEvent.click(notes(canvas).getByRole('button', { name: '整合性チェック' }));
      await expect(notes(canvas).getByTestId('consistency-issue')).toHaveTextContent('矛盾候補');
      await userEvent.click(notes(canvas).getByRole('button', { name: '噂として保持' }));
      await expect(canvas.getByTestId('session-notes-notice')).toHaveTextContent('噂として保持');
    });
  },
};

export const USAN05TuneNotificationSettings: Story = {
  name: 'US-AN05: ノート確認の表示方法を切り替えたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('DBのUI状態で全画面からサイド表示へ戻せる', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'サイド表示に戻す' }));
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('notes side');
      await expect(canvas.getByTestId('session-notes-side')).toHaveTextContent('月読ミナト');
    });
  },
};

export const USAN06ConflictDecision: Story = {
  name: 'US-AN06: 矛盾が出たら判断が必要と通知してほしい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('整合性チェックで矛盾候補を出し、Canon変更はユーザー操作に委ねる', async () => {
      await userEvent.click(notes(canvas).getByRole('button', { name: '整合性チェック' }));
      await expect(notes(canvas).getByTestId('consistency-issue')).toHaveTextContent('王都地下');
      await userEvent.click(notes(canvas).getByRole('button', { name: 'AI出力を修正' }));
      await expect(canvas.getByTestId('session-notes-notice')).toHaveTextContent('Canonは変更しません');
    });
  },
};

export const USAN07UpdateSummaryForContext: Story = {
  name: 'US-AN07: ノート更新と同時に要約も育てたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('次ターンContextをノートから再構築する', async () => {
      await userEvent.click(notes(canvas).getByRole('button', { name: 'Context再構築' }));
      await expect(notes(canvas).getByTestId('context-stack')).toHaveTextContent('次ターンContext');
      await expect(canvas.getByTestId('session-notes-notice')).toHaveTextContent('再構築');
    });
  },
};
