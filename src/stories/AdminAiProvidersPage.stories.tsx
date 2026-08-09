import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { AdminAiProvidersPage } from '../features/admin/AdminAiProvidersPage';
import '../styles.css';

const meta = {
  title: '運用/AI Provider administration',
  component: AdminAiProvidersPage,
  parameters: { notes: 'Profile定義とCredential secretを分離し、revision付きの破壊的操作とprofile-scoped testを確認するStoryです。' },
} satisfies Meta<typeof AdminAiProvidersPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SplitProfileAndCredentialManagement: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('ProfileとCredentialが独立した一覧として表示される', async () => {
      await expect(await canvas.findByTestId('ai-profile-row-openai')).toBeVisible();
      await expect(await canvas.findByTestId('ai-credential-row-runpod')).toBeVisible();
      await expect(canvas.getByTestId('ai-profile-row-runpod')).toHaveTextContent('r1');
    });
    await step('AIごとの追加システムプロンプトを編集して保存する', async () => {
      const profile = within(canvas.getByTestId('ai-profile-row-runpod'));
      await userEvent.click(profile.getByRole('button', { name: '編集' }));
      const systemPrompt = canvas.getByLabelText('Profile追加システムプロンプト');
      await userEvent.clear(systemPrompt);
      await userEvent.type(systemPrompt, '直前の行動から自然につなぎ、情景と仕草を小説風に描く。');
      await userEvent.click(canvas.getByRole('button', { name: 'Profileを保存' }));
      await expect(await canvas.findByTestId('ai-profile-row-runpod')).toHaveTextContent('r2');
    });
    await step('Credentialを置換するとrevisionを保持して更新する', async () => {
      const credential = within(canvas.getByTestId('ai-credential-row-runpod'));
      await userEvent.click(credential.getByRole('button', { name: '置換' }));
      await userEvent.type(canvas.getByLabelText('Credential Secret'), 'replacement-secret');
      await userEvent.click(canvas.getByRole('button', { name: 'Credentialを保存' }));
      await expect(await canvas.findByTestId('ai-credential-row-runpod')).toHaveTextContent('r2');
    });
    await step('Profile-scoped connection testを実行する', async () => {
      const profile = within(canvas.getByTestId('ai-profile-row-runpod'));
      await userEvent.click(profile.getByRole('button', { name: '接続テスト' }));
      await expect(canvas.getByTestId('ai-admin-notice')).toHaveTextContent('接続テストを完了しました');
    });
  },
};
