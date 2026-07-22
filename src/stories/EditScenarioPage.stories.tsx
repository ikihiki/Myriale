import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { MyrialeApp } from '../app/MyrialeApp';
import { createDemoDb } from '../app/demoData';
import { STORY_IDS } from '../shared/nav';
import '../styles.css';

const meta = {
  title: 'ユーザーストーリー/Edit scenario',
  component: MyrialeApp,
  render: () => <MyrialeApp initialUrl="/scenarios/SCN-STAR-LIBRARY/edit" initialDb={createDemoDb('editableScenario')} />,
  parameters: {
    notes: 'docs/user-stories/edit-scenario.md の各ユーザーストーリー（US-E01〜E10）を、Storybook Interactions の step と expect で操作説明できるアプリ画面にしたものです。',
  },
} satisfies Meta<typeof MyrialeApp>;

export default meta;
type Story = StoryObj<typeof meta>;

const STAR_LIBRARY = '星喰いの地下図書館';
const ASH_STATION = '灰の駅と宛名のない切符';

/** 一覧カードの「編集」ボタンから対象シナリオを開く。 */
const openEditor = async (canvas: ReturnType<typeof within>, title: string) => {
  const card = within(canvas.getByTestId('scenario-list')).getByText(title).closest('article') as HTMLElement;
  await userEvent.click(within(card).getByRole('button', { name: '編集' }));
};

/** 編集セクションのタブを切り替える。 */
const goToSection = async (canvas: ReturnType<typeof within>, label: string) => {
  await userEvent.click(canvas.getByRole('button', { name: `${label}へ` }));
};

export const USE01EditExistingScenario: Story = {
  name: 'US-E01: 既存のシナリオを編集したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('自分のシナリオ一覧が表示され、公開・非公開どちらも編集できる', async () => {
      await expect(canvas.getByRole('region', { name: '自分のシナリオ一覧' })).toBeVisible();
      await expect(canvas.getByTestId('scenario-list')).toHaveTextContent(STAR_LIBRARY);
      await expect(canvas.getByTestId('card-SCN-ASH-STATION')).toHaveTextContent('非公開');
    });
    await step('編集を選ぶと編集画面が開き、現在の内容が読み込まれる', async () => {
      await openEditor(canvas, STAR_LIBRARY);
      await expect(canvas.getByTestId('edit-notice')).toHaveTextContent('現在の内容を読み込んでいます');
      await expect(canvas.getByTestId('summary-title')).toHaveTextContent(STAR_LIBRARY);
      await expect(canvas.getByLabelText('シナリオタイトル')).toHaveValue(STAR_LIBRARY);
    });
  },
};

export const USE02EditBasics: Story = {
  name: 'US-E02: シナリオの基本情報を編集したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await step('タイトルと概要を編集すると、サマリーに反映される', async () => {
      const title = canvas.getByLabelText('シナリオタイトル');
      await userEvent.clear(title);
      await userEvent.type(title, '星喰いの地下図書館・改');
      await expect(canvas.getByTestId('summary-title')).toHaveTextContent('星喰いの地下図書館・改');
      const summary = canvas.getByLabelText('概要');
      await userEvent.clear(summary);
      await userEvent.type(summary, '改稿した概要テキスト。');
      await expect(canvas.getByTestId('summary-dirty')).toHaveTextContent('未保存の変更があります');
    });
  },
};

export const USE03EditWorld: Story = {
  name: 'US-E03: ジャンル・雰囲気・世界観を編集したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, '世界観');
    await step('世界観セクションで、既存セッションに影響しないことが示される', async () => {
      await expect(canvas.getByRole('region', { name: '世界観の編集' })).toHaveTextContent('既存セッションには影響しません');
    });
    await step('ジャンルとLoreを修正できる', async () => {
      const genre = canvas.getByLabelText('ジャンル');
      await userEvent.clear(genre);
      await userEvent.type(genre, '幻想ミステリ');
      await expect(genre).toHaveValue('幻想ミステリ');
      // Loreには現在の世界観設定が読み込まれている。
      await expect(canvas.getByLabelText('世界観やルール')).toHaveDisplayValue(/星座は魔法体系の鍵/);
    });
  },
};

export const USE04EditAiSettings: Story = {
  name: 'US-E04: AI関連設定を編集したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, 'AI設定');
    await step('AI裁量レベルとNarrative生成方針を変更できる', async () => {
      await userEvent.click(canvas.getByRole('combobox', { name: 'AI裁量' }));
      await userEvent.click(await screen.findByRole('option', { name: '高: 展開を広げる' }));
      await expect(canvas.getByRole('combobox', { name: 'AI裁量' })).toHaveTextContent('高: 展開を広げる');
      const policy = canvas.getByLabelText('Narrative生成方針');
      await userEvent.clear(policy);
      await userEvent.type(policy, 'テンポ重視で簡潔に。');
      await expect(policy).toHaveValue('テンポ重視で簡潔に。');
    });
  },
};

export const USE04ASUseAdvancedControlsDuringEdit: Story = {
  name: 'US-E04/AS: 編集中に高度な進行制御を編集したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, 'Chapter / Beat');
    await step('編集ウィザード内の独立セクションとしてUS-ASのBeat設計項目を開ける', async () => {
      await expect(canvas.getByRole('region', { name: 'US-AS03/04: 章・ビート・条件・禁止事項の編集' })).toBeVisible();
      await expect(canvas.getByTestId('advanced-summary')).toHaveTextContent('Chapter / Beat');
      await expect(canvas.queryByText('Advanced scenario execution / Controlled AI')).not.toBeInTheDocument();
      await expect(canvas.queryByText('US-AS03/04: 章・ビート・Entry/Exit条件・禁止事項を複数行で管理し、重要展開のスキップや早すぎる真相開示を防ぎます。')).not.toBeInTheDocument();
      await expect(canvas.getByRole('table', { name: 'Beatテーブル' })).toHaveTextContent('Chapter 2');
    });
    await step('編集中でもUS-AS03のようにBeatを追加できる', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '新規Beat' }));
      await expect(canvas.getByRole('dialog', { name: 'Beatを追加' })).toHaveAttribute('data-size', 'editor');
      await userEvent.clear(canvas.getByLabelText('Chapter'));
      await userEvent.type(canvas.getByLabelText('Chapter'), 'Chapter 9: 編集中の終章');
      await userEvent.click(canvas.getByRole('button', { name: 'Beatを固定' }));
      await expect(canvas.getByRole('table', { name: 'Beatテーブル' })).toHaveTextContent('Chapter 9');
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('次のビートへ進みません');
    });
  },
};

export const USAS07AutoRerouteDriftDuringEdit: Story = {
  name: 'US-AS07: 編集中にAI逸脱時の軌道修正を設定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, '進行デバッグ');
    await step('編集画面の進行デバッグで、誘導イベントを生成する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '誘導イベントを生成' }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('鐘楼へ戻します');
      await expect(canvas.getByTestId('correction-state')).toHaveTextContent('reroute');
    });
  },
};

export const USAS08GenerateMissingClueDuringEdit: Story = {
  name: 'US-AS08: 編集中に不足手がかりの補完を設定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, '進行デバッグ');
    await step('手がかり不足を補完し、既存Castテーブルを優先使用する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '補完イベントを生成' }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('既存Castを優先使用');
      await expect(canvas.getByTestId('correction-state')).toHaveTextContent('clue');
    });
  },
};

export const USAS09ViewProgressStateDuringEdit: Story = {
  name: 'US-AS09: 編集中に実行時の進行状態を確認したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, '進行デバッグ');
    await step('現在参照しているCanon / HiddenBrief / Beat禁止事項を作者向けに可視化する', async () => {
      await expect(canvas.getByTestId('debug-refs')).toHaveTextContent('Canon');
      await expect(canvas.getByTestId('debug-refs')).toHaveTextContent('HiddenBrief');
    });
  },
};

export const USAS10TriggerForcedEventDuringEdit: Story = {
  name: 'US-AS10: 編集中に条件付き強制イベントを定義したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, '強制イベント');
    await step('強制イベントをテーブルへ追加する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '新規強制イベント' }));
      await userEvent.clear(canvas.getByLabelText('イベント名'));
      await userEvent.type(canvas.getByLabelText('イベント名'), '地下天文台の崩落');
      await userEvent.click(canvas.getByRole('button', { name: '強制イベントを登録' }));
      await expect(canvas.getByRole('table', { name: '強制イベントテーブル' })).toHaveTextContent('地下天文台の崩落');
    });
    await step('進行デバッグから条件付き強制イベントを発火対象にできる', async () => {
      await goToSection(canvas, '進行デバッグ');
      await userEvent.click(canvas.getByRole('button', { name: '条件付き強制イベントを発火' }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('必ず発火');
    });
  },
};

export const USAS11StartTestFromBeatDuringEdit: Story = {
  name: 'US-AS11: 編集中に途中のビートからテスト実行したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, 'テスト実行');
    await step('登録済みBeatを指定して条件を満たした扱いで開始する', async () => {
      await userEvent.clear(canvas.getByLabelText('テスト開始地点'));
      await userEvent.type(canvas.getByLabelText('テスト開始地点'), 'Chapter 4 / Beat 4-1');
      await userEvent.click(canvas.getByRole('button', { name: 'この地点からテスト開始' }));
      await expect(canvas.getByLabelText('テスト開始地点')).toHaveValue('Chapter 4 / Beat 4-1');
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('テストセッション');
    });
  },
};

export const USAS12InspectAiReferencesDuringEdit: Story = {
  name: 'US-AS12: 編集中にAIが参照している非公開情報を把握したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, '進行デバッグ');
    await step('HiddenBrief / Canon / 現在Beatの参照状況を更新して確認する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '参照情報を更新' }));
      await expect(canvas.getByTestId('debug-refs')).toHaveTextContent('AI参照状況');
      await expect(canvas.getByTestId('debug-refs')).toHaveTextContent('HiddenBrief 1件');
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('プレイヤー向けUIでは表示されません');
    });
  },
};

export const USE05EditIllustration: Story = {
  name: 'US-E05: 挿絵設定を編集したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, '挿絵');
    await step('画風・ムード・NG要素を編集できる', async () => {
      const style = canvas.getByLabelText('挿絵の画風');
      await userEvent.clear(style);
      await userEvent.type(style, '影絵 / 高コントラスト');
      await expect(style).toHaveValue('影絵 / 高コントラスト');
    });
    await step('保存されないプレビューで確認できる', async () => {
      await userEvent.click(canvas.getByTestId('preview-button'));
      await expect(canvas.getByTestId('preview-result')).toHaveTextContent('本番セッションには反映されません');
    });
  },
};

export const USE06AskAiCheck: Story = {
  name: 'US-E06: 編集内容をAIにチェックしてもらいたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await step('「AIにチェック」で矛盾点と改善案が提示される', async () => {
      await userEvent.click(canvas.getByTestId('ai-check-button'));
      await expect(canvas.getByTestId('ai-check')).toHaveTextContent('矛盾:');
      await expect(canvas.getByTestId('ai-check')).toHaveTextContent('改善案:');
    });
    await step('AIは自動確定しないことが明示される', async () => {
      await expect(canvas.getByTestId('edit-notice')).toHaveTextContent('自動確定はしません');
    });
  },
};

export const USE07PreviewEdit: Story = {
  name: 'US-E07: 編集内容をプレビューしたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await step('プレビュー（テストプレイ）で仮セッションのイントロ/序盤が生成される', async () => {
      await userEvent.click(canvas.getByTestId('preview-button'));
      await expect(canvas.getByTestId('preview-result')).toHaveTextContent('イントロと序盤Narrativeを生成');
      await expect(canvas.getByTestId('edit-notice')).toHaveTextContent('本番セッションには影響しません');
    });
    await step('本番相当のテストプレイは、Session開始アプリ画面への導線として用意される', async () => {
      await expect(canvas.getByRole('button', { name: '本番相当のテストプレイへ' })).toBeVisible();
      await expect(STORY_IDS.startSession).toContain('start-session');
    });
  },
};

export const USE08SaveDraft: Story = {
  name: 'US-E08: 編集内容を保存したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await step('編集すると未保存状態になり、下書き保存すると保存済みになる', async () => {
      await userEvent.type(canvas.getByLabelText('シナリオタイトル'), '・改');
      await expect(canvas.getByTestId('summary-dirty')).toHaveTextContent('未保存の変更があります');
      await userEvent.click(canvas.getByTestId('save-button'));
      await expect(canvas.getByTestId('edit-notice')).toHaveTextContent('下書きとして保存しました');
      await expect(canvas.getByTestId('summary-dirty')).toHaveTextContent('保存済み（変更なし）');
    });
  },
};

export const USE09PublishEdit: Story = {
  name: 'US-E09: 編集内容を公開・反映したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, STAR_LIBRARY);
    await step('公開すると新規セッションに最新版が使われ、既存セッションは影響を受けない', async () => {
      await userEvent.click(canvas.getByTestId('publish-button'));
      await expect(canvas.getByTestId('edit-notice')).toHaveTextContent('新規セッションは最新版を使います');
      await expect(canvas.getByTestId('edit-notice')).toHaveTextContent('3件のセッションは影響を受けません');
    });
  },
};

export const USE10ReviewHistory: Story = {
  name: 'US-E10: シナリオの編集履歴を管理したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await openEditor(canvas, ASH_STATION);
    await step('編集日時と変更概要が一覧表示される', async () => {
      const history = canvas.getByTestId('history');
      await expect(history).toHaveTextContent('編集履歴');
      await expect(history).toHaveTextContent('挿絵ムードを「郷愁」に調整');
      await expect(history).toHaveTextContent('Draftとして新規作成');
    });
  },
};
