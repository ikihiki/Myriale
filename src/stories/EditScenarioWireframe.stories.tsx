import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { EditScenarioWireframe } from '../EditScenarioWireframe';
import { STORY_IDS } from '../shared/nav';
import '../styles.css';

const meta = {
  title: 'Edit scenario/Wireframe from user stories',
  component: EditScenarioWireframe,
  parameters: {
    notes: 'docs/user-stories/edit-scenario.md の各ユーザーストーリー（US-E01〜E10）を、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。',
  },
} satisfies Meta<typeof EditScenarioWireframe>;

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
    await openEditor(canvas, STAR_LIBRARY);
    await goToSection(canvas, 'AI設定');
    await step('AI裁量レベルとNarrative生成方針を変更できる', async () => {
      await userEvent.selectOptions(canvas.getByLabelText('AI裁量'), '高: 展開を広げる');
      await expect(canvas.getByLabelText('AI裁量')).toHaveValue('高: 展開を広げる');
      const policy = canvas.getByLabelText('Narrative生成方針');
      await userEvent.clear(policy);
      await userEvent.type(policy, 'テンポ重視で簡潔に。');
      await expect(policy).toHaveValue('テンポ重視で簡潔に。');
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
    await step('本番相当のテストプレイは、Session開始ワイヤーフレームへの導線として用意される', async () => {
      await expect(canvas.getByRole('button', { name: '本番相当のテストプレイへ' })).toBeVisible();
      await expect(STORY_IDS.startSession).toMatch(/^start-session-/);
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
