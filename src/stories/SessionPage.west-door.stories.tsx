import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { MyrialeApp } from '../app/MyrialeApp';
import { createDemoDb } from '../app/demoData';
import { MockWestDoorSessionContainer } from './session-page/MockWestDoorSessionContainer';
import '../styles.css';

const meta = {
  title: 'デモ/Session/西の扉を開けて外へ出る',
  component: MyrialeApp,
  render: () => <MyrialeApp initialUrl="/sessions/SES-WEST-DOOR" initialDb={createDemoDb('activeSession')} sessionContainer={MockWestDoorSessionContainer} />,
  parameters: { notes: '自然言語入力から西扉を選択し、rule effectで扉を開けて現在地を屋外へ移し、確定後Narrativeを表示するデモです。' },
} satisfies Meta<typeof MyrialeApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NaturalLanguageToCommittedNarrative: Story = {
  name: '自然言語 → 西扉選択 → open + outside → Narrative',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const composer = canvas.getByLabelText('自由に行動や会話を入力');

    await step('西と東の扉がある室内で、要求文を自然言語のまま入力する', async () => {
      await expect(canvas.getByTestId('session-activity-feed')).toHaveTextContent('西の扉と東の扉');
      await userEvent.type(composer, '西の扉を開けて外に出る');
      await expect(composer).toHaveValue('西の扉を開けて外に出る');
    });

    await step('送信後、世界の読込と候補列挙を経て西扉の複合actionを選ぶ', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '行動を送る' }));
      await expect(await canvas.findByText(/世界と現在地を読み込んでいます/)).toBeVisible();
      await expect(await canvas.findByText(/利用可能なObjectアクションを列挙しています/)).toBeVisible();
      await expect(await canvas.findByText(/入力に合うObjectアクションを選んでいます/)).toBeVisible();
      await expect(canvas.getByTestId('scenario-turn-public-projection')).toHaveTextContent('西の扉 / 扉を開けて外へ出る');
    });

    await step('rule engineが扉を開き、Sessionの現在地を室内から屋外へ移す', async () => {
      await expect(await canvas.findByText(/確定済みの状態からNarrativeを生成しています/)).toBeVisible();
      await expect(canvas.getByTestId('scenario-turn-selected-state')).toHaveTextContent('open=true');
      await expect(canvas.getByTestId('scenario-turn-location-transition')).toHaveTextContent('地下研究室 → 研究施設の外');
      await expect(canvas.getByTestId('scenario-turn-public-projection')).toHaveTextContent('プレイヤーは研究施設の外へ出た');
    });

    await step('確定後状態に整合するNarrativeを表示し、次の入力を受け付ける', async () => {
      await expect(await canvas.findByText(/あなたは研究施設の外へ踏み出した/)).toBeVisible();
      await expect(composer).toBeEnabled();
      await expect(composer).toHaveValue('');
    });
  },
};

export const E2EManualFlow: Story = {
  name: 'E2E: 手動操作用',
};
