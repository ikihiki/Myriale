import type { ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { MyrialeApp } from '../app/MyrialeApp';
import { createDemoDb } from '../app/demoData';
import { MockSessionContainer, type SessionErrorScenario } from './session-page/MockSessionContainer';
import '../styles.css';

const containerFor = (scenario: SessionErrorScenario): ComponentType<{ sessionId: string }> =>
  function ErrorScenarioContainer({ sessionId }) {
    return <MockSessionContainer sessionId={sessionId} scenario={scenario} />;
  };

const meta = {
  title: 'Session/Error states',
  component: MyrialeApp,
  args: { initialUrl: '/sessions/SES-PREP-1098', initialDb: createDemoDb('activeSession') },
} satisfies Meta<typeof MyrialeApp>;

export default meta;
type Story = StoryObj<typeof meta>;

const submit = async (canvas: ReturnType<typeof within>) => {
  const input = canvas.getByLabelText('自由に行動や会話を入力');
  await userEvent.type(input, '銀の鍵を扉にかざす');
  await userEvent.click(canvas.getByRole('button', { name: '行動を送る' }));
  return input;
};

export const Unauthorized401: Story = {
  args: { sessionContainer: containerFor('load-401') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('session-load-status')).toHaveAttribute('data-notice-kind', 'authentication-required');
    await expect(canvas.getByRole('alert')).toHaveTextContent('ログインの有効期限');
    await expect(canvas.getByRole('button', { name: 'ログインへ' })).toBeVisible();
  },
};

export const NotFound404: Story = {
  args: { sessionContainer: containerFor('load-404') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('session-load-status')).toHaveAttribute('data-notice-kind', 'not-found');
    await expect(canvas.getByRole('alert')).toHaveTextContent('Sessionが削除されたか');
    await expect(canvas.getByRole('button', { name: 'セッション一覧へ' })).toBeVisible();
  },
};

export const Conflict409: Story = {
  args: { sessionContainer: containerFor('submit-409') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await submit(canvas);
    const notice = canvas.getByTestId('dialogue-notice');
    await expect(notice).toHaveAttribute('data-notice-kind', 'conflict');
    await expect(notice.classList).toContain('sticky');
    await expect(notice.classList).toContain('top-[126px]');
    await expect(notice.classList).toContain('z-[60]');
    await expect(input).toHaveValue('銀の鍵を扉にかざす');
    await expect(canvas.getByRole('button', { name: '再読み込み' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: '行動を送る' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'メッセージを閉じる' }));
    await expect(canvas.queryByTestId('dialogue-notice')).not.toBeInTheDocument();
  },
};

export const RateLimited429: Story = {
  args: { sessionContainer: containerFor('submit-429') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await submit(canvas);
    await expect(canvas.getByTestId('dialogue-notice')).toHaveAttribute('data-notice-kind', 'rate-limited');
    await expect(input).toHaveValue('銀の鍵を扉にかざす');
    await expect(canvas.getByRole('button', { name: '同じ入力を再試行' })).toBeVisible();
  },
};

export const ServiceUnavailable503: Story = {
  args: { sessionContainer: containerFor('load-503') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('session-load-status')).toHaveAttribute('data-notice-kind', 'service-unavailable');
    await expect(canvas.getByTestId('session-load-status')).toHaveTextContent('Sessionサービスを利用できません');
    await expect(canvas.getByRole('button', { name: '再読み込み' })).toBeVisible();
  },
};

export const RequestTimeout: Story = {
  args: { sessionContainer: containerFor('submit-timeout') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await submit(canvas);
    await expect(canvas.getByTestId('dialogue-notice')).toHaveAttribute('data-notice-kind', 'timeout');
    await expect(canvas.getByTestId('dialogue-notice')).toHaveTextContent('時間内に返りませんでした');
    await expect(input).toHaveValue('銀の鍵を扉にかざす');
    await expect(canvas.getByRole('button', { name: '同じ入力を再試行' })).toBeVisible();
  },
};
