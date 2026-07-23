import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { MyrialeApp } from '../app/MyrialeApp';
import { createDemoDb } from '../app/demoData';
import { MockSessionContainer } from './session-page/MockSessionContainer';
import { MockStartSessionContainer } from './start-session-page/MockStartSessionContainer';
import '../styles.css';

const meta = {
  title: 'アプリ/Myriale app',
  component: MyrialeApp,
  parameters: {
    notes: '統合アプリとして操作するStoryです。initialUrlで直接画面を開き、Redux風デモDBをseedします。',
  },
} satisfies Meta<typeof MyrialeApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HomeDashboard: Story = {
  name: 'トップページ: 中断セッションとおすすめシナリオ',
  args: { initialUrl: '/', initialDb: createDemoDb('resumableSession'), startSessionContainer: MockStartSessionContainer },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('トップページで今日の導線・中断Session・おすすめScenarioを確認する', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/');
      await expect(canvas.getByRole('main', { name: 'Myrialeトップページ' })).toBeVisible();
      await expect(canvas.getByRole('heading', { name: '物語の机を、今日の続きに整える。' })).toBeVisible();
      await expect(canvas.getByRole('complementary', { name: '現在の活動概要' })).toHaveTextContent('再開できるセッション');
      await expect(canvas.getByRole('region', { name: '中断しているセッション' })).toHaveTextContent('星喰いの地下図書館');
      await expect(canvas.getByRole('region', { name: 'おすすめのシナリオ' })).toHaveTextContent('灰の駅と宛名のない切符');
    });
    await step('おすすめシナリオから開始すると一覧を挟まずイントロへ遷移する', async () => {
      const recommended = within(canvas.getByTestId('home-scenario-SCN-STAR-LIBRARY'));
      await userEvent.click(recommended.getByRole('button', { name: 'このシナリオで開始' }));
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/start?scenarioId=SCN-STAR-LIBRARY');
      await expect(canvas.getByTestId('app-url')).not.toHaveTextContent('title=');
      await expect(await canvas.findByRole('region', { name: 'イントロNarrative' })).toBeVisible();
      await expect(canvas.getByTestId('selected-scenario-title')).toHaveTextContent('星喰いの地下図書館');
      await userEvent.click(canvas.getByRole('button', { name: 'Myriale ホームへ' }));
    });
    await step('主要導線から検索・新規作成・再開へ遷移できる', async () => {
      await userEvent.click(canvas.getByTestId('home-search-scenarios'));
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/scenarios');
      await userEvent.click(canvas.getByRole('button', { name: 'Myriale ホームへ' }));
      await userEvent.click(canvas.getByTestId('home-create-scenario'));
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/scenarios/new');
      await userEvent.click(canvas.getByRole('button', { name: 'Myriale ホームへ' }));
      await userEvent.click(canvas.getByRole('button', { name: '再開する' }));
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098/resume');
    });
  },
};

export const FullAppHappyPath: Story = {
  name: '統合アプリ: シナリオ選択からプレイ画面へ遷移する',
  args: { initialUrl: '/sessions/SES-PREP-1098', initialDb: createDemoDb('activeSession'), sessionContainer: MockSessionContainer },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await step('URLから現在のプレイ中セッションを直接開く', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098');
      await expect(await canvas.findByTestId('dialogue-log')).toHaveTextContent('水没した閲覧室');
    });
    await step('アプリ内ナビゲーションでプレイ画面へ移動し、統合版はイントロのみを表示する', async () => {
      await userEvent.click(canvas.getAllByRole('button', { name: 'セッション' })[0]);
      await userEvent.click(screen.getByRole('menuitem', { name: /プレイ中の対話/ }));
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098');
      await expect(await canvas.findByTestId('dialogue-log')).toHaveTextContent('水没した閲覧室');
      await expect(canvas.queryByRole('article', { name: 'Turn 02' })).not.toBeInTheDocument();
    });
  },
};

export const DirectOpenPlaySession: Story = {
  name: 'URL直開き: プレイ中セッション',
  args: { initialUrl: '/sessions/SES-PREP-1098', initialDb: createDemoDb('activeSession'), sessionContainer: MockSessionContainer },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('URLとDB seedで目的画面を再現する', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('route /sessions/SES-PREP-1098');
      await expect(canvas.queryByRole('article', { name: 'Turn 02' })).not.toBeInTheDocument();
    });
  },
};

export const NetworkBackedSessionLifecycle: Story = {
  name: 'E2E: API経由のSession作成と対話',
  args: { initialUrl: '/scenarios', initialDb: createDemoDb('activeSession') },
};

export const NetworkBackedSessionReload: Story = {
  name: 'E2E: API経由のSession再読み込み',
  args: { initialUrl: '/sessions/SES-E2E-0001', initialDb: createDemoDb('activeSession') },
};

export const DirectOpenLorebook: Story = {
  name: 'URL直開き: セッション中のLorebook管理',
  args: { initialUrl: '/sessions/SES-PREP-1098', initialDb: createDemoDb('lorebook'), sessionContainer: MockSessionContainer },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('ノート用DBをseedしてセッション画面内のLorebookを開く', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('route /sessions/SES-PREP-1098');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('notes full');
      await expect(canvas.getByTestId('session-notes-full')).toHaveTextContent('月読ミナト');
    });
  },
};

export const DirectOpenAdminUsers: Story = {
  name: 'URL直開き: ユーザー管理',
  args: { initialUrl: '/account/admin/users', initialDb: createDemoDb('adminUsers') },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('管理者向けデモDBでユーザー管理を開く', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/account/admin/users');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('route /account/admin/users');
    });
  },
};

export const RecoverableSessionDemo: Story = {
  name: 'URL直開き: 中断セッション再開',
  args: { initialUrl: '/sessions/SES-PREP-1098/resume', initialDb: createDemoDb('resumableSession') },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('中断セッションの再開画面を直接開く', async () => {
      await expect(canvas.getByTestId('app-url')).toHaveTextContent('/sessions/SES-PREP-1098/resume');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('route /sessions/SES-PREP-1098/resume');
    });
  },
};
