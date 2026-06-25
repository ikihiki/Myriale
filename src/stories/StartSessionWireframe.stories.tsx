import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { StartSessionWireframe } from '../StartSessionWireframe';
import '../styles.css';

const meta = {
  title: 'Start session/Wireframe from user stories',
  component: StartSessionWireframe,
  parameters: {
    notes: 'docs/user-stories/start-session.md の各ユーザーストーリーを、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。',
  },
} satisfies Meta<typeof StartSessionWireframe>;

export default meta;
type Story = StoryObj<typeof meta>;

const startPreparing = async (canvas: ReturnType<typeof within>) => {
  await userEvent.click(canvas.getByRole('button', { name: '星喰いの地下図書館で開始' }));
};

export const USS01StartNewSessionFromScenario: Story = {
  name: 'US-S01: シナリオから新しいセッションを開始したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('シナリオ一覧から対象Scenarioを確認し、登録導線も見える', async () => {
      await expect(canvas.getByRole('region', { name: 'シナリオ一覧' })).toBeVisible();
      await expect(canvas.getByTestId('scenario-list')).toHaveTextContent('星喰いの地下図書館');
      await expect(canvas.getByRole('button', { name: '新しいシナリオを登録' })).toBeVisible();
      await expect(canvas.queryByRole('complementary', { name: 'シナリオ登録導線' })).not.toBeInTheDocument();
    });
    await step('Scenarioを選択してからSessionウィザードを開始し、設定をスナップショットする', async () => {
      await startPreparing(canvas);
      await expect(canvas.getByTestId('session-notice')).toHaveTextContent('Session用にスナップショット');
      await expect(canvas.getByText('SES-PREP-1098')).toBeVisible();
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Preparing');
      await expect(canvas.getByRole('complementary', { name: 'セッション状態サマリー' })).toHaveTextContent('星喰いの地下図書館');
    });
  },
};

export const USS02ReadIntroBeforeHero: Story = {
  name: 'US-S02: セッション開始時にシナリオのイントロを見たい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await step('Preparing状態で、主人公未確定のイントロNarrativeを読む', async () => {
      await expect(canvas.getByRole('region', { name: 'イントロNarrative' })).toBeVisible();
      await expect(canvas.getByTestId('intro-narrative')).toHaveTextContent('あなたは水没した閲覧室');
      await expect(canvas.getByTestId('intro-narrative')).toHaveTextContent('名もなき旅人');
    });
    await step('初回セッションではイントロをスキップできないことを示す', async () => {
      await expect(canvas.getByRole('button', { name: '初回はスキップ不可' })).toBeDisabled();
    });
  },
};

export const USS03ConfirmHeroAfterIntro: Story = {
  name: 'US-S03: イントロ後に主人公を確定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await userEvent.click(canvas.getByRole('button', { name: 'イントロを読んだので主人公へ' }));
    await step('キャラクター選択式で候補を選び、Session固有データとして確定する', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('候補キャラクター'), 'エル / 記憶を失った写字生');
      await userEvent.click(canvas.getByRole('button', { name: '主人公を確定' }));
      await expect(canvas.getByTestId('session-notice')).toHaveTextContent('Session固有データとして確定');
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('エル / 記憶を失った写字生');
    });
  },
};

export const USS03CreateHeroWithAiAssistance: Story = {
  name: 'US-S03C/D: 主人公を作成し、AI案は確認してから確定する',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await userEvent.click(canvas.getByRole('button', { name: 'イントロを読んだので主人公へ' }));
    await step('キャラクタークリエイトで名前とプロフィールを編集する', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('主人公の扱い'), 'create');
      await userEvent.clear(canvas.getByLabelText('主人公の名前'));
      await userEvent.type(canvas.getByLabelText('主人公の名前'), 'ユイ');
      await expect(canvas.getByTestId('hero-summary')).toHaveTextContent('ユイ');
    });
    await step('AIに任せても自動確定せず、確認・修正を促す', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('主人公の扱い'), 'ai');
      await userEvent.click(canvas.getByRole('button', { name: 'AIに任せる' }));
      await expect(canvas.getByTestId('ai-hero-suggestion')).toHaveTextContent('確認・修正してから確定');
      await expect(canvas.getByTestId('session-notice')).toHaveTextContent('自動確定はしません');
    });
  },
};

export const USS04ReviewBeforeStarting: Story = {
  name: 'US-S04: セッション開始前に内容を最終確認したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await userEvent.click(canvas.getByRole('button', { name: 'イントロを読んだので主人公へ' }));
    await userEvent.click(canvas.getByRole('button', { name: '主人公を確定' }));
    await step('開始サマリーでScenario概要、主人公、設定を確認する', async () => {
      await expect(canvas.getByRole('region', { name: '開始前の最終確認' })).toBeVisible();
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('Scenario: 星喰いの地下図書館');
      await expect(canvas.getByTestId('start-summary')).toHaveTextContent('主人公: ミラ');
    });
    await step('必要に応じて前工程へ戻れる', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '主人公確定へ戻る' }));
      await expect(canvas.getByRole('region', { name: '主人公確定' })).toBeVisible();
      await expect(canvas.getByTestId('session-notice')).toHaveTextContent('前工程に戻れます');
    });
  },
};

export const USS05BeginActiveSession: Story = {
  name: 'US-S05: セッションを正式に開始したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await startPreparing(canvas);
    await userEvent.click(canvas.getByRole('button', { name: 'イントロを読んだので主人公へ' }));
    await userEvent.click(canvas.getByRole('button', { name: '主人公を確定' }));
    await step('「物語を始める」でSessionをActiveにし、本編最初のNarrativeを生成する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '物語を始める' }));
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Active');
      await expect(canvas.getByTestId('first-narrative')).toHaveTextContent('最初の選択肢が生成されました');
      await expect(canvas.getByTestId('session-notice')).toHaveTextContent('本編最初のNarrativeを生成');
    });
  },
};
