import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import type { ScenarioCondition } from '../app/scenarioApi';
import { ConditionTablePresentation } from '../features/scenario/@components/rule-data/ConditionTablePresentation';
import '../styles.css';

const stateFields = [{ code: 'open', label: '開いている', valueType: 'boolean' as const, defaultValue: 'false', visibility: 'public' as const }];

function EditableConditionStory() {
  const [condition, setCondition] = useState<ScenarioCondition>({ kind: 'comparison', operator: 'eq', source: 'state', path: 'open', valueType: 'boolean', value: false });
  return <div className="max-w-3xl p-6"><ConditionTablePresentation label="実行条件" value={condition} onChange={setCondition} stateFields={stateFields} /></div>;
}

const meta = {
  title: 'シナリオ/実行条件テーブル',
  component: ConditionTablePresentation,
} satisfies Meta<typeof ConditionTablePresentation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditNestedCondition: Story = {
  args: { label: '実行条件', value: { kind: 'always' }, stateFields, onChange: () => undefined },
  render: () => <EditableConditionStory />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await step('実行条件の要約をテーブルで確認する', async () => {
      await expect(canvas.getByRole('table', { name: '実行条件 table' })).toHaveTextContent('状態：open ＝');
    });
    await step('nested EditPaneでAND条件を追加し、閉じた後の要約を更新する', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'ルートの実行条件を編集' }));
      const pane = screen.getByRole('dialog', { name: '実行条件を編集' });
      await expect(pane).toHaveAttribute('data-layer', '2');
      await userEvent.click(within(pane).getByRole('combobox', { name: '実行条件の条件種別' }));
      await userEvent.click(await screen.findByRole('option', { name: 'すべて成立（AND）' }));
      await userEvent.click(within(pane).getByRole('button', { name: '子条件を追加' }));
      await userEvent.click(within(pane).getByRole('button', { name: '実行条件の編集を完了' }));
      await expect(canvas.getByRole('table', { name: '実行条件 table' })).toHaveTextContent('AND 2');
    });
  },
};

export const UnsupportedConditionIsReadOnly: Story = {
  args: {
    label: '実行条件',
    value: { kind: 'unsupported', canonical: { op: 'future', path: 'state.open', value: true } },
    onChange: () => undefined,
    stateFields,
  },
  render: (args) => <div className="max-w-3xl p-6"><ConditionTablePresentation {...args} /></div>,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('未対応conditionをlossless read-only行として説明する', async () => {
      const table = canvas.getByRole('table', { name: '実行条件 table' });
      await expect(table).toHaveTextContent('未対応の条件');
      await expect(table).toHaveTextContent('内容を変更せず保持');
      await expect(within(table).queryByRole('button')).not.toBeInTheDocument();
      await expect(canvas.getByRole('note')).toHaveTextContent('内容を変更せず保存します');
    });
  },
};
