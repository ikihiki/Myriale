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
  await userEvent.click(await canvas.findByRole('button', { name: `${stepName}へ` }));
};

export const USE01EditExistingScenario: Story = {
  name: 'US-E01: 作成画面と同じフォームで既存シナリオを編集したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('登録画面と同じ7ステップの編集ウィザードに保存済み内容を読み込む', async () => {
      await expect(canvas.getByRole('main', { name: 'シナリオ編集ウィザード' })).toBeVisible();
      await expect(canvas.getByRole('complementary', { name: '契約の改稿' })).toBeVisible();
      await expect(canvas.getByLabelText('シナリオタイトル')).toHaveValue('目覚めの研究室');
      await expect(canvas.getByRole('group', { name: '登録済みジャンルタグ' })).toHaveTextContent('SF');
      for (const stepName of ['基本情報', '場所', '主人公', 'エンティティ', '開始状態', '挿絵', 'テスト']) {
        await expect(canvas.getByRole('button', { name: `${stepName}へ` })).toBeVisible();
      }
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
    await goToStep(canvas, '開始状態');
    await step('保存済みの開始場所と初期ステートを確認する', async () => {
      await expect(canvas.getByRole('combobox', { name: 'セッション開始場所' })).toHaveTextContent('水没した閲覧室');
      await expect(canvas.getByRole('combobox', { name: '北書庫の扉の開いている初期値' })).toHaveTextContent('false');
    });
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

export const USE05CheckReadinessAndPublish: Story = {
  name: 'US-E05: 保存済み下書きの公開準備を確認して公開したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('公開準備を確認するまで公開操作は無効になっている', async () => {
      await expect(canvas.getByRole('button', { name: 'シナリオを公開' })).toBeDisabled();
      await userEvent.click(canvas.getByRole('button', { name: '公開準備を確認' }));
      await expect(canvas.getByTestId('publish-readiness')).toHaveTextContent('公開できます。');
    });
    await step('準備完了後にシナリオを公開する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'シナリオを公開' }));
      await expect(canvas.getByTestId('publish-success')).toHaveTextContent('公開が完了しました。');
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('シナリオを公開しました。');
    });
  },
};

export const USE06CompareUnsavedDraftNarrative: Story = {
  name: 'US-E06: Sessionの状態を取り込み、公開版よりドラフトが改善したか反復確認したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('基本情報のトーンと世界観を未保存のまま改稿する', async () => {
      const tone = canvas.getByLabelText('シナリオのトーン');
      await userEvent.clear(tone);
      await userEvent.type(tone, '静謐で、同じ所作を繰り返さず、新しい事実を一つずつ明かす');
      const lore = canvas.getByLabelText('世界観・設定');
      await userEvent.clear(lore);
      await userEvent.type(lore, '館の東棟には前主人の帳簿があり、メイドは信頼が高まった時だけ存在を明かす。');
    });
    await goToStep(canvas, 'テスト');
    await step('SessionとTurnを指定して実際のテスト条件をインポートする', async () => {
      await userEvent.type(canvas.getByLabelText('インポートするSession ID'), 'SES-MAID-001');
      await userEvent.type(canvas.getByLabelText('インポートするTurn ID'), 'TRN-MAID-004');
      await userEvent.click(canvas.getByRole('button', { name: 'インポート' }));
      await expect(canvas.getByTestId('narrative-test-notice')).toHaveTextContent('取り込みました');
      await expect(canvas.getByLabelText('Turn 1 Narrative')).toHaveValue('メイドは紅茶を注ぎ、庭のバラについて語った。');
    });
    await step('過去Turnと状態を編集し、公開版と未保存ドラフトを同じ条件で比較する', async () => {
      const previousNarrative = canvas.getByLabelText('Turn 1 Narrative');
      await userEvent.clear(previousNarrative);
      await userEvent.type(previousNarrative, 'メイドは庭の由来を説明した。');
      await userEvent.click(canvas.getByRole('button', { name: '公開版と未保存ドラフトを比較' }));
      const comparison = await canvas.findByTestId('narrative-comparison');
      await expect(comparison).toHaveTextContent('公開版');
      await expect(comparison).toHaveTextContent('未保存ドラフト');
      await expect(comparison).toHaveTextContent('東棟の帳簿');
      await expect(canvas.getByTestId('scenario-notice')).not.toHaveTextContent('変更を保存しました');
    });
  },
};

export const USE07CompareAiModelsBlindly: Story = {
  name: 'US-E07: 同じNarrative条件で複数AIを反復ブラインド評価したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToStep(canvas, 'テスト');
    await step('Session Turnを取り込み、比較対象Profileと反復回数を固定する', async () => {
      await userEvent.type(canvas.getByLabelText('インポートするSession ID'), 'SES-MAID-001');
      await userEvent.type(canvas.getByLabelText('インポートするTurn ID'), 'TRN-MAID-004');
      await userEvent.click(canvas.getByRole('button', { name: 'インポート' }));
      await expect(canvas.getByLabelText('比較するAI Profile IDs')).toHaveValue('runpod-economy\nrunpod-recommended');
      await expect(canvas.getByLabelText('AI比較の反復回数')).toHaveValue(3);
    });
    await step('モデル名ではなくBlind codeで合否・latency・tokenを確認する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'ブラインド比較を実行' }));
      const result = await canvas.findByTestId('ai-evaluation-result');
      await expect(result).toHaveTextContent('5 / 6 attempts passed');
      await expect(result).toHaveTextContent('B11');
      await expect(result).toHaveTextContent('PASS');
      await expect(result).toHaveTextContent('FAIL');
      await expect(result).toHaveTextContent('JSON export');
      await expect(result).toHaveTextContent('CSV export');
    });
  },
};

export const USE11EditRuleDataWithStableCodes: Story = {
  name: 'US-E11: 既存ルールデータのstable codeを保って編集したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await goToStep(canvas, 'エンティティ');
    await step('Object Typeの行から編集ペインを開き、stable codeを保って表示名を編集する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /^書庫の扉を編集$/ }));
      await expect(screen.getByRole('dialog', { name: '書庫の扉' })).toBeVisible();
      await expect(screen.getByLabelText('種類のstable code')).toHaveValue('archive-door');
      await userEvent.click(screen.getByRole('button', { name: '開いているを編集' }));
      await expect(screen.getByRole('dialog', { name: '開いている' })).toHaveAttribute('data-layer', '1');
      await expect(screen.getByLabelText('状態1のstable code')).toHaveValue('open');
      await userEvent.click(screen.getByRole('button', { name: '状態の編集を完了' }));
      await userEvent.click(screen.getByRole('button', { name: '扉を開けるを編集' }));
      await expect(screen.getByRole('dialog', { name: '扉を開ける' })).toHaveAttribute('data-layer', '1');
      await expect(screen.getByLabelText('アクション1のstable code')).toHaveValue('open');
      await userEvent.click(screen.getByRole('button', { name: 'アクションの編集を完了' }));
      await userEvent.clear(screen.getByLabelText('種類の表示名'));
      await userEvent.type(screen.getByLabelText('種類の表示名'), '封印書庫の扉');
      await userEvent.click(screen.getByRole('button', { name: '編集を完了' }));
    });
    await goToStep(canvas, '場所');
    await step('場所とエンティティの各ステップで編集ペインを開く', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '水没した閲覧室を編集' }));
      await expect(screen.getByLabelText('場所のstable code')).toHaveValue('sunken-library');
      await userEvent.clear(screen.getByLabelText('場所の表示名'));
      await userEvent.type(screen.getByLabelText('場所の表示名'), '水没した中央閲覧室');
      await userEvent.click(screen.getByRole('button', { name: '編集を完了' }));
      await goToStep(canvas, 'エンティティ');
      await userEvent.click(canvas.getByRole('button', { name: '北書庫の扉を編集' }));
      await expect(screen.getByLabelText('エンティティのstable code')).toHaveValue('north-archive-door');
      await userEvent.click(screen.getByRole('button', { name: '編集を完了' }));
    });
    await step('Type generic ruleとObject adjust operationを維持したまま変更を保存する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /^封印書庫の扉を編集$/ }));
      await expect(screen.getByRole('button', { name: 'generic-openの実行ルールを編集' })).toBeVisible();
      await userEvent.click(screen.getByRole('button', { name: '編集を完了' }));
      await userEvent.click(canvas.getByRole('button', { name: '北書庫の扉を編集' }));
      await expect(screen.getByRole('table', { name: 'Object states' })).toHaveTextContent('開いている');
      await expect(screen.getByRole('table', { name: 'Object actions' })).toHaveTextContent('扉を開ける');
      await expect(screen.getByRole('button', { name: 'archive-door:generic-openの実行ルールを確認' })).toBeVisible();
      await userEvent.click(screen.getByRole('button', { name: 'archive-door:generic-openの実行ルールを確認' }));
      await expect(screen.queryByLabelText('実行ルールの優先度')).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: '閉じる' }));
      await userEvent.click(screen.getByRole('button', { name: '編集を完了' }));
      await expect(canvas.getByTestId('rule-readiness')).toHaveTextContent('決定的です');
      await userEvent.click(canvas.getByRole('button', { name: '変更を保存' }));
      await expect(canvas.getByTestId('scenario-notice')).toHaveTextContent('変更を保存しました');
      await expect(canvas.queryByRole('button', { name: 'アクション結果へ' })).not.toBeInTheDocument();
    });
  },
};
