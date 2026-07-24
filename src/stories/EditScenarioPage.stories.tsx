import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { MyrialeApp } from '../app/MyrialeApp';
import { createDemoDb } from '../app/demoData';
import { MockEditScenarioContainer } from './scenario-editor-page/MockEditScenarioContainer';
import '../styles.css';

const meta = {
  title: 'ユーザーストーリー/Edit scenario',
  component: MyrialeApp,
  render: () => <MyrialeApp
    initialUrl="/scenarios/SCN-AWAKENING-LAB/edit"
    initialDb={createDemoDb('empty')}
    editScenarioContainer={MockEditScenarioContainer}
  />,
  parameters: {
    notes: 'シナリオ登録と同じ共通フォームを使い、保存済みの値を読み込んで編集します。',
  },
} satisfies Meta<typeof MyrialeApp>;

export default meta;
type Story = StoryObj<typeof meta>;

const goToStep = async (canvas: ReturnType<typeof within>, stepName: string) => {
  await userEvent.click(canvas.getByRole('button', { name: `${stepName}へ` }));
};

export const USE01EditExistingScenario: Story = {
  name: 'US-E01: 作成画面と同じフォームで既存シナリオを編集したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('登録画面と同じ8ステップの編集ウィザードに保存済み内容を読み込む', async () => {
      await expect(canvas.getByRole('main', { name: 'シナリオ編集ウィザード' })).toBeVisible();
      await expect(canvas.getByRole('complementary', { name: '契約の改稿' })).toBeVisible();
      await expect(canvas.getByLabelText('シナリオタイトル')).toHaveValue('目覚めの研究室');
      await expect(canvas.getByRole('group', { name: '登録済みジャンルタグ' })).toHaveTextContent('SF');
      await expect(canvas.getByRole('button', { name: 'AI裁量へ' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: '主人公へ' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: '第一場面へ' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: '挿絵へ' })).toBeVisible();
    });
  },
};

export const USE02EditBasics: Story = {
  name: 'US-E02: タイトル・タグ・基本情報を編集して保存したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('タイトルと基本情報を変更する', async () => {
      const title = canvas.getByLabelText('シナリオタイトル');
      await userEvent.clear(title);
      await userEvent.type(title, '目覚めの研究室・改');
      const summary = canvas.getByLabelText('基本情報');
      await userEvent.clear(summary);
      await userEvent.type(summary, '# シナリオ\n改稿した研究施設から脱出します。');
    });
    await step('変更を保存する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '変更を保存' }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('変更を保存しました');
    });
  },
};

export const USE03EditHeroAndOpening: Story = {
  name: 'US-E03: 主人公と第一場面を作成時と同じ操作で編集したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '主人公');
    await step('主人公の前提を編集する', async () => {
      const hero = canvas.getByLabelText('主人公の設定');
      await userEvent.clear(hero);
      await userEvent.type(hero, '研究員または被験者として自由に作成する。');
    });
    await goToStep(canvas, '第一場面');
    await step('開始シーンを編集する', async () => {
      const opening = canvas.getByLabelText('開始シーン');
      await userEvent.clear(opening);
      await userEvent.type(opening, '非常灯が点滅する実験室で目を覚ます。');
      await expect(opening).toHaveValue('非常灯が点滅する実験室で目を覚ます。');
    });
  },
};

export const USE04EditIllustration: Story = {
  name: 'US-E04: 挿絵設定を作成時と同じ操作で編集したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '挿絵');
    await step('画風・ムード・NG要素を編集できる', async () => {
      await expect(canvas.getByLabelText('挿絵の画風')).toHaveValue('冷たい研究施設のコンセプトアート');
      await expect(canvas.getByLabelText('挿絵のムード')).toHaveValue('静かな緊張感');
      await expect(canvas.getByLabelText('挿絵の禁止要素')).toHaveValue('明るい屋外、コミカルな表現');
    });
  },
};

export const USE11EditRuleDataWithStableCodes: Story = {
  name: 'US-E11: 既存ルールデータのstable codeを保って編集したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, '種類と状態');
    await step('保存済みObject Typeのstate/action interfaceを読み込んで表示名を編集する', async () => {
      await expect(canvas.getByRole('heading', { name: '保存済みObject Typeを編集' })).toBeVisible();
      await expect(canvas.getByLabelText('種類のstable code')).toHaveValue('archive-door');
      await expect(canvas.getByLabelText('状態1のcode')).toHaveValue('open');
      await expect(canvas.getByLabelText('アクション1のcode')).toHaveValue('open');
      await userEvent.clear(canvas.getByLabelText('種類の表示名'));
      await userEvent.type(canvas.getByLabelText('種類の表示名'), '封印書庫の扉');
    });
    await goToStep(canvas, '場所と配置');
    await step('LocationとObject placementのstable codeを保って表示名だけ改稿する', async () => {
      await expect(canvas.getByLabelText('場所のstable code')).toHaveValue('sunken-library');
      await userEvent.clear(canvas.getByLabelText('場所の表示名'));
      await userEvent.type(canvas.getByLabelText('場所の表示名'), '水没した中央閲覧室');
      await expect(canvas.getByLabelText('オブジェクトのstable code')).toHaveValue('north-archive-door');
    });
    await goToStep(canvas, 'アクション結果');
    await step('決定的な結果を維持したまま変更を保存する', async () => {
      await expect(canvas.getByTestId('rule-readiness')).toHaveTextContent('決定的です');
      await userEvent.click(canvas.getByRole('button', { name: '変更を保存' }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('変更を保存しました');
    });
  },
};
