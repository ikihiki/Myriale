import type { ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { MyrialeApp } from '../app/MyrialeApp';
import { createDemoDb } from '../app/demoData';
import { MockAiPlaygroundContainer, type AiPlaygroundStoryScenario } from './ai-playground-page/MockAiPlaygroundContainer';
import '../styles.css';

const containerFor = (scenario: AiPlaygroundStoryScenario): ComponentType => () => <MockAiPlaygroundContainer scenario={scenario} />;
const meta = { title: 'ユーザーストーリー/AI Conversation Playground', component: MyrialeApp, render: () => <MyrialeApp initialUrl="/admin/ai-playground" initialDb={createDemoDb('empty')} aiPlaygroundContainer={containerFor('success')} /> } satisfies Meta<typeof MyrialeApp>;
export default meta;
type Story = StoryObj<typeof meta>;

export const BuildAndGenerateConversation: Story = {
  name: '同じ会話から複数の応答候補を比較して管理する',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('3つのProfileから生成して3件の独立した応答を保持する', async () => {
      await expect(canvas.getByRole('main', { name: 'AI Conversation Playground' })).toBeVisible();
      await userEvent.click(canvas.getByRole('button', { name: '次のassistant応答を生成' }));
      await userEvent.selectOptions(canvas.getByLabelText('AI Profile'), 'story-local');
      await userEvent.click(canvas.getByRole('button', { name: '次のassistant応答を生成' }));
      await userEvent.selectOptions(canvas.getByLabelText('AI Profile'), 'runpod-llm');
      await userEvent.click(canvas.getByRole('button', { name: '次のassistant応答を生成' }));
      await expect(canvas.getByTestId('ai-playground-response-count')).toHaveTextContent('3件の応答');
      await expect(canvas.getByRole('button', { name: '応答 1を選択' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: '応答 2を選択' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: '応答 3を選択' })).toHaveAttribute('aria-pressed', 'true');
      await expect(canvas.queryByLabelText('3番目のmessage content')).not.toBeInTheDocument();
      await userEvent.click(canvas.getByRole('button', { name: '会話を全消去' }));
      await expect(canvas.getByTestId('ai-playground-response-count')).toHaveTextContent('3件の応答');
      await userEvent.click(canvas.getByRole('button', { name: 'サンプル初期化' }));
      await expect(canvas.getByTestId('ai-playground-response-count')).toHaveTextContent('3件の応答');
    });
    await step('古い応答を選ぶと本文とmetadataが切り替わる', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '応答 1を選択' }));
      await expect(canvas.getByTestId('ai-playground-response-detail')).toHaveTextContent('扉の向こうには');
      await expect(canvas.getByTestId('ai-playground-response-detail')).toHaveTextContent('gpt-story-mini');
      await expect(canvas.getByTestId('ai-playground-response-detail')).toHaveTextContent('48 in / 24 out');
    });
    await step('選択した応答だけを会話履歴へ明示的に追加する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '選択した応答を会話へ追加' }));
      await expect(canvas.getByLabelText('3番目のmessage content')).toHaveValue('扉の向こうには、止まった星時計と青い観測記録が静かに並んでいます。');
      await expect(canvas.getByTestId('ai-playground-response-count')).toHaveTextContent('3件の応答');
    });
    await step('1件を削除してから全応答を明示的に消去する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '応答 2を削除' }));
      await expect(canvas.getByTestId('ai-playground-response-count')).toHaveTextContent('2件の応答');
      await expect(canvas.queryByRole('button', { name: '応答 2を選択' })).not.toBeInTheDocument();
      await userEvent.click(canvas.getByRole('button', { name: '応答をすべて消去' }));
      await expect(canvas.getByTestId('ai-playground-response-count')).toHaveTextContent('0件の応答');
      await expect(canvas.getByLabelText('3番目のmessage content')).toBeVisible();
    });
  },
};

export const ProviderErrorPreservesHistory: Story = {
  render: () => <MyrialeApp initialUrl="/admin/ai-playground" initialDb={createDemoDb('empty')} aiPlaygroundContainer={containerFor('provider-error-once')} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement); const before = '古い天文台の扉を開けます。中の様子を教えてください。';
    await step('先に成功した応答を保持する', async () => { await userEvent.click(canvas.getByRole('button', { name: '次のassistant応答を生成' })); await expect(canvas.getByTestId('ai-playground-response-count')).toHaveTextContent('1件の応答'); });
    await step('後続のProvider errorでも会話と成功済み応答を保持する', async () => { await userEvent.click(canvas.getByRole('button', { name: '次のassistant応答を生成' })); await expect(canvas.getByRole('alert')).toHaveTextContent('一時的に利用できません'); await expect(canvas.getByLabelText('2番目のmessage content')).toHaveValue(before); await expect(canvas.getByTestId('ai-playground-response-count')).toHaveTextContent('1件の応答'); await expect(canvas.getByTestId('ai-playground-response-detail')).toHaveTextContent('扉の向こうには'); });
    await step('同じ履歴で再試行すると新しい応答だけを追加する', async () => { await userEvent.click(canvas.getByRole('button', { name: '次のassistant応答を生成' })); await expect(canvas.getByTestId('ai-playground-response-count')).toHaveTextContent('2件の応答'); });
  },
};

export const InvalidImportAndEmptyHistory: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('壊れたJSONを拒否して現在の履歴を残す', async () => { await userEvent.click(canvas.getByText('JSON import / export')); await userEvent.click(canvas.getByLabelText('会話履歴import JSON')); await userEvent.paste('{broken'); await userEvent.click(canvas.getByRole('button', { name: 'JSONを読み込む' })); await expect(canvas.getByRole('alert')).toHaveTextContent('変更されていません'); await expect(canvas.getByLabelText('2番目のmessage content')).toHaveValue('古い天文台の扉を開けます。中の様子を教えてください。'); });
    await step('空履歴では生成できない', async () => { await userEvent.click(canvas.getByRole('button', { name: '会話を全消去' })); await expect(canvas.getByRole('button', { name: '次のassistant応答を生成' })).toBeDisabled(); await expect(canvas.getByText(/会話履歴は空です/)).toBeVisible(); });
  },
};

export const RevisionConflictRequestsReview: Story = {
  render: () => <MyrialeApp initialUrl="/admin/ai-playground" initialDb={createDemoDb('empty')} aiPlaygroundContainer={containerFor('revision-conflict')} />,
  play: async ({ canvasElement, step }) => { const canvas = within(canvasElement); await step('revision conflictを安全な再読込案内として表示する', async () => { await userEvent.click(canvas.getByRole('button', { name: '次のassistant応答を生成' })); await expect(canvas.getByRole('alert')).toHaveTextContent('最新情報を再読み込み'); await expect(canvas.getByLabelText('2番目のmessage content')).toHaveValue('古い天文台の扉を開けます。中の様子を教えてください。'); }); },
};
