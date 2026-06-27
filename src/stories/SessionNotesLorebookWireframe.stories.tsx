import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { SessionNotesLorebookWireframe } from '../SessionNotesLorebookWireframe';
import '../styles.css';

const meta = {
  title: 'Session notes Lorebook/Wireframe from user stories',
  component: SessionNotesLorebookWireframe,
  parameters: {
    notes: 'docs/user-stories/session-notes-lorebook-user-stories.md の各ユーザーストーリー（US-L01〜L10）を、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。',
  },
} satisfies Meta<typeof SessionNotesLorebookWireframe>;

export default meta;
type Story = StoryObj<typeof meta>;

export const USL01CreatePersonNote: Story = {
  name: 'US-L01: 人物ノートに詳細情報を登録したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('人物ノートを新規作成し、構造化されたプロフィールを保存する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '人物ノートを新規作成' }));
      await expect(canvas.getByTestId('note-editor')).toHaveTextContent('灯守アキラ');
      await expect(canvas.getByLabelText('外見・種別・詳細')).toHaveValue(expect.stringContaining('星図レンズ'));
      await expect(canvas.getByTestId('lorebook-notice')).toHaveTextContent('人物ノートを作成');
    });
  },
};

export const USL02CreateLocationNote: Story = {
  name: 'US-L02: 場所ノートに詳細情報を登録したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('場所ノートを新規作成し、位置関係・雰囲気・禁則を保存する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '場所ノートを新規作成' }));
      await expect(canvas.getByTestId('note-editor')).toHaveTextContent('地下天文台');
      await expect(canvas.getByLabelText('現在状態または禁則')).toHaveValue(expect.stringContaining('封印扉'));
      await expect(canvas.getByTestId('lorebook-notice')).toHaveTextContent('場所ノートを作成');
    });
  },
};

export const USL03SeparateCanonTentativeRumor: Story = {
  name: 'US-L03: Canonと未確定情報を分けて管理したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('ノートの確定度を噂へ変更し、AIに断定させない扱いにする', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '噂にする' }));
      await expect(canvas.getByTestId('note-editor')).toHaveTextContent('噂');
      await expect(canvas.getByTestId('lorebook-notice')).toHaveTextContent('可能性として扱われます');
    });
  },
};

export const USL04AiReferencesLorebook: Story = {
  name: 'US-L04: AIにLorebookを参照して語ってほしい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('ターン内に参照された人物・場所ノートを表示し、Canonを優先してNarrativeを生成する', async () => {
      await expect(canvas.getByTestId('lorebook-turn-narrative')).toHaveTextContent('Canon');
      await expect(canvas.getByTestId('referenced-notes')).toHaveTextContent('月読ミナト');
      await expect(canvas.getByTestId('referenced-notes')).toHaveTextContent('水没した地下図書館');
    });
  },
};

export const USL05ResolveConflictByUserDecision: Story = {
  name: 'US-L05: 矛盾しそうなとき勝手に変更せず確認してほしい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('矛盾候補を確認し、噂として保持する判断をユーザーが行う', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '整合性チェック' }));
      await expect(canvas.getByTestId('consistency-issue')).toHaveTextContent('矛盾候補');
      await userEvent.click(canvas.getByRole('button', { name: '噂として保持' }));
      await expect(canvas.getByTestId('issue-action')).toHaveTextContent('keepRumor');
      await expect(canvas.getByTestId('lorebook-notice')).toHaveTextContent('断定させません');
    });
  },
};

export const USL06AiSuggestsNoteCandidates: Story = {
  name: 'US-L06: AIに追加候補を提案してほしい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('AIが新規地点を検出して、採用前のノート作成候補を提示する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'AIに追加候補を提案させる' }));
      await expect(canvas.getByTestId('note-editor')).toHaveTextContent('地下天文台');
      await expect(canvas.getByTestId('lorebook-notice')).toHaveTextContent('自動確定はせず');
    });
  },
};

export const USL07RebuildCompressedContext: Story = {
  name: 'US-L07: Lorebookを圧縮コンテキストとして使いたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Lorebook Canon・Session State・ChapterSummary・Recent TurnsでContextを再構築する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '次ターンContextを再構築' }));
      await expect(canvas.getByTestId('context-stack')).toHaveTextContent('Lorebook Canon');
      await expect(canvas.getByTestId('context-stack')).toHaveTextContent('Recent Turns');
      await expect(canvas.getByTestId('lorebook-notice')).toHaveTextContent('再構築');
    });
  },
};

export const USL08GenerateChapterSummary: Story = {
  name: 'US-L08: 章単位で要約を生成・更新したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('章境界をもとにChapterSummaryを生成し、次回生成で優先参照する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '章要約を生成' }));
      await expect(canvas.getByTestId('chapter-summary')).toHaveTextContent('Chapter 2');
      await expect(canvas.getByTestId('lorebook-notice')).toHaveTextContent('優先参照');
    });
  },
};

export const USL09ShowReferencedNotes: Story = {
  name: 'US-L09: 参照しているノートをUIで可視化したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('参照ノートのチップから該当ノート編集へ移動する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '水没した地下図書館' }));
      await expect(canvas.getByTestId('note-editor')).toHaveTextContent('水没した地下図書館');
      await expect(canvas.getByTestId('note-editor')).toHaveTextContent('場所ノート');
    });
  },
};

export const USL10RunConsistencyCheck: Story = {
  name: 'US-L10: ノートと要約の整合性チェックをしたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('整合性チェックで矛盾候補を提示し、修正確定はユーザーに委ねる', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '整合性チェック' }));
      await expect(canvas.getByTestId('consistency-issue')).toHaveTextContent('王都地下');
      await expect(canvas.getByTestId('lorebook-notice')).toHaveTextContent('ユーザーが行います');
    });
  },
};
