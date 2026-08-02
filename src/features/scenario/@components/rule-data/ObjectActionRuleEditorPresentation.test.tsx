import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { completeDoorRuleDataFixture, westDoorAuthoringFixture } from '../../../../stories/scenario-registration-page/scenarioRegistrationFixtures';
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

function AdjustHarness() {
  const [value, setValue] = useState<ScenarioRuleData>(() => structuredClone(completeDoorRuleDataFixture));
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
  it('edits a shared Markdown profile for an entity', async () => {
    render(<ObjectHarness />);
    fireEvent.click(screen.getByRole('button', { name: '西の扉を編集' }));
    const profile = screen.getByLabelText('エンティティプロフィール');
    expect((profile as HTMLTextAreaElement).value).toContain('西側の出口');
    fireEvent.change(profile, { target: { value: '## 外観\n\n青錆びた金属扉。\n\n## 描写指針\n\n開閉状態に従って描写する。' } });
    await waitFor(() => expect(screen.getByTestId('rule-data-json')).toHaveTextContent('青錆びた金属扉'));
  });

  it('flattens Type basics, states, actions, and execution rules without legacy wrapper labels', () => {
    render(<TypeHarness />);
    fireEvent.click(screen.getByRole('button', { name: '開閉可能を編集' }));
    const dialog = screen.getByRole('dialog', { name: '開閉可能' });
    const sections = ['基本情報', '状態', 'アクション', '実行ルール'].map((name) => within(dialog).getByRole('region', { name }));
    expect(sections.map((section) => section.parentElement)).toEqual(Array(4).fill(sections[0].parentElement));
    expect(new Set(sections.map((section) => section.className))).toHaveLength(1);
    expect(within(dialog).queryByText(/Type generic configuration|Type generic rules/)).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('region', { name: /Type generic/ })).not.toBeInTheDocument();
  });

  it('edits a Type execution rule without Object-specific execution UI', async () => {
    render(<TypeHarness />);
    fireEvent.click(screen.getByRole('button', { name: '開閉可能を編集' }));
    expect(screen.getByRole('heading', { name: '実行ルール' })).toBeVisible();
    expect(screen.queryByText('Object個別')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'generic-openの実行ルールを編集' }));
    expect(screen.getByLabelText('実行ルールのstable code')).toHaveValue('generic-open');
    const conditionTable = screen.getByRole('table', { name: '実行条件 table' });
    expect(conditionTable).toHaveTextContent('状態：open ＝');
    expect(screen.queryByLabelText('実行ルールのcondition JSON')).not.toBeInTheDocument();
    fireEvent.click(within(conditionTable).getByRole('button', { name: 'ルートの実行条件を編集' }));
    expect(screen.getByRole('dialog', { name: '実行条件を編集' })).toHaveAttribute('data-layer', '2');
    fireEvent.click(screen.getByRole('button', { name: '実行条件の編集を完了' }));
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
    fireEvent.change(screen.getByLabelText('アクション1のstable code'), { target: { value: 'leave-through-door' } });
    await waitFor(() => expect(screen.getByTestId('rule-data-json')).toHaveTextContent('"actionCode":"leave-through-door"'));
    fireEvent.click(screen.getByRole('button', { name: 'アクションの編集を完了' }));
    fireEvent.click(screen.getByRole('button', { name: 'generic-open-and-exitの実行ルールを編集' }));
    fireEvent.change(screen.getByLabelText('実行ルールのstable code'), { target: { value: 'generic-leave' } });
    await waitFor(() => expect(screen.getByTestId('rule-data-json')).toHaveTextContent('"targetRuleCode":"generic-leave"'));
    fireEvent.click(screen.getByRole('button', { name: 'この実行ルールを削除' }));
    expect(screen.getByTestId('rule-notice')).toHaveTextContent('Object rule operation');
  });

  it('shows inherited and local states/actions in one source-free table', () => {
    render(<ObjectHarness />);
    fireEvent.click(screen.getByRole('button', { name: '西の扉を編集' }));
    const states = screen.getByRole('table', { name: 'Object states' });
    const actions = screen.getByRole('table', { name: 'Object actions' });
    expect(within(states).getByRole('cell', { name: '開いている' })).toBeVisible();
    expect(within(states).getByRole('cell', { name: '方向' })).toBeVisible();
    expect(within(actions).getByRole('cell', { name: '開ける' })).toBeVisible();
    expect(within(actions).getByRole('cell', { name: '出口を確認する' })).toBeVisible();
    expect(within(states).queryByText(/mixin由来|Object固有|source/i)).not.toBeInTheDocument();
    expect(within(actions).queryByText(/mixin由来|Object固有|source/i)).not.toBeInTheDocument();
  });

  it('edits and resets only the inherited state initial value', async () => {
    render(<ObjectHarness />);
    fireEvent.click(screen.getByRole('button', { name: '西の扉を編集' }));
    const before = JSON.parse(screen.getByTestId('rule-data-json').textContent ?? '{}') as ScenarioRuleData;
    fireEvent.click(screen.getByRole('button', { name: 'openの状態を確認' }));
    expect(screen.getByText('このObjectでは初期値のみ変更できます。項目の定義はObject種類側で変更します。')).toBeVisible();
    expect(screen.queryByLabelText('Object state code')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('openの初期値'), { target: { value: 'true' } });
    await waitFor(() => expect(screen.getByTestId('rule-data-json')).toHaveTextContent('"initialStateOverrides":[{"stateCode":"open","value":"true"}]'));
    let saved = JSON.parse(screen.getByTestId('rule-data-json').textContent ?? '{}') as ScenarioRuleData;
    expect(saved.objectTypes).toEqual(before.objectTypes);
    expect(saved.objects[0].stateFields).toEqual(before.objects[0].stateFields);
    fireEvent.click(screen.getByRole('button', { name: '継承値へ戻す' }));
    saved = JSON.parse(screen.getByTestId('rule-data-json').textContent ?? '{}') as ScenarioRuleData;
    expect(saved.objects[0].initialStateOverrides).toEqual([]);
  });

  it('keeps inherited actions and non-add rules read-only while local entries remain editable', async () => {
    render(<ObjectHarness />);
    fireEvent.click(screen.getByRole('button', { name: '西の扉を編集' }));
    fireEvent.click(screen.getByRole('button', { name: 'openのアクションを確認' }));
    expect(screen.getByText('この項目の定義はObject種類側で変更します。')).toBeVisible();
    expect(screen.queryByLabelText('Object action code')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));

    fireEvent.click(screen.getByRole('button', { name: 'inspect-exitのアクションを確認' }));
    fireEvent.change(screen.getByLabelText('Object action label'), { target: { value: '出口を詳しく確認する' } });
    await waitFor(() => expect(screen.getByTestId('rule-data-json')).toHaveTextContent('出口を詳しく確認する'));
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));

    const originalOperations = structuredClone(westDoorAuthoringFixture.objects[0].actionRules);
    fireEvent.click(screen.getByRole('button', { name: 'exit-door:generic-open-and-exitの実行ルールを確認' }));
    expect(screen.getByText(/override \/ delete \/ adjustを開始することはできません/)).toBeVisible();
    expect(screen.queryByLabelText('実行ルールの優先度')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    fireEvent.click(screen.getByRole('button', { name: 'local:west-inspect-exitの実行ルールを確認' }));
    fireEvent.change(screen.getByLabelText('実行ルールの優先度'), { target: { value: '95' } });
    await waitFor(() => expect(screen.getByTestId('rule-data-json')).toHaveTextContent('"priority":95'));
    const saved = JSON.parse(screen.getByTestId('rule-data-json').textContent ?? '{}') as ScenarioRuleData;
    expect(saved.objects[0].actionRules[0]).toEqual(originalOperations[0]);
    expect(saved.objects[0].actionRules[1]).toMatchObject({ operation: 'add', rule: { priority: 95 } });
  });

  it('shows inherited conditions as a read-only table and edits an enabled adjust condition in a nested pane', async () => {
    render(<AdjustHarness />);
    fireEvent.click(screen.getByRole('button', { name: '北書庫の扉を編集' }));
    fireEvent.click(screen.getByRole('button', { name: 'archive-door:generic-openの実行ルールを確認' }));
    let table = screen.getByRole('table', { name: '実行条件 table' });
    expect(table).toHaveTextContent('状態：open ＝');
    expect(within(table).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('読み取り専用');

    fireEvent.click(screen.getByRole('button', { name: '条件を調整' }));
    table = screen.getByRole('table', { name: '調整後の実行条件 table' });
    fireEvent.click(within(table).getByRole('button', { name: 'ルートの実行条件を編集' }));
    expect(screen.getByRole('dialog', { name: '調整後の実行条件を編集' })).toHaveAttribute('data-layer', '2');
    fireEvent.click(screen.getByRole('combobox', { name: '調整後の実行条件の条件種別' }));
    fireEvent.click(screen.getByRole('option', { name: '常に成立' }));
    fireEvent.click(screen.getByRole('button', { name: '実行条件の編集を完了' }));
    await waitFor(() => expect(screen.getByTestId('rule-data-json')).toHaveTextContent('"condition":{"kind":"always"}'));
    expect(table).toHaveTextContent('常に成立');
  });

  it('searches Type mixins in a nested pane and appends without losing Object data', async () => {
    render(<MixinHarness />);
    fireEvent.click(screen.getByRole('button', { name: '西の扉を編集' }));
    const mixinRegion = screen.getByRole('region', { name: 'ordered Type mixins' });
    fireEvent.click(within(mixinRegion).getByRole('button', { name: 'Type mixinを追加' }));
    const searchPane = await screen.findByRole('dialog', { name: '追加するType mixinを選ぶ' });
    const search = within(searchPane).getByRole('searchbox', { name: '種類を検索' });
    expect(within(searchPane).getByRole('button', { name: '開閉可能は追加済み' })).toBeDisabled();
    fireEvent.change(search, { target: { value: '外へ出る' } });
    fireEvent.click(within(searchPane).getByRole('button', { name: '出口の扉を追加' }));
    const saved = JSON.parse(screen.getByTestId('rule-data-json').textContent ?? '{}') as ScenarioRuleData;
    expect(saved.objects[0].mixinTypeCodes).toEqual(['openable', 'exit-door']);
    expect(saved.objects[0].stateFields).toEqual(westDoorAuthoringFixture.objects[0].stateFields);
    expect(saved.objects[0].actions).toEqual(westDoorAuthoringFixture.objects[0].actions);
    expect(saved.objects[0].initialStateOverrides).toEqual(westDoorAuthoringFixture.objects[0].initialStateOverrides);
    expect(saved.objects[0].actionRules).toEqual(westDoorAuthoringFixture.objects[0].actionRules);
  });

  it('shows a dedicated empty state when no Type exists', async () => {
    render(<MixinHarness emptyTypes />);
    fireEvent.click(screen.getByRole('button', { name: '西の扉を編集' }));
    fireEvent.click(screen.getByRole('button', { name: 'Type mixinを追加' }));
    const searchPane = await screen.findByRole('dialog', { name: '追加するType mixinを選ぶ' });
    expect(within(searchPane).getByRole('status')).toHaveTextContent('追加できるTypeがまだ登録されていません');
  });

  it('blocks conflicted rows while leaving unrelated local rows editable', () => {
    const fixture = structuredClone(westDoorAuthoringFixture);
    fixture.objects[0].stateFields.push({ code: 'open', label: '競合するopen', valueType: 'string', defaultValue: '', visibility: 'public' });
    function ConflictHarness() {
      const [value, setValue] = useState<ScenarioRuleData>(() => structuredClone(fixture));
      return <LocationsObjectsEditorPresentation value={value} onChange={setValue} onNotice={() => undefined} />;
    }
    render(<ConflictHarness />);
    fireEvent.click(screen.getByRole('button', { name: '西の扉を編集' }));
    expect(screen.getByRole('alert', { name: 'Object configuration conflicts' })).toHaveTextContent('state open');
    expect(screen.getByRole('button', { name: 'openの状態を確認' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'directionの状態を確認' })).toBeEnabled();
  });

});
