import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { AdvancedScenarioExecutionWireframe } from '../AdvancedScenarioExecutionWireframe';
import '../styles.css';

const meta = {
  title: 'Advanced scenario execution/Wireframe from user stories',
  component: AdvancedScenarioExecutionWireframe,
  parameters: {
    notes: 'docs/user-stories/advanced-scenario-execution-user-stories.md の各ユーザーストーリー（US-AS01〜AS12）を、複数登録を前提にテーブル一覧と追加ダイアログで管理するワイヤーフレームにしたものです。',
  },
} satisfies Meta<typeof AdvancedScenarioExecutionWireframe>;

export default meta;
type Story = StoryObj<typeof meta>;

const goToPanel = async (canvas: ReturnType<typeof within>, panelName: string) => {
  await userEvent.click(canvas.getByRole('button', { name: `${panelName}へ` }));
};

export const USAS01DefineCastPool: Story = {
  name: 'US-AS01: AIに使ってよい人物候補を定義したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Castテーブルから追加ダイアログを開き、人物候補を複数登録する', async () => {
      await expect(canvas.getByRole('table', { name: 'Cast候補テーブル' })).toHaveTextContent('月読ミナト');
      await userEvent.click(canvas.getByRole('button', { name: '新規Cast' }));
      await expect(canvas.getByRole('dialog', { name: 'Castを追加' })).toBeVisible();
      await userEvent.clear(canvas.getByLabelText('人物名'));
      await userEvent.type(canvas.getByLabelText('人物名'), '灯守アキラ');
      await userEvent.click(canvas.getByRole('button', { name: 'Castを登録' }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('候補プールに登録しました');
      await expect(canvas.getByRole('table', { name: 'Cast候補テーブル' })).toHaveTextContent('灯守アキラ');
      await expect(canvas.getByTestId('summary-counts')).toHaveTextContent('Cast 2件');
    });
  },
};

export const USAS02ManageLocations: Story = {
  name: 'US-AS02: 場所候補を管理したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, 'Location候補');
    await step('Locationテーブルから追加ダイアログを開き、場所候補を複数登録する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '新規Location' }));
      await expect(canvas.getByRole('dialog', { name: 'Locationを追加' })).toBeVisible();
      await userEvent.clear(canvas.getByLabelText('場所名'));
      await userEvent.type(canvas.getByLabelText('場所名'), '地下天文台');
      await userEvent.click(canvas.getByRole('button', { name: 'Locationを登録' }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('未定義場所は仮扱い');
      await expect(canvas.getByRole('table', { name: 'Location候補テーブル' })).toHaveTextContent('地下天文台');
      await expect(canvas.getByTestId('summary-counts')).toHaveTextContent('Location 2件');
    });
  },
};

export const USAS03ControlChaptersAndBeats: Story = {
  name: 'US-AS03: 章・ビート単位で制御したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, 'Chapter / Beat');
    await step('Beatテーブルから追加ダイアログを開き、現在のChapterとBeatを追加する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '新規Beat' }));
      await userEvent.clear(canvas.getByLabelText('Chapter'));
      await userEvent.type(canvas.getByLabelText('Chapter'), 'Chapter 3: 地下天文台');
      await userEvent.click(canvas.getByRole('button', { name: 'Beatを固定' }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('次のビートへ進みません');
      await expect(canvas.getByRole('table', { name: 'Beatテーブル' })).toHaveTextContent('Chapter 3');
      await expect(canvas.getByTestId('summary-counts')).toHaveTextContent('Beat 2件');
    });
  },
};

export const USAS04SetBeatConstraints: Story = {
  name: 'US-AS04: ビートごとに必須条件と禁止事項を設定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, 'Chapter / Beat');
    await step('Entry/Exit条件と禁止事項をダイアログで追加し、テーブルで確認する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '新規Beat' }));
      await userEvent.clear(canvas.getByLabelText('禁止事項'));
      await userEvent.type(canvas.getByLabelText('禁止事項'), '黒幕の名前をまだ出さない');
      await userEvent.click(canvas.getByRole('button', { name: 'Beatを固定' }));
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('未達条件');
      await expect(canvas.getByRole('table', { name: 'Beatテーブル' })).toHaveTextContent('黒幕の名前をまだ出さない');
    });
  },
};

export const USAS05DefineHiddenBrief: Story = {
  name: 'US-AS05: プレイヤーに見せない裏要約を定義したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, 'HiddenBrief');
    await step('HiddenBriefテーブルから追加ダイアログを開き、非公開の真相を項目登録する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '新規HiddenBrief' }));
      await userEvent.clear(canvas.getByLabelText('HiddenBrief'));
      await userEvent.type(canvas.getByLabelText('HiddenBrief'), '鐘楼の主は主人公の未来の姿。');
      await userEvent.click(canvas.getByRole('button', { name: '非公開情報を保存' }));
      await expect(canvas.getByRole('table', { name: 'HiddenBriefテーブル' })).toHaveTextContent('未来の姿');
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('HiddenBrief');
    });
  },
};

export const USAS06GateSecretReveal: Story = {
  name: 'US-AS06: 裏要約の情報に公開条件を設定したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, 'HiddenBrief');
    await step('公開条件を秘密ごとに設定し、テーブルで条件を確認する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '新規HiddenBrief' }));
      await userEvent.clear(canvas.getByLabelText('公開条件'));
      await userEvent.type(canvas.getByLabelText('公開条件'), '信頼値80以上、かつChapter 5到達');
      await userEvent.click(canvas.getByRole('button', { name: '非公開情報を保存' }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('示唆止まり');
      await expect(canvas.getByRole('table', { name: 'HiddenBriefテーブル' })).toHaveTextContent('信頼値80以上');
    });
  },
};

export const USAS07AutoRerouteDrift: Story = {
  name: 'US-AS07: AIが逸脱したら軌道修正してほしい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, '進行デバッグ');
    await step('登録済み候補を前提に誘導イベントを生成する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '誘導イベントを生成' }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('鐘楼へ戻します');
      await expect(canvas.getByTestId('correction-state')).toHaveTextContent('reroute');
    });
  },
};

export const USAS08GenerateMissingClue: Story = {
  name: 'US-AS08: 必須情報不足なら補完イベントを出してほしい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, '進行デバッグ');
    await step('手がかり不足を補完し、既存Castテーブルを優先使用する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '補完イベントを生成' }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('既存Castを優先使用');
      await expect(canvas.getByTestId('correction-state')).toHaveTextContent('clue');
    });
  },
};

export const USAS09ViewProgressState: Story = {
  name: 'US-AS09: 実行中の進行状態を確認したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, '進行デバッグ');
    await step('現在のChapter / Beat / 未達条件を作者向けに可視化する', async () => {
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Chapter 2');
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('未達条件');
    });
  },
};

export const USAS10TriggerForcedEvent: Story = {
  name: 'US-AS10: 条件で必ず発生するイベントを定義したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, '強制イベント');
    await step('強制イベントをテーブルへ複数登録し、条件達成時に発火対象にする', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '新規強制イベント' }));
      await userEvent.clear(canvas.getByLabelText('イベント名'));
      await userEvent.type(canvas.getByLabelText('イベント名'), '地下天文台の崩落');
      await userEvent.click(canvas.getByRole('button', { name: '強制イベントを登録' }));
      await expect(canvas.getByRole('table', { name: '強制イベントテーブル' })).toHaveTextContent('地下天文台の崩落');
      await goToPanel(canvas, '進行デバッグ');
      await userEvent.click(canvas.getByRole('button', { name: '条件付き強制イベントを発火' }));
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('必ず発火');
    });
  },
};

export const USAS11StartTestFromBeat: Story = {
  name: 'US-AS11: 途中のビートからテスト実行したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, 'テスト実行');
    await step('登録済みBeatを指定して条件を満たした扱いで開始する', async () => {
      await userEvent.clear(canvas.getByLabelText('テスト開始地点'));
      await userEvent.type(canvas.getByLabelText('テスト開始地点'), 'Chapter 4 / Beat 4-1');
      await userEvent.click(canvas.getByRole('button', { name: 'この地点からテスト開始' }));
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Chapter 4 / Beat 4-1');
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('テストセッション');
    });
  },
};

export const USAS12InspectAiReferences: Story = {
  name: 'US-AS12: AIが参照している非公開情報を把握したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await goToPanel(canvas, '進行デバッグ');
    await step('HiddenBrief / Canon / 現在Beatの参照状況を登録件数つきで確認する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '参照情報を更新' }));
      await expect(canvas.getByTestId('debug-refs')).toHaveTextContent('AI参照状況');
      await expect(canvas.getByTestId('debug-refs')).toHaveTextContent('HiddenBrief 1件');
      await expect(canvas.getByTestId('advanced-notice')).toHaveTextContent('プレイヤー向けUIでは表示されません');
    });
  },
};
