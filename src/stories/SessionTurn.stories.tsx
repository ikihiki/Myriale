import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import { SessionTurn } from '../shared/SessionTurn';
import '../styles.css';

/**
 * SessionTurn は、AI対話プレイ（プレイヤー入力 → AI Narrative）と
 * プログラム主導シーン（確定事実 → AI Narrative）の両方で使う共通の
 * ターン表示コンポーネントです。`lead`（先頭ブロック）の `tone` と
 * `leadPosition` を変えるだけで、同じコンポーネントが両方のモードを表現します。
 */
const meta = {
  title: 'Shared/SessionTurn',
  component: SessionTurn,
  parameters: {
    layout: 'padded',
    notes:
      'AI対話プレイとプログラム主導シーンで共有するターン表示コンポーネント。lead.tone（player / program）と leadPosition（before / after）で両モードを切り替えます。',
  },
  decorators: [
    (Story) => (
      <div className="scenario-forge session-play-wireframe" style={{ display: 'block', padding: 16, background: '#efe6d2' }}>
        <div className="dialogue-log" style={{ maxHeight: 'none' }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof SessionTurn>;

export default meta;
type Story = StoryObj<typeof meta>;

// US-P02/P03 相当: AI対話プレイのターン（Narrative が先、プレイヤー入力が後）。
export const AiDialogueTurn: Story = {
  name: 'AI対話: プレイヤー入力 → AI Narrative',
  args: {
    kicker: 'Turn 02',
    title: '銀の鍵を確かめる',
    narrative:
      '鍵の柄には、星座ではなく空白の円が刻まれていた。指でなぞると、水面にまだ開いていない扉の輪郭が一瞬だけ浮かぶ。',
    narrativeTestId: 'demo-narrative',
    leadPosition: 'after',
    lead: {
      tone: 'player',
      tag: '⟶',
      srLabel: 'プレイヤーの入力: ',
      text: '懐の銀の鍵を取り出して刻印を見る',
      testId: 'demo-lead',
    },
    headingActions: <button type="button">ここまで戻る</button>,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('プレイヤー入力（lead）とAI Narrativeが同じコンポーネントで表示される', async () => {
      await expect(canvas.getByTestId('demo-lead')).toHaveTextContent('銀の鍵を取り出して刻印を見る');
      await expect(canvas.getByTestId('demo-lead')).toHaveClass('lead-player');
      await expect(canvas.getByTestId('demo-narrative')).toHaveTextContent('空白の円');
    });
    await step('AI対話では Narrative が先、プレイヤー入力が後に並ぶ', async () => {
      const article = canvas.getByRole('article');
      const narrative = canvas.getByTestId('demo-narrative');
      const lead = canvas.getByTestId('demo-lead');
      // DOM順で narrative が lead より前にある（leadPosition="after"）。
      await expect(article.compareDocumentPosition(lead) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      await expect(narrative.compareDocumentPosition(lead) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  },
};

// US-PG03/PG07 相当: プログラム主導のターン（確定事実が先、AI Narrative が後）。
export const ProgramDrivenTurn: Story = {
  name: 'プログラム主導: 確定事実 → AI Narrative',
  args: {
    ariaLabel: 'ログ 3',
    variantClassName: 'turn-battle',
    leadPosition: 'before',
    lead: {
      tone: 'program',
      tag: 'PROGRAM',
      text: '行動「スキル」確定: 与ダメージ12 / 被ダメージ4 → 敵HP 12 / 自HP 26',
      testId: 'demo-fact',
    },
    narrative: 'あなたのスキルが決まり、書架番の装甲がきしむ。冷たい火花が散った。',
    narrativeTag: 'AI',
    narrativeTestId: 'demo-narrative',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('確定事実（lead）は PROGRAM タグ付きで、AI Narrative は AI タグ付き', async () => {
      await expect(canvas.getByTestId('demo-fact')).toHaveClass('lead-program');
      await expect(canvas.getByTestId('demo-fact')).toHaveTextContent('与ダメージ12');
      await expect(canvas.getByTestId('demo-narrative')).toHaveTextContent('装甲がきしむ');
    });
    await step('プログラム主導では確定事実が先、AI Narrative が後に並ぶ', async () => {
      const fact = canvas.getByTestId('demo-fact');
      const narrative = canvas.getByTestId('demo-narrative');
      // DOM順で fact が narrative より前にある（leadPosition="before"）。
      await expect(fact.compareDocumentPosition(narrative) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
    await step('モードに応じたアクセント（turn-battle）が付く', async () => {
      await expect(canvas.getByRole('article')).toHaveClass('turn-battle');
    });
  },
};

// lead なし（Narrative のみ）のターン。導入や強制イベントの自動再生など。
export const NarrativeOnlyTurn: Story = {
  name: 'Narrativeのみ（入力・事実なし）',
  args: {
    kicker: 'Turn 01',
    title: '水没した閲覧室で目覚める',
    narrative:
      'あなたは水没した閲覧室で目を覚ます。膝まで届く黒い水の上を星図灯の光が揺れ、崩れた書架の奥から誰かの咳払いが聞こえる。',
    narrativeTestId: 'demo-narrative',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('lead を渡さなければ Narrative だけが表示される', async () => {
      await expect(canvas.getByTestId('demo-narrative')).toHaveTextContent('水没した閲覧室');
      await expect(canvas.getByRole('article').querySelector('.session-turn-lead')).toBeNull();
    });
  },
};

// 選択中（selected）状態。AI見出しジャンプや巻き戻し地点の強調に使う。
export const SelectedTurn: Story = {
  name: '選択中（selected）',
  args: {
    kicker: 'Turn 08',
    title: '螺旋階段へ向かう',
    narrative: '星図灯を掲げると、螺旋階段の先で同じ光がひとつ、応えるように灯った。',
    narrativeTestId: 'demo-narrative',
    selected: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('selected を渡すと selected クラスが付く', async () => {
      await expect(canvas.getByRole('article')).toHaveClass('session-turn selected');
    });
  },
};
