import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { MyrialeApp } from '../app/MyrialeApp';
import { createDemoDb } from '../app/demoData';
import { MockScenarioListContainer } from './start-session-page/MockScenarioListContainer';
import { MockStartSessionContainer } from './start-session-page/MockStartSessionContainer';
import '../styles.css';

const meta = {
  title: 'ユーザーストーリー/Start session',
  component: MyrialeApp,
  render: () => <MyrialeApp initialUrl="/scenarios" initialDb={createDemoDb('activeSession')} scenarioListContainer={MockScenarioListContainer} startSessionContainer={MockStartSessionContainer} />,
  parameters: {
    notes: 'docs/user-stories/start-session.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。',
  },
} satisfies Meta<typeof MyrialeApp>;

export default meta;
type Story = StoryObj<typeof meta>;

const startPreparing = async (
  canvas: ReturnType<typeof within>,
  scenarioTitle = '星喰いの地下図書館',
) => {
  await userEvent.click(canvas.getByRole('button', { name: `${scenarioTitle}で開始` }));
  await canvas.findByTestId('selected-scenario-title');
};

export const USS01StartNewSessionFromScenario: Story = {
  name: 'US-S01: シナリオから新しいセッションを開始したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('シナリオ一覧から対象Scenarioを確認し、登録導線も見える', async () => {
      await expect(canvas.getByRole('region', { name: 'シナリオ一覧' })).toBeVisible();
      await expect(canvas.getByTestId('scenario-list')).toHaveTextContent('星喰いの地下図書館');
      await expect(canvas.getByRole('button', { name: '新しいシナリオを登録' })).toBeVisible();
      await expect(canvas.getAllByRole('button', { name: '編集' }).length).toBeGreaterThan(0);
      await expect(canvas.getByRole('navigation', { name: '主要セクション' }).querySelector('[aria-current="page"]')).toHaveTextContent('ライブラリ');
      await expect(canvas.queryByRole('complementary', { name: 'シナリオ登録導線' })).not.toBeInTheDocument();
    });
    await step('Scenarioを選択すると、余分な状態表示を挟まずイントロと主人公選択を表示する', async () => {
      await startPreparing(canvas);
      await expect(canvas.getByTestId('selected-scenario-title')).toHaveTextContent('星喰いの地下図書館');
      await expect(canvas.getByRole('region', { name: 'イントロNarrative' })).toBeVisible();
      await expect(canvas.getByRole('region', { name: '主人公確定' })).toBeVisible();
      await expect(canvas.queryByTestId('session-notice')).not.toBeInTheDocument();
      await expect(canvas.queryByRole('complementary', { name: 'セッション状態サマリー' })).not.toBeInTheDocument();
    });
  },
};

export const USS02ReadIntroBeforeHero: Story = {
  name: 'US-S02: セッション開始時にシナリオのイントロを見たい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await startPreparing(canvas);
    await step('Preparing状態で、主人公未確定のイントロNarrativeを読む', async () => {
      await expect(canvas.getByRole('region', { name: 'イントロNarrative' })).toBeVisible();
      await expect(canvas.getByTestId('intro-narrative')).toHaveTextContent('あなたは水没した閲覧室で目を覚ます。');
      await expect(canvas.getByTestId('intro-narrative')).not.toHaveTextContent('名もなき旅人');
    });
    await step('同じページで主人公選択ができる', async () => {
      await expect(canvas.getByRole('region', { name: '主人公確定' })).toBeVisible();
    });
  },
};

export const USS03ConfirmHeroAfterIntro: Story = {
  name: 'US-S03: イントロ後に主人公を確定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await startPreparing(canvas);
    await step('イントロと同じページで候補を選び、Session固有データとして確定する', async () => {
      await userEvent.click(canvas.getByRole('combobox', { name: '候補キャラクター' }));
      await expect(screen.queryByRole('option', { name: '自由生成' })).not.toBeInTheDocument();
      await userEvent.click(await screen.findByRole('option', { name: 'エル / 記憶を失った写字生' }));
      await expect(canvas.getByLabelText('主人公の名前')).toHaveValue('エル');
      await expect(canvas.getByLabelText('主人公の名前')).toHaveAttribute('readonly');
      await expect(canvas.getByLabelText('主人公プロフィール')).toHaveValue('記憶を失った写字生');
      await expect(canvas.getByLabelText('主人公プロフィール')).toHaveAttribute('readonly');
      await userEvent.click(canvas.getByRole('button', { name: '開始内容を確認' }));
      await waitFor(() => expect(canvas.getByRole('dialog', { name: '開始前の最終確認' })).toBeVisible());
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('エル / 記憶を失った写字生');
    });
  },
};

export const USS03CreateHeroWithAiAssistance: Story = {
  name: 'US-S03C/D: 主人公を作成し、AI案は確認してから確定する',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas, '灰の駅と宛名のない切符');
    await step('自由生成が許可されたシナリオでは、名前とプロフィールを最初から編集できる', async () => {
      await expect(canvas.queryByRole('combobox', { name: '主人公の扱い' })).not.toBeInTheDocument();
      await userEvent.clear(canvas.getByLabelText('主人公の名前'));
      await userEvent.type(canvas.getByLabelText('主人公の名前'), 'ユイ');
      await expect(canvas.getByLabelText('主人公の名前')).toHaveValue('ユイ');
    });
    await step('AI生成ボタンはフォームを補助するだけで、自動確定しない', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'AIに主人公を生成してもらう' }));
      await expect(canvas.getByLabelText('主人公の名前')).toHaveValue('ノクト');
      await expect(canvas.getByRole('status')).toHaveTextContent('確認・修正してから確定');
      await expect(canvas.getByRole('button', { name: '開始内容を確認' })).toBeVisible();
    });
  },
};

export const USS03SelectHeroWithOptionalFreeGeneration: Story = {
  name: 'US-S03B: 選択式で許可された場合だけ自由生成へ切り替える',
  render: () => <MyrialeApp initialUrl="/scenarios" initialDb={createDemoDb('activeSession')} scenarioListContainer={MockScenarioListContainer} startSessionContainer={MockStartSessionContainer} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas, '月虹の庭と眠らない時計');
    await step('候補キャラクターの選択肢から、許可された自由生成へ切り替えられる', async () => {
      const screen = within(canvasElement.ownerDocument.body);
      const protagonistSelect = canvas.getByRole('combobox', { name: '候補キャラクター' });
      await userEvent.click(protagonistSelect);
      await userEvent.click(await screen.findByRole('option', { name: '自由生成' }));
      await expect(protagonistSelect).toHaveTextContent('自由生成');
      await waitFor(() => expect(canvas.getByLabelText('主人公の名前')).toBeVisible());

      await userEvent.click(protagonistSelect);
      await userEvent.click(await screen.findByRole('option', { name: 'カイ / 時計塔を修理する旅の技師' }));
      await expect(canvas.getByLabelText('主人公の名前')).toHaveValue('カイ');
      await expect(canvas.getByLabelText('主人公の名前')).toHaveAttribute('readonly');
    });
  },
};

export const USS03FixedHeroIsReadOnly: Story = {
  name: 'US-S03A: 固定主人公は読み取り専用で表示する',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas, '硝子の森と夜明けの司書');
    await step('固定主人公だけを表示し、選択や自由生成を許可しない', async () => {
      await expect(canvas.getByTestId('fixed-hero')).toBeVisible();
      await expect(canvas.getByLabelText('主人公の名前')).toHaveValue('リュシエン');
      await expect(canvas.getByLabelText('主人公の名前')).toHaveAttribute('readonly');
      await expect(canvas.getByLabelText('主人公プロフィール')).toHaveValue('夜明け前の森を巡る司書');
      await expect(canvas.getByLabelText('主人公プロフィール')).toHaveAttribute('readonly');
      await expect(canvas.queryByRole('combobox', { name: '候補キャラクター' })).not.toBeInTheDocument();
    });
  },
};

export const USS04ReviewBeforeStarting: Story = {
  name: 'US-S04: セッション開始前に内容を最終確認したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await step('権限があるPlayerだけがデバッグ用の解釈説明を選択できる', async () => {
      const interpretation = canvas.getByRole('checkbox', { name: /解釈説明を有効にする/ });
      await expect(interpretation).not.toBeChecked();
      await userEvent.click(interpretation);
      await expect(interpretation).toBeChecked();
    });
    await userEvent.click(canvas.getByRole('button', { name: '開始内容を確認' }));
    await step('ダイアログの開始サマリーでScenario概要、主人公、デバッグ設定を確認する', async () => {
      await waitFor(() => expect(canvas.getByRole('dialog', { name: '開始前の最終確認' })).toBeVisible());
      await expect(canvas.getByTestId('start-review-dialog')).toHaveAttribute('data-size', 'wide');
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('Scenario: 星喰いの地下図書館');
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('解釈説明: 有効（デバッグ）');
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('主人公: ミラ');
    });
    await step('修正を選ぶとダイアログを閉じて主人公選択へ戻れる', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '主人公選択を修正' }));
      await expect(canvas.queryByRole('dialog', { name: '開始前の最終確認' })).not.toBeInTheDocument();
      await expect(canvas.getByRole('region', { name: '主人公確定' })).toBeVisible();
      await expect(canvas.getByRole('region', { name: 'イントロNarrative' })).toBeVisible();
    });
  },
};

export const USS05BeginActiveSession: Story = {
  name: 'US-S05: セッションを正式に開始したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await userEvent.click(canvas.getByRole('button', { name: '開始内容を確認' }));
    await step('API未設定では架空のSessionへfallbackせず、明示的なエラーを表示する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '物語を始める' }));
      await expect(canvas.getByRole('alert')).toHaveTextContent('Session APIが設定されていません');
      await expect(canvas.getByTestId('app-url')).not.toHaveTextContent('/sessions/SES-PREP-1098');
      await expect(canvas.queryByTestId('session-state')).not.toBeInTheDocument();
    });
  },
};
