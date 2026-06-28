import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { MyrialeApp } from '../app/MyrialeApp';
import { createDemoDb } from '../app/demoData';
import '../styles.css';

const meta = {
  title: 'Session notes Lorebook/Wireframe from user stories',
  component: MyrialeApp,
  render: () => <MyrialeApp initialUrl="/sessions/SES-PREP-1098/play" initialDb={createDemoDb('lorebook')} />,
  parameters: {
    notes: 'Lorebook系ユーザーストーリーは独立画面ではなく、セッション中のノートワークスペースとして表示します。編集はダイアログで行います。',
  },
} satisfies Meta<typeof MyrialeApp>;

export default meta;
type Story = StoryObj<typeof meta>;

const notes = (canvas: ReturnType<typeof within>) => within(canvas.getByTestId('session-notes-full'));

export const USL01CreatePersonNote: Story = {
  name: 'US-L01: 人物ノートに詳細情報を登録したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('人物ノートを作成し、編集ダイアログで構造化項目を確認する', async () => {
      await userEvent.click(notes(canvas).getByRole('button', { name: '人物追加' }));
      await expect(canvas.getByRole('dialog', { name: 'ノート編集' })).toHaveTextContent('灯守アキラ');
      await expect(canvas.getByLabelText('外見・種別・詳細')).toHaveValue(expect.stringContaining('星図レンズ'));
    });
  },
};

export const USL02CreateLocationNote: Story = {
  name: 'US-L02: 場所ノートに詳細情報を登録したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('場所ノートを作成し、編集ダイアログで位置関係・雰囲気・禁則を保存する', async () => {
      await userEvent.click(notes(canvas).getByRole('button', { name: '場所追加' }));
      await expect(canvas.getByRole('dialog', { name: 'ノート編集' })).toHaveTextContent('地下天文台');
      await expect(canvas.getByLabelText('現在状態または禁則')).toHaveValue(expect.stringContaining('封印扉'));
    });
  },
};

export const USL03SeparateCanonTentativeRumor: Story = {
  name: 'US-L03: Canonと未確定情報を分けて管理したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('ノートの確定度をダイアログ内で噂へ変更する', async () => {
      await userEvent.click(notes(canvas).getByRole('button', { name: '月読ミナトを編集' }));
      await userEvent.click(canvas.getByRole('button', { name: '噂にする' }));
      await expect(canvas.getByRole('dialog', { name: 'ノート編集' })).toHaveTextContent('噂');
      await expect(canvas.getByTestId('session-notes-notice')).toHaveTextContent('噂');
    });
  },
};

export const USL04AiReferencesLorebook: Story = {
  name: 'US-L04: AIにLorebookを参照して語ってほしい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('セッション画面内でCanonノートとContextを同時に確認できる', async () => {
      await expect(notes(canvas).getByTestId('canon-count')).toHaveTextContent('2件');
      await expect(notes(canvas).getByTestId('context-stack')).toHaveTextContent('Lorebook Canon');
    });
  },
};

export const USL05ResolveConflictByUserDecision: Story = {
  name: 'US-L05: 矛盾しそうなとき勝手に変更せず確認してほしい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('矛盾候補を確認し、噂として保持する判断をユーザーが行う', async () => {
      await userEvent.click(notes(canvas).getByRole('button', { name: '整合性チェック' }));
      await expect(notes(canvas).getByTestId('consistency-issue')).toHaveTextContent('矛盾候補');
      await userEvent.click(notes(canvas).getByRole('button', { name: '噂として保持' }));
      await expect(canvas.getByTestId('session-notes-notice')).toHaveTextContent('断定させません');
    });
  },
};

export const USL06AiSuggestsNoteCandidates: Story = {
  name: 'US-L06: AIに追加候補を提案してほしい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('新規地点候補を作成し、自動確定せず編集ダイアログで開く', async () => {
      await userEvent.click(notes(canvas).getByRole('button', { name: '場所追加' }));
      await expect(canvas.getByRole('dialog', { name: 'ノート編集' })).toHaveTextContent('地下天文台');
      await expect(canvas.getByTestId('open-note-state')).toHaveTextContent('location-4');
    });
  },
};

export const USL07RebuildCompressedContext: Story = {
  name: 'US-L07: Lorebookを圧縮コンテキストとして使いたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Lorebook Canon・Session State・ChapterSummary・Recent TurnsでContextを再構築する', async () => {
      await userEvent.click(notes(canvas).getByRole('button', { name: 'Context再構築' }));
      await expect(notes(canvas).getByTestId('context-stack')).toHaveTextContent('Recent Turns');
      await expect(canvas.getByTestId('session-notes-notice')).toHaveTextContent('再構築');
    });
  },
};

export const USL08GenerateChapterSummary: Story = {
  name: 'US-L08: 章単位で要約を生成・更新したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('次ターンContextの再構築で要約相当の圧縮Contextを更新する', async () => {
      await userEvent.click(notes(canvas).getByRole('button', { name: 'Context再構築' }));
      await expect(notes(canvas).getByTestId('context-stack')).toHaveTextContent('Session State');
    });
  },
};

export const USL09ShowReferencedNotes: Story = {
  name: 'US-L09: 参照しているノートをUIで可視化したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('ノート一覧から参照したいノートを編集ダイアログで開く', async () => {
      await userEvent.click(notes(canvas).getByRole('button', { name: '水没した地下図書館を編集' }));
      await expect(canvas.getByRole('dialog', { name: 'ノート編集' })).toHaveTextContent('水没した地下図書館');
      await expect(canvas.getByTestId('app-db-summary')).toHaveTextContent('open location-library');
    });
  },
};

export const USL10RunConsistencyCheck: Story = {
  name: 'US-L10: ノートと要約の整合性チェックをしたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('整合性チェックで矛盾候補を提示し、修正確定はユーザーに委ねる', async () => {
      await userEvent.click(notes(canvas).getByRole('button', { name: '整合性チェック' }));
      await expect(notes(canvas).getByTestId('consistency-issue')).toHaveTextContent('王都地下');
      await expect(canvas.getByTestId('session-notes-notice')).toHaveTextContent('ユーザーが行います');
    });
  },
};
