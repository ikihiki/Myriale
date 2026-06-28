import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { WizardNavigation } from '../shared/WizardNavigation';
import '../styles.css';

const meta: Meta = {
  title: 'コンポーネント/WizardNavigation',
  parameters: {
    layout: 'centered',
    notes: 'ウィザード画面の左レールを共通化したコンポーネントです。狭い幅ではdetailsとして折りたたみ、縦積み時に本文を押し下げすぎないようにします。',
  },
  decorators: [
    (Story) => (
      <div className="scenario-forge scenario-forge-wizard" style={{ minHeight: 420, width: 'min(980px, 92vw)' }}>
        <Story />
        <main className="forge-paper wizard-paper" aria-label="Story本文">
          <p className="kicker">Wizard navigation sample</p>
          <div className="wizard-progress" aria-label="サンプル進捗">
            <span>02</span>
            <strong>本文領域</strong>
            <small>ナビゲーションの横に来る紙面です。</small>
          </div>
        </main>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

const items = [
  { id: 'cover', label: '01 / 表紙', meta: 'Draft保存のための最小入力', ariaLabel: '表紙へ' },
  { id: 'lore', label: '02 / 世界の掟', meta: 'ジャンル、雰囲気、Lore', ariaLabel: '世界の掟へ' },
  { id: 'ai', label: '03 / AI裁量', meta: 'AIが広げてよい範囲', ariaLabel: 'AI裁量へ' },
  { id: 'opening', label: '04 / 第一場面', meta: '最初のNarrativeの固定', ariaLabel: '第一場面へ' },
];

export const Default: Story = {
  name: 'Default — 左レールのウィザードナビ',
  render: function Render() {
    const [active, setActive] = useState('lore');
    return (
      <WizardNavigation
        title="契約の背表紙"
        ariaLabel="登録ウィザードのステップ"
        help="ステップを選ぶと紙面側の入力内容が切り替わります。"
        items={items}
        activeId={active}
        onSelect={setActive}
        markerLabel="ScenarioId"
        markerValue="SCN-DRAFT-042"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'AI裁量へ' }));
    await expect(canvas.getByRole('button', { name: 'AI裁量へ' })).toHaveAttribute('aria-current', 'step');
  },
};

export const NarrowCollapsed: Story = {
  name: 'Narrow — 縦積み時は折りたたみ',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [
    (Story) => (
      <div className="scenario-forge scenario-forge-wizard" style={{ minHeight: 420, width: 360 }}>
        <Story />
        <main className="forge-paper wizard-paper" aria-label="狭幅Story本文">
          <p className="kicker">Compact layout</p>
          <div className="wizard-progress" aria-label="狭幅進捗">
            <span>02</span>
            <strong>本文を優先</strong>
            <small>ナビは必要な時だけ開きます。</small>
          </div>
        </main>
      </div>
    ),
  ],
  render: function Render() {
    const [active, setActive] = useState('lore');
    return (
      <WizardNavigation
        title="Session Flow"
        ariaLabel="狭幅ウィザードのステップ"
        help="狭い画面で開いたときだけステップ一覧を表示します。"
        items={items}
        activeId={active}
        onSelect={setActive}
        markerLabel="SessionId"
        markerValue="SES-READY-019"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Session Flow')).toBeVisible();
    await userEvent.click(canvas.getByText('Session Flow'));
    await userEvent.click(canvas.getByRole('button', { name: '第一場面へ' }));
    await expect(canvas.getByRole('button', { name: '第一場面へ' })).toHaveAttribute('aria-current', 'step');
  },
};
