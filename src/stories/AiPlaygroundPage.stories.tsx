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
  name: '架空の履歴を組み立てて次のassistant応答を生成する',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('system/user/assistantのmessageを時系列で組み立てる', async () => {
      await expect(canvas.getByRole('main', { name: 'AI Conversation Playground' })).toBeVisible();
      await userEvent.click(canvas.getByRole('button', { name: '+ assistant' }));
      await userEvent.type(canvas.getByLabelText('3番目のmessage content'), '以前の案内役の返答です。');
      await userEvent.click(canvas.getByRole('button', { name: '+ user' }));
      await userEvent.type(canvas.getByLabelText('4番目のmessage content'), '星時計に触れます。');
      await expect(canvas.getByLabelText('3番目のmessage role')).toHaveValue('assistant');
    });
    await step('生成するとassistant応答が末尾へ追加されmetadataを確認できる', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '次のassistant応答を生成' }));
      await expect(await canvas.findByRole('article', { name: 'Response 1' })).toHaveTextContent('扉の向こうには');
      await expect(canvas.getByTestId('ai-playground-metadata')).toHaveTextContent('gpt-story-mini');
      await expect(canvas.getByTestId('ai-playground-metadata')).toHaveTextContent('48 in / 24 out');
      await expect(canvas.getAllByTestId('ai-playground-response-item')).toHaveLength(1);
    });
    await step('Profileを切り替えると別modelの応答とmetadataになる', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('AI Profile'), 'story-local');
      await userEvent.click(canvas.getByRole('button', { name: '次のassistant応答を生成' }));
      await expect(await canvas.findByRole('article', { name: 'Response 2' })).toHaveTextContent('古いドームの隙間');
      await expect(canvas.getByTestId('ai-playground-metadata')).toHaveTextContent('qwen-story-8b');
      await expect(canvas.getAllByTestId('ai-playground-response-item')).toHaveLength(2);
      await expect(canvas.getAllByTestId('ai-playground-response-item')[0]).toHaveTextContent('古いドームの隙間');
    });
    await step('新しいllm endpointを選択して実行できる', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('AI Profile'), 'runpod-llm');
      await userEvent.click(canvas.getByRole('button', { name: '次のassistant応答を生成' }));
      await expect(await canvas.findByRole('article', { name: 'Response 3' })).toHaveTextContent('観測窓がゆっくりと夜空へ開きます');
      await expect(canvas.getByTestId('ai-playground-metadata')).toHaveTextContent('runpod-llm');
      await expect(canvas.getByTestId('ai-playground-metadata')).toHaveTextContent('Qwen3.6-40B');
      await expect(canvas.getAllByTestId('ai-playground-response-item')).toHaveLength(3);
    });
    await step('個別の応答を削除して残りをリストで管理する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Response 2を削除' }));
      await expect(canvas.getAllByTestId('ai-playground-response-item')).toHaveLength(2);
      await expect(canvas.queryByRole('article', { name: 'Response 2' })).not.toBeInTheDocument();
      await expect(canvas.getByRole('article', { name: 'Response 3' })).toBeVisible();
    });
  },
};

export const ProviderErrorPreservesHistory: Story = {
  render: () => <MyrialeApp initialUrl="/admin/ai-playground" initialDb={createDemoDb('empty')} aiPlaygroundContainer={containerFor('provider-error-once')} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement); const before = '古い天文台の扉を開けます。中の様子を教えてください。';
    await step('Provider errorでも編集中の履歴を保持する', async () => { await userEvent.click(canvas.getByRole('button', { name: '次のassistant応答を生成' })); await expect(canvas.getByRole('alert')).toHaveTextContent('一時的に利用できません'); await expect(canvas.getByLabelText('2番目のmessage content')).toHaveValue(before); });
    await step('同じ履歴で再試行できる', async () => { await userEvent.click(canvas.getByRole('button', { name: '次のassistant応答を生成' })); await expect(await canvas.findByRole('article', { name: 'Response 1' })).toHaveTextContent('扉の向こうには'); });
  },
};

export const InvalidImportAndEmptyHistory: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('壊れたJSONを拒否して現在の履歴を残す', async () => { await userEvent.click(canvas.getByText('JSON import / export')); await userEvent.click(canvas.getByLabelText('会話履歴import JSON')); await userEvent.paste('{broken'); await userEvent.click(canvas.getByRole('button', { name: 'JSONを読み込む' })); await expect(canvas.getByRole('alert')).toHaveTextContent('変更されていません'); await expect(canvas.getByLabelText('2番目のmessage content')).toHaveValue('古い天文台の扉を開けます。中の様子を教えてください。'); });
    await step('空履歴では生成できない', async () => { await userEvent.click(canvas.getByRole('button', { name: '全消去' })); await expect(canvas.getByRole('button', { name: '次のassistant応答を生成' })).toBeDisabled(); await expect(canvas.getByText(/会話履歴は空です/)).toBeVisible(); });
  },
};

export const RevisionConflictRequestsReview: Story = {
  render: () => <MyrialeApp initialUrl="/admin/ai-playground" initialDb={createDemoDb('empty')} aiPlaygroundContainer={containerFor('revision-conflict')} />,
  play: async ({ canvasElement, step }) => { const canvas = within(canvasElement); await step('revision conflictを安全な再読込案内として表示する', async () => { await userEvent.click(canvas.getByRole('button', { name: '次のassistant応答を生成' })); await expect(canvas.getByRole('alert')).toHaveTextContent('最新情報を再読み込み'); await expect(canvas.getByLabelText('2番目のmessage content')).toHaveValue('古い天文台の扉を開けます。中の様子を教えてください。'); }); },
};
