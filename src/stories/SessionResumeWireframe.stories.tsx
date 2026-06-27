import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { SessionResumeWireframe } from '../SessionResumeWireframe';
import { STORY_IDS } from '../shared/nav';
import '../styles.css';

const meta = {
  title: 'Session resume/Wireframe from user stories',
  component: SessionResumeWireframe,
  parameters: {
    notes: 'docs/user-stories/session-resume.md の各ユーザーストーリー（US-R01〜R08）を、Storybook Interactions の step と expect で操作説明できるワイヤーフレームにしたものです。',
  },
} satisfies Meta<typeof SessionResumeWireframe>;

export default meta;
type Story = StoryObj<typeof meta>;

const STAR_LIBRARY = '星喰いの地下図書館';
const ASH_STATION = '灰の駅と宛名のない切符';

/** 一覧カードの「再開」ボタンから対象Sessionを選び、再開前確認画面へ進む。 */
const selectFromList = async (canvas: ReturnType<typeof within>, title: string) => {
  await userEvent.click(canvas.getByRole('button', { name: `${title}を再開` }));
};

export const USR01ResumeFromLastState: Story = {
  name: 'US-R01: 中断したセッションを再開したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('中断中のSession一覧が表示され、Suspended状態であることが分かる', async () => {
      await expect(canvas.getByRole('region', { name: '中断中のセッション' })).toBeVisible();
      await expect(canvas.getByTestId('session-list')).toHaveTextContent(STAR_LIBRARY);
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Suspended');
    });
    await step('Sessionを選ぶと、最終状態から再開できることが示される', async () => {
      await selectFromList(canvas, STAR_LIBRARY);
      await expect(canvas.getByTestId('resume-notice')).toHaveTextContent('最終状態（Turn 6）から続きを遊べます');
      await expect(canvas.getByRole('region', { name: '再開前の確認' })).toBeVisible();
      await expect(canvas.getByTestId('summary-scenario')).toHaveTextContent(STAR_LIBRARY);
    });
  },
};

export const USR02ReviewRecapBeforeResume: Story = {
  name: 'US-R02: 再開前に前回のあらすじを確認したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('AI要約された「これまでのあらすじ」が表示される', async () => {
      await expect(canvas.getByTestId('recap')).toHaveTextContent('これまでのあらすじ（AI要約）');
      await expect(canvas.getByTestId('recap')).toHaveTextContent('水没した閲覧室で目覚め、銀の鍵');
    });
  },
};

export const USR03ShowProgress: Story = {
  name: 'US-R03: セッションの進行度を確認したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('ターン数とプレイ時間が進行度として表示される', async () => {
      await expect(canvas.getByTestId('progress')).toHaveTextContent('Turn 6');
      await expect(canvas.getByTestId('progress')).toHaveTextContent('3時間12分');
      await expect(canvas.getByTestId('summary-progress')).toHaveTextContent('Turn 6 / 3時間12分');
    });
  },
};

export const USR04RestoreAiContext: Story = {
  name: 'US-R04: AIが文脈を理解した状態で再開したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('再開時に復元されるAIコンテキストの内訳が示される', async () => {
      await expect(canvas.getByTestId('context')).toHaveTextContent('復元されるAIコンテキスト');
      await expect(canvas.getByTestId('context')).toHaveTextContent('Lorebook Canon');
      await expect(canvas.getByTestId('context')).toHaveTextContent('Session State（現在地: 螺旋階段の踊り場');
    });
  },
};

export const USR05ShowChangeNotices: Story = {
  name: 'US-R05: 再開前に注意点を確認したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('中断中に起きたScenario / AI設定の変更点が明示される', async () => {
      await expect(canvas.getByTestId('changes')).toHaveTextContent('Scenario変更');
      await expect(canvas.getByTestId('changes')).toHaveTextContent('AI設定変更');
    });
    await step('変更がないSessionでは「変更はありません」と示される', async () => {
      await userEvent.click(canvas.getByRole('button', { name: `${ASH_STATION} を選択` }));
      await expect(canvas.getByTestId('changes')).toHaveTextContent('変更はありません');
    });
  },
};

export const USR06ConfirmAndResume: Story = {
  name: 'US-R06: 確認後にセッションを再開したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('確認後の再開は、Session play dialogue（プレイ画面）への導線として用意される', async () => {
      // 再開＝Activeなプレイ画面への遷移。押すと navigateToStory(playSession) で
      // Session play dialogue ストーリーへ移動するため、play内ではクリックしない
      // （クリックすると別ストーリーへ遷移してこのplay自体が中断される）。
      const resumeButton = canvas.getByRole('button', { name: '確認したので再開する（プレイ画面へ）' });
      await expect(resumeButton).toBeVisible();
      // 遷移先が Session play dialogue（playSession）であることを確認する。
      await expect(STORY_IDS.playSession).toMatch(/^session-play-dialogue-/);
    });
  },
};

export const USR07ReviewLastNarrativeAfterResume: Story = {
  name: 'US-R07: 再開直後に直前の内容を確認したい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('再開前確認で、復元される全Turnのうち直前のNarrativeが何かを把握できる', async () => {
      // 直前の展開（最後のTurnのNarrative）は、あらすじ要約として確認できる。
      await expect(canvas.getByTestId('recap')).toHaveTextContent('螺旋階段の先で星図灯の在処を探している');
    });
    await step('再開直後の直前ターンの続きは、遷移先の Session play dialogue で確認できる', async () => {
      // 再開ボタンはプレイ画面への遷移導線。クリックは遷移を起こすため行わず、
      // 導線の存在と遷移先の妥当性だけを確認する。
      await expect(canvas.getByRole('button', { name: '確認したので再開する（プレイ画面へ）' })).toBeVisible();
      await expect(STORY_IDS.playSession).toMatch(/^session-play-dialogue-/);
    });
  },
};

export const USR08ReadOnlyReview: Story = {
  name: 'US-R08: 再開せずに閲覧だけしたい',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await selectFromList(canvas, STAR_LIBRARY);
    await step('「再開せずに読み返す」でReadOnlyモードに入り、状態はSuspendedのまま', async () => {
      await userEvent.click(canvas.getByRole('button', { name: '再開せずに読み返す（ReadOnly）' }));
      await expect(canvas.getByRole('region', { name: 'ReadOnly閲覧' })).toBeVisible();
      await expect(canvas.getByTestId('session-state')).toHaveTextContent('Suspended (ReadOnly)');
      await expect(canvas.getByTestId('readonly-note')).toHaveTextContent('選択肢や入力は無効');
    });
    await step('ReadOnlyでも全Turn（最初から直前まで）を読み返せる', async () => {
      const restored = canvas.getByTestId('restored-log');
      await expect(within(restored).getByTestId('restored-turn-1')).toHaveTextContent('水没した閲覧室で目を覚ます');
      await expect(within(restored).getByTestId('restored-turn-6')).toHaveTextContent('螺旋階段の踊り場で星図灯がひとつ灯り');
    });
    await step('ReadOnlyからでも、あらためてプレイ画面へ再開できる', async () => {
      // この再開ボタンも Session play dialogue への遷移導線。存在のみ確認する。
      await expect(canvas.getByRole('button', { name: '読み返したので再開する（プレイ画面へ）' })).toBeVisible();
      await expect(STORY_IDS.playSession).toMatch(/^session-play-dialogue-/);
    });
  },
};
