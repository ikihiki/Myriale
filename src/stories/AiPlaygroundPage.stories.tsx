import type { ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { MyrialeApp } from '../app/MyrialeApp';
import { createDemoDb } from '../app/demoData';
import {
  MockAiPlaygroundContainer,
  type AiPlaygroundStoryScenario,
} from './ai-playground-page/MockAiPlaygroundContainer';
import '../styles.css';

const containerFor =
  (scenario: AiPlaygroundStoryScenario): ComponentType =>
    () => <MockAiPlaygroundContainer scenario={scenario} />;
const meta = {
  title: 'ユーザーストーリー/AI Conversation Playground',
  component: MyrialeApp,
  render: () => (
    <MyrialeApp
      initialUrl="/admin/ai-playground"
      initialDb={createDemoDb('empty')}
      aiPlaygroundContainer={containerFor('success')}
    />
  ),
} satisfies Meta<typeof MyrialeApp>;
export default meta;
type Story = StoryObj<typeof meta>;

async function renameActiveConversation(
  canvas: ReturnType<typeof within>,
  title: string,
) {
  const input = canvas.getByLabelText('選択中の会話名');
  await userEvent.clear(input);
  await userEvent.type(input, title);
}

export const ManageIndependentConversations: Story = {
  name: '複数の会話コンテキストと応答を独立して管理する',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step(
      '最初の会話を命名し、OpenAI Profileで応答を生成する',
      async () => {
        await expect(
          canvas.getByRole('main', { name: 'AI Conversation Playground' }),
        ).toBeVisible();
        await renameActiveConversation(canvas, '天文台');
        await waitFor(() =>
          expect(
            canvas.getByTestId('ai-playground-save-status'),
          ).toHaveTextContent('DBへ保存済み'),
        );
        await userEvent.click(
          canvas.getByRole('button', { name: '次のassistant応答を生成' }),
        );
        await expect(
          canvas.getByTestId('ai-playground-response-count'),
        ).toHaveTextContent('1件の応答');
        await expect(
          canvas.getByTestId('ai-playground-response-detail'),
        ).toHaveTextContent('扉の向こうには');
      },
    );
    await step(
      '2つ目の会話を作り、別Profileから異なる応答セットを生成する',
      async () => {
        await userEvent.click(
          canvas.getByRole('button', { name: '新しい会話' }),
        );
        await renameActiveConversation(canvas, '月面基地');
        await userEvent.selectOptions(
          canvas.getByLabelText('AI Profile'),
          'story-local',
        );
        await userEvent.click(
          canvas.getByRole('button', { name: '次のassistant応答を生成' }),
        );
        await userEvent.selectOptions(
          canvas.getByLabelText('AI Profile'),
          'runpod-llm',
        );
        await userEvent.click(
          canvas.getByRole('button', { name: '次のassistant応答を生成' }),
        );
        await expect(
          canvas.getByTestId('ai-playground-response-count'),
        ).toHaveTextContent('2件の応答');
        await expect(
          canvas.getByTestId('ai-playground-response-detail'),
        ).toHaveTextContent('星時計の針');
      },
    );
    await step(
      '切り替えると最初の会話のProfile・応答・選択が復元される',
      async () => {
        await userEvent.click(
          canvas.getByRole('button', { name: '天文台を選択' }),
        );
        await expect(canvas.getByLabelText('AI Profile')).toHaveValue(
          'story-openai',
        );
        await expect(
          canvas.getByTestId('ai-playground-response-count'),
        ).toHaveTextContent('1件の応答');
        await expect(
          canvas.getByTestId('ai-playground-response-detail'),
        ).toHaveTextContent('扉の向こうには');
      },
    );
    await step('選択した応答だけを現在の会話へ追加する', async () => {
      await userEvent.click(
        canvas.getByRole('button', { name: '選択した応答を会話へ追加' }),
      );
      await expect(canvas.getByLabelText('3番目のmessage content')).toHaveValue(
        '扉の向こうには、止まった星時計と青い観測記録が静かに並んでいます。',
      );
      await userEvent.click(
        canvas.getByRole('button', { name: '月面基地を選択' }),
      );
      await expect(
        canvas.queryByLabelText('3番目のmessage content'),
      ).not.toBeInTheDocument();
      await expect(
        canvas.getByTestId('ai-playground-response-count'),
      ).toHaveTextContent('2件の応答');
    });
    await step('複製後の応答削除は元の会話へ影響しない', async () => {
      await userEvent.click(
        canvas.getByRole('button', { name: '天文台を選択' }),
      );
      await userEvent.click(
        canvas.getByRole('button', { name: '現在の会話を複製' }),
      );
      await expect(canvas.getByLabelText('選択中の会話名')).toHaveValue(
        '天文台 copy',
      );
      await expect(
        canvas.getByTestId('ai-playground-response-count'),
      ).toHaveTextContent('1件の応答');
      await userEvent.click(
        canvas.getByRole('button', { name: '応答 1を削除' }),
      );
      await expect(
        canvas.getByTestId('ai-playground-response-count'),
      ).toHaveTextContent('0件の応答');
      await userEvent.click(
        canvas.getByRole('button', { name: '天文台を選択' }),
      );
      await expect(
        canvas.getByTestId('ai-playground-response-count'),
      ).toHaveTextContent('1件の応答');
      await expect(
        canvas.getByLabelText('3番目のmessage content'),
      ).toBeVisible();
    });
    await step(
      '現在の会話を削除すると隣の会話へ安全にフォールバックする',
      async () => {
        await userEvent.click(
          canvas.getByRole('button', { name: '天文台を削除' }),
        );
        await expect(canvas.getByLabelText('選択中の会話名')).toHaveValue(
          '月面基地',
        );
        await expect(
          canvas.getByTestId('ai-playground-response-count'),
        ).toHaveTextContent('2件の応答');
      },
    );
  },
};

export const ResponseSelectionAndClearing: Story = {
  name: '会話内で応答の選択・個別削除・全消去を管理する',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('3つのProfileから応答候補を生成する', async () => {
      await userEvent.click(
        canvas.getByRole('button', { name: '次のassistant応答を生成' }),
      );
      await userEvent.selectOptions(
        canvas.getByLabelText('AI Profile'),
        'story-local',
      );
      await userEvent.click(
        canvas.getByRole('button', { name: '次のassistant応答を生成' }),
      );
      await userEvent.selectOptions(
        canvas.getByLabelText('AI Profile'),
        'runpod-llm',
      );
      await userEvent.click(
        canvas.getByRole('button', { name: '次のassistant応答を生成' }),
      );
      await expect(
        canvas.getByTestId('ai-playground-response-count'),
      ).toHaveTextContent('3件の応答');
    });
    await step('古い応答を選ぶと本文とmetadataが切り替わる', async () => {
      await userEvent.click(
        canvas.getByRole('button', { name: '応答 1を選択' }),
      );
      await expect(
        canvas.getByTestId('ai-playground-response-detail'),
      ).toHaveTextContent('扉の向こうには');
      await expect(
        canvas.getByTestId('ai-playground-response-detail'),
      ).toHaveTextContent('gpt-story-mini');
    });
    await step('個別削除と全消去は現在の会話だけに適用される', async () => {
      await userEvent.click(
        canvas.getByRole('button', { name: '応答 2を削除' }),
      );
      await expect(
        canvas.getByTestId('ai-playground-response-count'),
      ).toHaveTextContent('2件の応答');
      await userEvent.click(
        canvas.getByRole('button', { name: '応答をすべて消去' }),
      );
      await expect(
        canvas.getByTestId('ai-playground-response-count'),
      ).toHaveTextContent('0件の応答');
      await expect(
        canvas.getByLabelText('2番目のmessage content'),
      ).toBeVisible();
    });
  },
};

export const ProviderErrorPreservesAllConversations: Story = {
  render: () => (
    <MyrialeApp
      initialUrl="/admin/ai-playground"
      initialDb={createDemoDb('empty')}
      aiPlaygroundContainer={containerFor('provider-error-once')}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('最初の会話に成功した応答を保持する', async () => {
      await renameActiveConversation(canvas, '成功済み');
      await userEvent.click(
        canvas.getByRole('button', { name: '次のassistant応答を生成' }),
      );
      await expect(
        canvas.getByTestId('ai-playground-response-count'),
      ).toHaveTextContent('1件の応答');
    });
    await step('別会話のProvider errorでも両方の会話が残る', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '新しい会話' }));
      await renameActiveConversation(canvas, '再試行対象');
      await userEvent.selectOptions(
        canvas.getByLabelText('AI Profile'),
        'story-local',
      );
      await userEvent.click(
        canvas.getByRole('button', { name: '次のassistant応答を生成' }),
      );
      await expect(canvas.getByRole('alert')).toHaveTextContent('すべての会話');
      await expect(
        canvas.getByTestId('ai-playground-response-count'),
      ).toHaveTextContent('0件の応答');
      await expect(canvas.getByLabelText('2番目のmessage content')).toHaveValue(
        '古い天文台の扉を開けます。中の様子を教えてください。',
      );
      await userEvent.click(
        canvas.getByRole('button', { name: '成功済みを選択' }),
      );
      await expect(
        canvas.getByTestId('ai-playground-response-count'),
      ).toHaveTextContent('1件の応答');
      await expect(
        canvas.getByTestId('ai-playground-response-detail'),
      ).toHaveTextContent('扉の向こうには');
    });
    await step('失敗した会話へ戻って再試行できる', async () => {
      await userEvent.click(
        canvas.getByRole('button', { name: '再試行対象を選択' }),
      );
      await expect(canvas.getByLabelText('AI Profile')).toHaveValue(
        'story-local',
      );
      await userEvent.click(
        canvas.getByRole('button', { name: '次のassistant応答を生成' }),
      );
      await expect(
        canvas.getByTestId('ai-playground-response-count'),
      ).toHaveTextContent('1件の応答');
      await expect(
        canvas.getByTestId('ai-playground-response-detail'),
      ).toHaveTextContent('古いドーム');
    });
  },
};

export const InvalidImportAndEmptyHistory: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('壊れたJSONを拒否して現在の履歴を残す', async () => {
      await userEvent.click(canvas.getByText('JSON import / export'));
      await userEvent.click(canvas.getByLabelText('会話履歴import JSON'));
      await userEvent.paste('{broken');
      await userEvent.click(
        canvas.getByRole('button', { name: 'JSONを読み込む' }),
      );
      await expect(canvas.getByRole('alert')).toHaveTextContent(
        '変更されていません',
      );
      await expect(canvas.getByLabelText('2番目のmessage content')).toHaveValue(
        '古い天文台の扉を開けます。中の様子を教えてください。',
      );
    });
    await step('空履歴では生成できない', async () => {
      await userEvent.click(
        canvas.getByRole('button', { name: '会話を全消去' }),
      );
      await expect(
        canvas.getByRole('button', { name: '次のassistant応答を生成' }),
      ).toBeDisabled();
      await expect(canvas.getByText(/会話履歴は空です/)).toBeVisible();
    });
  },
};

export const RevisionConflictRequestsReview: Story = {
  render: () => (
    <MyrialeApp
      initialUrl="/admin/ai-playground"
      initialDb={createDemoDb('empty')}
      aiPlaygroundContainer={containerFor('revision-conflict')}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step(
      'revision conflictを安全な再読込案内として表示する',
      async () => {
        await userEvent.click(
          canvas.getByRole('button', { name: '次のassistant応答を生成' }),
        );
        await expect(canvas.getByRole('alert')).toHaveTextContent(
          '最新情報を再読み込み',
        );
        await expect(
          canvas.getByLabelText('2番目のmessage content'),
        ).toHaveValue('古い天文台の扉を開けます。中の様子を教えてください。');
      },
    );
  },
};
