import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { SessionTurn, type TurnLeadTone } from '../shared/SessionTurn';
import { MyrialeToggle } from '../ui/MyrialeRadix';
import '../styles.css';

/**
 * SessionTurn は、AI対話プレイ（プレイヤー入力 → AI Narrative）と
 * プログラム主導シーン（確定事実 → AI Narrative）の両方で使う共通の
 * ターン表示コンポーネントです。どちらのモードでも「ユーザー入力 → その結果」の
 * 順で統一され、`lead`（先頭の入力/事実ブロック）の `tone` だけが異なります。
 *
 * - Playground: Controls タブから各プロパティをいじって表示を試せます。
 * - Samples: 代表的な使い方を並べたギャラリーです。
 */

/** ログ風の枠で1つ以上のターンを囲む共通デコレーター。 */
const inLog = (children: ReactNode) => (
  <div
    className="scenario-forge session-play-wireframe"
    style={{ display: 'block', padding: 16, background: '#efe6d2' }}
  >
    <div className="dialogue-log" style={{ maxHeight: 'none', display: 'grid', gap: 10 }}>
      {children}
    </div>
  </div>
);

/**
 * Playground 用のフラットな引数。`lead` はネストオブジェクトで Controls が
 * 効きにくいため、tone / tag / text に分解して操作できるようにする。
 */
type PlaygroundArgs = {
  narrative: string;
  narrativeTag?: string;
  selected: boolean;
  variant: 'none' | 'turn-dialogue' | 'turn-battle' | 'turn-roll' | 'turn-event';
  showLead: boolean;
  leadTone: TurnLeadTone;
  leadTag: string;
  leadText: string;
  showHeadingAction: boolean;
  showInterpretation: boolean;
  interpretationText: string;
};

const meta = {
  title: 'コンポーネント/SessionTurn',
  component: SessionTurn,
  parameters: {
    layout: 'padded',
    notes:
      'AI対話プレイとプログラム主導シーンで共有するターン表示コンポーネント。どちらも「ユーザー入力（lead） → その結果（AI Narrative）」の順で統一され、lead.tone（player / program）だけが異なります。',
  },
} satisfies Meta<typeof SessionTurn>;

export default meta;

/**
 * Playground — Controls でプロパティをいじって試すページ。
 */
export const Playground: StoryObj<PlaygroundArgs> = {
  name: 'Playground（Controls）',
  argTypes: {
    narrative: { control: 'text', description: 'AI Narrative（結果の本文）' },
    narrativeTag: { control: 'text', description: 'Narrative のタグチップ（例: AI）' },
    selected: { control: 'boolean', description: '選択中の強調表示' },
    variant: {
      control: 'select',
      options: ['none', 'turn-dialogue', 'turn-battle', 'turn-roll', 'turn-event'],
      description: 'モード別アクセント（variantClassName）',
    },
    showLead: { control: 'boolean', description: 'lead（入力/事実）ブロックを表示するか' },
    leadTone: {
      control: 'inline-radio',
      options: ['player', 'program'],
      description: 'lead の種類（player=プレイヤー入力 / program=確定事実）',
    },
    leadTag: { control: 'text', description: 'lead 先頭のタグ（例: ⟶ / PROGRAM）' },
    leadText: { control: 'text', description: 'lead の本文（入力テキスト/確定事実）' },
    showHeadingAction: { control: 'boolean', description: '見出しに操作ボタンを置くか' },
    showInterpretation: {
      control: 'boolean',
      description: 'プレイヤー入力(lead)の中に解釈トグルと解釈パネルを表示するか',
    },
    interpretationText: { control: 'text', description: 'lead 内に表示する解釈の本文' },
  },
  args: {
    narrative:
      '鍵の柄には、星座ではなく空白の円が刻まれていた。指でなぞると、水面にまだ開いていない扉の輪郭が一瞬だけ浮かぶ。',
    narrativeTag: '',
    selected: false,
    variant: 'none',
    showLead: true,
    leadTone: 'player',
    leadTag: '⟶',
    leadText: '懐の銀の鍵を取り出して刻印を見る',
    showHeadingAction: true,
    showInterpretation: true,
    interpretationText: '所持品確認として解釈しました。目的は銀の鍵の由来と使い道を知ることです。',
  },
  render: (args) =>
    inLog(
      <SessionTurn
        narrative={args.narrative}
        narrativeTag={args.narrativeTag || undefined}
        selected={args.selected}
        variantClassName={args.variant === 'none' ? '' : args.variant}
        headingActions={args.showHeadingAction ? <button type="button">ここまで戻る</button> : undefined}
        lead={
          args.showLead
            ? {
                tone: args.leadTone,
                tag: args.leadTag,
                srLabel: args.leadTone === 'player' ? 'プレイヤーの入力: ' : undefined,
                text: args.leadText,
                actions:
                  args.leadTone === 'player' && args.showInterpretation ? (
                    <MyrialeToggle className="interpretation-toggle" pressed>
                      ⌄ 解釈を隠す
                    </MyrialeToggle>
                  ) : undefined,
                detail:
                  args.leadTone === 'player' && args.showInterpretation ? (
                    <p className="interpretation">
                      <span className="interpretation-glyph" aria-hidden="true">⚙</span>
                      {args.interpretationText}
                    </p>
                  ) : undefined,
              }
            : undefined
        }
      />,
    ),
};

/**
 * Samples — 代表的な使い方を並べたギャラリー。
 */
export const Samples: StoryObj = {
  name: 'Samples（ギャラリー）',
  render: () =>
    inLog(
      <>
        <SessionTurn
          narrative="あなたは水没した閲覧室で目を覚ます。膝まで届く黒い水の上を星図灯の光が揺れ、崩れた書架の奥から誰かの咳払いが聞こえる。"
        />
        <SessionTurn
          headingActions={<button type="button">ここまで戻る</button>}
          lead={{
            tone: 'player',
            tag: '⟶',
            srLabel: 'プレイヤーの入力: ',
            text: '懐の銀の鍵を取り出して刻印を見る',
            actions: (
              <MyrialeToggle className="interpretation-toggle" pressed>
                ⌄ 解釈を隠す
              </MyrialeToggle>
            ),
            detail: (
              <p className="interpretation">
                <span className="interpretation-glyph" aria-hidden="true">⚙</span>
                所持品確認として解釈しました。目的は銀の鍵の由来と使い道を知ることです。
              </p>
            ),
          }}
          narrative="鍵の柄には、星座ではなく空白の円が刻まれていた。指でなぞると、水面にまだ開いていない扉の輪郭が一瞬だけ浮かぶ。"
        />
        <SessionTurn
          selected
          lead={{
            tone: 'player',
            tag: '⟶',
            srLabel: 'プレイヤーの入力: ',
            text: '星図灯を掲げて螺旋階段をのぼる',
          }}
          narrative="星図灯を掲げると、螺旋階段の先で同じ光がひとつ、応えるように灯った。"
        />
        <SessionTurn
          ariaLabel="ログ battle"
          variantClassName="turn-battle"
          lead={{
            tone: 'program',
            tag: 'PROGRAM',
            text: '行動「スキル」確定: 与ダメージ12 / 被ダメージ4 → 敵HP 12 / 自HP 26',
          }}
          narrative="あなたのスキルが決まり、書架番の装甲がきしむ。冷たい火花が散った。"
          narrativeTag="AI"
        />
        <SessionTurn
          ariaLabel="ログ roll"
          variantClassName="turn-roll"
          lead={{
            tone: 'program',
            tag: 'PROGRAM',
            text: 'ダイス: d6 = 5（成功・しきい値4）',
          }}
          narrative="錆を噛んだ閂が砕け、扉が軋みながら開く。先へ進める。"
          narrativeTag="AI"
        />
      </>,
    ),
};
