import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { westDoorAuthoringFixture } from '../../../../stories/scenario-registration-page/scenarioRegistrationFixtures';
import { LocationsObjectsEditorPresentation } from './LocationsObjectsEditorPresentation';
import { ObjectTypesEditorPresentation } from './ObjectTypesEditorPresentation';
import type { ScenarioRuleData } from './scenarioRuleDataModel';

function TypeHarness() {
  const [value, setValue] = useState<ScenarioRuleData>(() => structuredClone(westDoorAuthoringFixture));
  const [notice, setNotice] = useState('');
  return <><ObjectTypesEditorPresentation mode="edit" value={value} onChange={setValue} onNotice={setNotice} /><output data-testid="rule-data-json">{JSON.stringify(value)}</output><output data-testid="rule-notice">{notice}</output></>;
}

function ObjectHarness() {
  const [value, setValue] = useState<ScenarioRuleData>(() => structuredClone(westDoorAuthoringFixture));
  return <><LocationsObjectsEditorPresentation value={value} onChange={setValue} onNotice={() => undefined} /><output data-testid="rule-data-json">{JSON.stringify(value)}</output></>;
}

function MixinHarness({ emptyTypes = false }: { emptyTypes?: boolean }) {
  const [value, setValue] = useState<ScenarioRuleData>(() => {
    const fixture = structuredClone(westDoorAuthoringFixture);
    fixture.objects[0].mixinTypeCodes = emptyTypes ? [] : [fixture.objectTypes[0].code];
    if (emptyTypes) fixture.objectTypes = [];
    return fixture;
  });
  return <><LocationsObjectsEditorPresentation value={value} onChange={setValue} onNotice={() => undefined} /><output data-testid="rule-data-json">{JSON.stringify(value)}</output></>;
}

afterEach(() => cleanup());

describe('strict v2 rule authoring', () => {
  it('edits a Type generic rule without Object-specific execution UI', async () => {
    render(<TypeHarness />);
    fireEvent.click(screen.getByRole('button', { name: '開閉可能を編集' }));
    expect(screen.getByRole('heading', { name: 'Type generic rules' })).toBeVisible();
    expect(screen.queryByText('Object個別')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'generic-open generic ruleを編集' }));
    expect(screen.getByLabelText('実行ルールのstable code')).toHaveValue('generic-open');
    expect((screen.getByLabelText('実行ルールのcondition JSON') as HTMLTextAreaElement).value).toContain('state.open');
    fireEvent.change(screen.getByLabelText('実行ルールの優先度'), { target: { value: '175' } });
    fireEvent.click(screen.getByRole('button', { name: 'bindingを追加' }));
    fireEvent.change(screen.getByLabelText('module binding id'), { target: { value: 'door-module' } });
    await waitFor(() => expect(screen.getByTestId('rule-data-json')).toHaveTextContent('"priority":175'));
    expect(screen.getByTestId('rule-data-json')).toHaveTextContent('door-module');
  });

  it('cascades action and generic rule code renames and blocks referenced rule deletion', async () => {
    render(<TypeHarness />);
    fireEvent.click(screen.getByRole('button', { name: '出口の扉を編集' }));
    fireEvent.click(screen.getByRole('button', { name: '扉を開けて外へ出るを編集' }));
    fireEvent.change(screen.getByLabelText('Type generic configuration action code 1'), { target: { value: 'leave-through-door' } });
    await waitFor(() => expect(screen.getByTestId('rule-data-json')).toHaveTextContent('"actionCode":"leave-through-door"'));
    fireEvent.click(screen.getByRole('button', { name: 'アクションの編集を完了' }));
    fireEvent.click(screen.getByRole('button', { name: 'generic-open-and-exit generic ruleを編集' }));
    fireEvent.change(screen.getByLabelText('実行ルールのstable code'), { target: { value: 'generic-leave' } });
    await waitFor(() => expect(screen.getByTestId('rule-data-json')).toHaveTextContent('"targetRuleCode":"generic-leave"'));
    fireEvent.click(screen.getByRole('button', { name: 'この実行ルールを削除' }));
    expect(screen.getByTestId('rule-notice')).toHaveTextContent('Object rule operation');
  });

  it('shows effective source/state and starts adjust with per-field inheritance controls', async () => {
    render(<ObjectHarness />);
    fireEvent.click(screen.getByRole('button', { name: '西の扉を編集' }));
    expect(screen.getByRole('heading', { name: 'Effective rules' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'inherited' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'overridden' })).toBeVisible();
    fireEvent.click(screen.getAllByRole('button', { name: 'adjust' })[0]);
    expect(screen.getByRole('heading', { name: '調整するfield' })).toBeVisible();
    expect(screen.getByLabelText('conditionをadjust')).not.toBeChecked();
    expect(screen.getByLabelText('priorityをadjust')).toBeChecked();
    fireEvent.change(screen.getByLabelText('実行ルールの優先度'), { target: { value: '250' } });
    await waitFor(() => expect(screen.getByTestId('rule-data-json')).toHaveTextContent('"adjustments":{"priority":250}'));
  });

  it('searches Type mixins in a nested pane, marks existing Types, and appends without losing Object local data', async () => {
    render(<MixinHarness />);
    fireEvent.click(screen.getByRole('button', { name: '西の扉を編集' }));
    const mixinRegion = screen.getByRole('region', { name: 'ordered Type mixins' });
    expect(within(mixinRegion).queryByRole('combobox', { name: 'Type mixinを追加' })).not.toBeInTheDocument();
    fireEvent.click(within(mixinRegion).getByRole('button', { name: 'Type mixinを追加' }));

    const searchPane = await screen.findByRole('dialog', { name: '追加するType mixinを選ぶ' });
    expect(searchPane).toHaveAttribute('data-layer', '1');
    const search = within(searchPane).getByRole('searchbox', { name: '種類を検索' });
    await waitFor(() => expect(search).toHaveFocus());
    expect(within(searchPane).getByRole('button', { name: '開閉可能は追加済み' })).toBeDisabled();

    fireEvent.change(search, { target: { value: 'EXIT-DOOR' } });
    expect(within(searchPane).getByRole('cell', { name: /^出口の扉$/ })).toBeVisible();
    expect(within(searchPane).getByRole('cell', { name: '開閉状態を持ち、外へ出るための扉。' })).toBeVisible();
    fireEvent.change(search, { target: { value: 'missing' } });
    expect(within(searchPane).getByRole('status')).toHaveTextContent('検索条件に一致するTypeはありません');
    fireEvent.change(search, { target: { value: '外へ出る' } });
    fireEvent.click(within(searchPane).getByRole('button', { name: '出口の扉を追加' }));

    await waitFor(() => expect(screen.queryByRole('dialog', { name: '追加するType mixinを選ぶ' })).not.toBeInTheDocument());
    expect(mixinRegion.textContent?.indexOf('開閉可能')).toBeLessThan(mixinRegion.textContent?.indexOf('出口の扉') ?? -1);
    const saved = JSON.parse(screen.getByTestId('rule-data-json').textContent ?? '{}') as ScenarioRuleData;
    expect(saved.objects[0].mixinTypeCodes).toEqual(['openable', 'exit-door']);
    expect(saved.objects[0].stateFields).toEqual(westDoorAuthoringFixture.objects[0].stateFields);
    expect(saved.objects[0].actions).toEqual(westDoorAuthoringFixture.objects[0].actions);
    expect(saved.objects[0].actionRules).toEqual(westDoorAuthoringFixture.objects[0].actionRules);

    fireEvent.click(within(mixinRegion).getByRole('button', { name: 'Type mixinを追加' }));
    expect(await screen.findByRole('button', { name: '出口の扉は追加済み' })).toBeDisabled();
  });

  it('shows a dedicated empty state when no Type exists', async () => {
    render(<MixinHarness emptyTypes />);
    fireEvent.click(screen.getByRole('button', { name: '西の扉を編集' }));
    fireEvent.click(screen.getByRole('button', { name: 'Type mixinを追加' }));
    const searchPane = await screen.findByRole('dialog', { name: '追加するType mixinを選ぶ' });
    expect(within(searchPane).getByRole('status')).toHaveTextContent('追加できるTypeがまだ登録されていません');
  });

  it('edits ordered effects on a local override operation', async () => {
    render(<ObjectHarness />);
    fireEvent.click(screen.getByRole('button', { name: '西の扉を編集' }));
    fireEvent.click(screen.getByRole('button', { name: 'generic-open-and-exit operationを編集' }));
    expect(screen.getByLabelText('実行ルールのアクション')).toHaveAttribute('readonly');
    fireEvent.change(screen.getByLabelText('5番目の出来事の名前'), { target: { value: 'player-left-building' } });
    fireEvent.click(screen.getByRole('button', { name: '8番目を上へ移動' }));
    await waitFor(() => expect(screen.getByLabelText('7番目の文章')).toHaveValue('扉は閉じたまま'));
    expect(screen.getByTestId('rule-data-json')).toHaveTextContent('player-left-building');
  });
});
