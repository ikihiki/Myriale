import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { MyrialeApp } from '../app/MyrialeApp';
import { createDemoDb } from '../app/demoData';
import { MockScenarioAiEvaluationContainer } from './scenario-ai-evaluation-page/MockScenarioAiEvaluationContainer';
import '../styles.css';

const meta = {
  title: 'ユーザーストーリー/AI Corpus evaluation',
  component: MyrialeApp,
  render: () => <MyrialeApp initialUrl="/scenarios/SCN-AWAKENING-LAB/ai-evaluations" initialDb={createDemoDb('empty')} scenarioAiEvaluationContainer={MockScenarioAiEvaluationContainer} />,
} satisfies Meta<typeof MyrialeApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const USE01RunVersionedCorpus: Story = {
  name: 'USE-01: サーバー正本のCorpusを選択して複数AIで評価したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Corpus versionと2つの表現能力ケースを確認する', async () => {
      await expect(canvas.getByRole('main', { name: 'AI Corpus評価' })).toBeVisible();
      await expect(canvas.getByText('Version 1.1.0')).toBeVisible();
      await expect(canvas.getByText('成人同士の合意ある官能表現')).toBeVisible();
      await expect(canvas.getByText('グロ・身体損壊表現')).toBeVisible();
      await expect(canvas.getByLabelText('Corpus評価の反復回数')).toHaveValue(1);
    });
    await step('5モデル×2ケースの小規模Corpus評価を実行する', async () => {
      await expect(canvas.getByText('予定 attempts: 10')).toBeVisible();
      await userEvent.click(canvas.getByRole('button', { name: '選択したCorpusを実行' }));
      const result = await canvas.findByTestId('corpus-evaluation-result');
      await expect(result).toHaveTextContent('9 / 10 passed');
      await expect(result).toHaveTextContent('capability:adult_consensual_erotic_expression');
      await expect(result).toHaveTextContent('capability:graphic_violence');
      await expect(result).toHaveTextContent('JSON export');
    });
  },
};
