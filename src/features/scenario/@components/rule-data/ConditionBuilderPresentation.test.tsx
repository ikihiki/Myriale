import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ScenarioCondition } from '../../../../app/scenarioApi';
import { ConditionBuilderPresentation } from './ConditionBuilderPresentation';

function Harness({ allowArguments = true }: { allowArguments?: boolean }) {
  const [value, setValue] = useState<ScenarioCondition>({ kind: 'always' });
  return <><ConditionBuilderPresentation label="条件" value={value} onChange={setValue} stateFields={[{ code: 'open', label: '開いている', valueType: 'boolean', defaultValue: 'false', visibility: 'public' }]} argumentFields={[{ code: 'key', label: '鍵', valueType: 'string', required: false }]} allowArguments={allowArguments} /><output data-testid="condition">{JSON.stringify(value)}</output></>;
}

afterEach(() => cleanup());

describe('ConditionBuilderPresentation', () => {
  it('builds and reorders nested groups without JSON input', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('combobox', { name: '条件の条件種別' }));
    fireEvent.click(screen.getByRole('option', { name: 'すべて成立（AND）' }));
    fireEvent.click(screen.getByRole('button', { name: '子条件を追加' }));
    expect(within(screen.getByRole('list', { name: '条件の子条件' })).getAllByRole('listitem')).toHaveLength(2);
    fireEvent.click(screen.getAllByRole('button', { name: '上へ' })[1]);
    expect(screen.queryByRole('textbox', { name: /JSON/i })).not.toBeInTheDocument();
  });

  it('does not offer arguments for availability conditions', () => {
    render(<Harness allowArguments={false} />);
    fireEvent.click(screen.getByRole('combobox', { name: '条件の条件種別' }));
    fireEvent.click(screen.getByRole('option', { name: '値を比較' }));
    fireEvent.click(screen.getByRole('combobox', { name: '条件のデータ元' }));
    expect(screen.queryByRole('option', { name: 'アクション引数' })).not.toBeInTheDocument();
  });

  it('shows unsupported AST read-only', () => {
    render(<ConditionBuilderPresentation label="条件" value={{ kind: 'unsupported', canonical: { op: 'future' } }} onChange={() => undefined} stateFields={[]} />);
    expect(screen.getByText('未対応の条件（内容を保持）')).toBeVisible();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
