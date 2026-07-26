import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ScenarioCondition } from '../../../../app/scenarioApi';
import { ConditionTablePresentation } from './ConditionTablePresentation';

const stateFields = [{ code: 'open', label: '開いている', valueType: 'boolean' as const, defaultValue: 'false', visibility: 'public' as const }];

function Harness() {
  const [value, setValue] = useState<ScenarioCondition>({ kind: 'comparison', operator: 'eq', source: 'state', path: 'open', valueType: 'boolean', value: false });
  return <><ConditionTablePresentation label="実行条件" value={value} onChange={setValue} stateFields={stateFields} /><output data-testid="condition">{JSON.stringify(value)}</output></>;
}

afterEach(() => cleanup());

describe('ConditionTablePresentation', () => {
  it('summarizes a condition and edits nested AND children in a layer 2 pane', () => {
    render(<Harness />);
    const table = screen.getByRole('table', { name: '実行条件 table' });
    expect(table).toHaveTextContent('状態：open ＝');
    expect(table).toHaveTextContent('false');

    fireEvent.click(within(table).getByRole('button', { name: 'ルートの実行条件を編集' }));
    const pane = screen.getByRole('dialog', { name: '実行条件を編集' });
    expect(pane).toHaveAttribute('data-layer', '2');
    fireEvent.click(within(pane).getByRole('combobox', { name: '実行条件の条件種別' }));
    fireEvent.click(screen.getByRole('option', { name: 'すべて成立（AND）' }));
    fireEvent.click(within(pane).getByRole('button', { name: '子条件を追加' }));
    expect(within(pane).getAllByRole('listitem')).toHaveLength(2);
    fireEvent.click(within(pane).getByRole('button', { name: '実行条件の編集を完了' }));

    expect(table).toHaveTextContent('すべて成立（AND）');
    expect(table).toHaveTextContent('AND 1');
    expect(table).toHaveTextContent('AND 2');
    expect(screen.getByTestId('condition')).toHaveTextContent('"operator":"and"');
  });

  it('renders NOT, IN, EXISTS, OR, and always as understandable rows', () => {
    const value: ScenarioCondition = { kind: 'group', operator: 'or', children: [
      { kind: 'always' },
      { kind: 'in', source: 'arguments', path: 'key', valueType: 'string', values: ['red', 'blue'] },
      { kind: 'exists', source: 'session.flags', path: 'seen' },
      { kind: 'not', child: { kind: 'comparison', operator: 'ne', source: 'state', path: 'open', valueType: 'boolean', value: true } },
    ] };
    render(<ConditionTablePresentation label="実行条件" value={value} onChange={() => undefined} stateFields={stateFields} />);
    const table = screen.getByRole('table', { name: '実行条件 table' });
    expect(table).toHaveTextContent('いずれか成立（OR）');
    expect(table).toHaveTextContent('常に成立');
    expect(table).toHaveTextContent('アクション引数：key が候補のいずれか');
    expect(table).toHaveTextContent('「red」, 「blue」');
    expect(table).toHaveTextContent('セッションフラグ：seen が存在');
    expect(table).toHaveTextContent('否定（NOT）');
  });

  it('keeps unsupported conditions lossless and read-only', () => {
    const value: ScenarioCondition = { kind: 'unsupported', canonical: { op: 'future', path: 'state.open' } };
    render(<ConditionTablePresentation label="実行条件" value={value} onChange={() => undefined} stateFields={[]} />);
    const table = screen.getByRole('table', { name: '実行条件 table' });
    expect(table).toHaveTextContent('未対応の条件');
    expect(table).toHaveTextContent('内容を変更せず保持');
    expect(within(table).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('内容を変更せず保存します');
  });
});
