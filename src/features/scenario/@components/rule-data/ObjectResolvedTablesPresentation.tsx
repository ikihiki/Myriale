import { useState } from 'react';
import { Button, Input, Textarea } from '../../../../components/ui';
import { EditPane } from '../../../../shared/EditPane';
import { MyrialeSelect } from '../../../../ui/MyrialeRadix';
import {
  createObjectAddRule,
  createStateField,
  createTypeAction,
  nextAuthoringCode,
  type EffectiveObjectRule,
  type ResolvedAction,
  type ResolvedStateField,
  type ScenarioActionRule,
  type ScenarioObject,
  type ScenarioRuleData,
  type ScenarioStateField,
  type ScenarioTypeAction,
} from './scenarioRuleDataModel';
import { ObjectActionRuleEditorPresentation } from './ObjectActionRuleEditorPresentation';
import { ConditionTablePresentation } from './ConditionTablePresentation';
import { ConditionBuilderPresentation } from './ConditionBuilderPresentation';
import { conditionSummary } from '../../../../app/scenarioConditionAdapters';

const tableClass = 'w-full min-w-[640px] border-collapse text-left text-sm';
const cellClass = 'border-b border-[#17151f]/10 px-3 py-3 align-middle';
const editorClass = 'grid content-start gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4';
type Selection = { kind: 'state' | 'action' | 'rule'; key: string } | null;

type Props = {
  value: ScenarioRuleData;
  object: ScenarioObject;
  states: ResolvedStateField[];
  actions: ResolvedAction[];
  rules: EffectiveObjectRule[];
  conflicts: Array<{ message: string }>;
  onChange: (object: ScenarioObject) => void;
  onNotice: (message: string, danger?: boolean) => void;
};

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-1"><span className="text-xs font-semibold text-myr-ink-subtle">{label}</span><span className="rounded-lg border border-[#17151f]/10 bg-[#17151f]/[.035] px-3 py-2">{value || '—'}</span></div>;
}

export function ObjectResolvedTablesPresentation({ value, object, states, actions, rules, conflicts, onChange, onNotice }: Props) {
  const [selection, setSelection] = useState<Selection>(null);
  const selectedState = selection?.kind === 'state' ? states.find((item) => item.code === selection.key) : undefined;
  const selectedAction = selection?.kind === 'action' ? actions.find((item) => item.code === selection.key) : undefined;
  const selectedRule = selection?.kind === 'rule' ? rules.find((item) => item.key === selection.key) : undefined;
  const selectedOperation = selectedRule?.operationIndex === null || selectedRule?.operationIndex === undefined ? undefined : object.actionRules[selectedRule.operationIndex];
  const selectedAdjustment = selectedOperation?.operation === 'adjust' ? selectedOperation : undefined;
  const selectedLocalRule = selectedOperation?.operation === 'add' ? selectedOperation : undefined;

  const replaceLocalState = (row: ResolvedStateField, patch: Partial<ScenarioStateField>) => {
    if (row.inherited || row.localIndex === null || row.conflict) return;
    const previousCode = object.stateFields[row.localIndex].code;
    const nextState = { ...object.stateFields[row.localIndex], ...patch };
    onChange({
      ...object,
      stateFields: object.stateFields.map((item, index) => index === row.localIndex ? nextState : item),
      initialStateOverrides: object.initialStateOverrides.map((item) => item.stateCode === previousCode ? { ...item, stateCode: nextState.code } : item),
      actions: object.actions,
    });
    if (patch.code) setSelection({ kind: 'state', key: patch.code });
  };
  const replaceLocalAction = (row: ResolvedAction, patch: Partial<ScenarioTypeAction>) => {
    if (row.inherited || row.localIndex === null || row.conflict) return;
    const previousCode = object.actions[row.localIndex].code;
    const nextAction = { ...object.actions[row.localIndex], ...patch };
    onChange({
      ...object,
      actions: object.actions.map((item, index) => index === row.localIndex ? nextAction : item),
      actionRules: object.actionRules.map((operation) => operation.operation === 'add' && operation.rule.actionCode === previousCode ? { ...operation, rule: { ...operation.rule, actionCode: nextAction.code } } : operation),
    });
    if (patch.code) setSelection({ kind: 'action', key: patch.code });
  };
  const setInitialOverride = (row: ResolvedStateField, nextValue: string) => {
    if (row.conflict) return;
    const without = object.initialStateOverrides.filter((item) => item.stateCode !== row.code);
    onChange({ ...object, initialStateOverrides: nextValue === '' || nextValue === row.baseInitialValue ? without : [...without, { stateCode: row.code, value: nextValue }] });
  };
  const addState = () => {
    const field = createStateField();
    onChange({ ...object, stateFields: [...object.stateFields, field] });
    setSelection({ kind: 'state', key: field.code });
  };
  const addAction = () => {
    const action = createTypeAction();
    onChange({ ...object, actions: [...object.actions, action] });
    setSelection({ kind: 'action', key: action.code });
  };
  const addRule = () => {
    const action = actions.find((item) => !item.conflict);
    if (!action) return onNotice('実行ルールを追加できるアクションがありません。', true);
    const operation = createObjectAddRule(action.code);
    onChange({ ...object, actionRules: [...object.actionRules, operation] });
    setSelection({ kind: 'rule', key: `local:${operation.rule.code}` });
  };
  const replaceLocalRule = (rule: ScenarioActionRule) => {
    if (!selectedLocalRule || selectedRule?.operationIndex === null || selectedRule?.operationIndex === undefined) return;
    onChange({ ...object, actionRules: object.actionRules.map((operation, index) => index === selectedRule.operationIndex ? { operation: 'add', rule } : operation) });
    setSelection({ kind: 'rule', key: `local:${rule.code}` });
  };
  const deleteLocalRule = () => {
    if (selectedRule?.operationIndex === null || selectedRule?.operationIndex === undefined) return;
    onChange({ ...object, actionRules: object.actionRules.filter((_, index) => index !== selectedRule.operationIndex) });
    setSelection(null);
  };

  return <section className="grid gap-5" aria-label="Object resolved configuration">
    {conflicts.length > 0 && <div role="alert" aria-label="Object configuration conflicts" className="grid gap-1 rounded-xl border border-[#a8324a]/35 bg-[#a8324a]/8 p-3 text-sm text-[#7b2337]"><strong>定義の競合を解消してください</strong>{conflicts.map((conflict) => <span key={conflict.message}>{conflict.message}</span>)}</div>}

    <section className="grid gap-2" aria-label="状態">
      <div className="flex items-center justify-between gap-2"><div><h3>状態</h3><p className="text-sm text-myr-ink-subtle">このObjectで利用できる状態と初期値です。</p></div><Button size="sm" variant="secondary" onClick={addState}>状態を追加</Button></div>
      <div className="overflow-x-auto rounded-xl border border-[#17151f]/12 bg-white/70"><table aria-label="Object states" className={tableClass}><thead><tr><th className={cellClass}>詳細</th><th className={cellClass}>表示名</th><th className={cellClass}>stable code</th><th className={cellClass}>型</th><th className={cellClass}>公開</th><th className={cellClass}>初期値</th></tr></thead><tbody>
        {states.map((row) => <tr key={row.code} aria-invalid={Boolean(row.conflict)}><td className={cellClass}><Button size="sm" variant="secondary" disabled={Boolean(row.conflict)} aria-label={`${row.code}の状態を確認`} onClick={() => setSelection({ kind: 'state', key: row.code })}>詳細</Button></td><td className={cellClass}><strong>{row.label}</strong>{row.conflict && <span className="block text-xs text-[#a8324a]">競合</span>}</td><td className={`${cellClass} font-mono text-xs`}>{row.code}</td><td className={cellClass}>{row.valueType}</td><td className={cellClass}>{row.visibility}</td><td className={cellClass}>{row.effectiveInitialValue}</td></tr>)}
      </tbody></table>{states.length === 0 && <p className="p-4 text-sm text-myr-ink-subtle">状態はありません。</p>}</div>
    </section>

    <section className="grid gap-2" aria-label="アクション">
      <div className="flex items-center justify-between gap-2"><div><h3>アクション</h3><p className="text-sm text-myr-ink-subtle">このObjectで利用できる操作契約です。</p></div><Button size="sm" variant="secondary" onClick={addAction}>アクションを追加</Button></div>
      <div className="overflow-x-auto rounded-xl border border-[#17151f]/12 bg-white/70"><table aria-label="Object actions" className={tableClass}><thead><tr><th className={cellClass}>詳細</th><th className={cellClass}>表示名</th><th className={cellClass}>stable code</th><th className={cellClass}>公開先</th><th className={cellClass}>引数</th></tr></thead><tbody>
        {actions.map((row) => <tr key={row.code} aria-invalid={Boolean(row.conflict)}><td className={cellClass}><Button size="sm" variant="secondary" disabled={Boolean(row.conflict)} aria-label={`${row.code}のアクションを確認`} onClick={() => setSelection({ kind: 'action', key: row.code })}>詳細</Button></td><td className={cellClass}><strong>{row.label}</strong>{row.conflict && <span className="block text-xs text-[#a8324a]">競合</span>}</td><td className={`${cellClass} font-mono text-xs`}>{row.code}</td><td className={cellClass}>{row.visibility}</td><td className={cellClass}>{row.argumentFields.length}件</td></tr>)}
      </tbody></table>{actions.length === 0 && <p className="p-4 text-sm text-myr-ink-subtle">アクションはありません。</p>}</div>
    </section>

    <section className="grid gap-2" aria-label="実行ルール">
      <div className="flex items-center justify-between gap-2"><div><h3>実行ルール</h3><p className="text-sm text-myr-ink-subtle">現在有効な結果と、保持されている無効な結果を確認します。</p></div><Button size="sm" variant="secondary" disabled={!actions.some((item) => !item.conflict)} onClick={addRule}>実行ルールを追加</Button></div>
      <div className="overflow-x-auto rounded-xl border border-[#17151f]/12 bg-white/70"><table aria-label="Object rules" className={tableClass}><thead><tr><th className={cellClass}>詳細</th><th className={cellClass}>qualified rule</th><th className={cellClass}>アクション</th><th className={cellClass}>優先度</th><th className={cellClass}>状態</th></tr></thead><tbody>
        {rules.map((row) => <tr key={row.key}><td className={cellClass}><Button size="sm" variant="secondary" aria-label={`${row.key}の実行ルールを確認`} onClick={() => setSelection({ kind: 'rule', key: row.key })}>詳細</Button></td><td className={`${cellClass} font-mono text-xs`}>{row.key}</td><td className={cellClass}>{actions.find((item) => item.code === row.rule.actionCode)?.label ?? row.rule.actionCode}</td><td className={cellClass}>{row.rule.priority}</td><td className={cellClass}>{row.state === 'deleted' ? '無効' : '有効'}</td></tr>)}
      </tbody></table>{rules.length === 0 && <p className="p-4 text-sm text-myr-ink-subtle">実行ルールはありません。</p>}</div>
    </section>

    <EditPane layer={1} open={Boolean(selectedState)} onOpenChange={(open) => { if (!open) setSelection(null); }} eyebrow="状態" title={selectedState?.label ?? '状態'} description={selectedState?.inherited ? 'このObjectでは初期値のみ変更できます。項目の定義はObject種類側で変更します。' : 'このObjectだけで使う状態の契約を編集します。'} footer={<Button onClick={() => setSelection(null)}>閉じる</Button>}>
      {selectedState && (selectedState.inherited ? <div className={editorClass}>
        <ReadOnlyValue label="stable code" value={selectedState.code} /><ReadOnlyValue label="表示名" value={selectedState.label} /><ReadOnlyValue label="型" value={selectedState.valueType} /><ReadOnlyValue label="公開" value={selectedState.visibility} /><ReadOnlyValue label="基本の初期値" value={selectedState.baseInitialValue} />
        <label>このObjectの初期値<Input aria-label={`${selectedState.code}の初期値`} value={selectedState.hasInitialOverride ? selectedState.effectiveInitialValue : ''} placeholder={selectedState.baseInitialValue} onChange={(event) => setInitialOverride(selectedState, event.target.value)} /></label>
        <Button size="sm" variant="text" disabled={!selectedState.hasInitialOverride} onClick={() => setInitialOverride(selectedState, '')}>継承値へ戻す</Button>
      </div> : <div className={editorClass}>
        <label>stable code<Input aria-label="Object state code" value={selectedState.code} onChange={(event) => replaceLocalState(selectedState, { code: event.target.value })} /></label>
        <label>表示名<Input aria-label="Object state label" value={selectedState.label} onChange={(event) => replaceLocalState(selectedState, { label: event.target.value })} /></label>
        <MyrialeSelect label="値の型" value={selectedState.valueType} onValueChange={(valueType) => replaceLocalState(selectedState, { valueType: valueType as ScenarioStateField['valueType'] })} options={[{ value: 'boolean', label: 'boolean' }, { value: 'string', label: 'string' }, { value: 'number', label: 'number' }]} />
        <label>default<Input aria-label="Object state default" value={selectedState.defaultValue} onChange={(event) => replaceLocalState(selectedState, { defaultValue: event.target.value })} /></label>
        <MyrialeSelect label="公開" value={selectedState.visibility} onValueChange={(visibility) => replaceLocalState(selectedState, { visibility: visibility as ScenarioStateField['visibility'] })} options={[{ value: 'public', label: 'public' }, { value: 'private', label: 'private' }]} />
        <Button size="sm" variant="text" onClick={() => { if (selectedState.localIndex === null) return; onChange({ ...object, stateFields: object.stateFields.filter((_, index) => index !== selectedState.localIndex) }); setSelection(null); }}>この状態を削除</Button>
      </div>)}
    </EditPane>

    <EditPane layer={1} open={Boolean(selectedAction)} onOpenChange={(open) => { if (!open) setSelection(null); }} eyebrow="アクション" title={selectedAction?.label ?? 'アクション'} description={selectedAction?.inherited ? 'この項目の定義はObject種類側で変更します。' : 'このObjectだけで使うアクション契約を編集します。'} footer={<Button onClick={() => setSelection(null)}>閉じる</Button>}>
      {selectedAction && (selectedAction.inherited ? <div className={editorClass}>
        <ReadOnlyValue label="stable code" value={selectedAction.code} /><ReadOnlyValue label="表示名" value={selectedAction.label} /><ReadOnlyValue label="説明" value={selectedAction.description} /><ReadOnlyValue label="visibility" value={selectedAction.visibility} /><ReadOnlyValue label="提示条件" value={conditionSummary(selectedAction.availabilityCondition)} /><ReadOnlyValue label="引数" value={selectedAction.argumentFields.map((item) => `${item.label} / ${item.code}`).join(', ') || 'なし'} />
      </div> : <div className={editorClass}>
        <label>stable code<Input aria-label="Object action code" value={selectedAction.code} onChange={(event) => replaceLocalAction(selectedAction, { code: event.target.value })} /></label>
        <label>表示名<Input aria-label="Object action label" value={selectedAction.label} onChange={(event) => replaceLocalAction(selectedAction, { label: event.target.value })} /></label>
        <label>説明<Textarea aria-label="Object action description" value={selectedAction.description} onChange={(event) => replaceLocalAction(selectedAction, { description: event.target.value })} /></label>
        <MyrialeSelect label="visibility" value={selectedAction.visibility} onValueChange={(visibility) => replaceLocalAction(selectedAction, { visibility: visibility as ScenarioTypeAction['visibility'] })} options={[{ value: 'ai-choice', label: 'AI choice' }, { value: 'manual-ui', label: 'manual UI' }, { value: 'system-only', label: 'system only' }]} />
        <ConditionBuilderPresentation label="提示条件" value={selectedAction.availabilityCondition} onChange={(availabilityCondition) => replaceLocalAction(selectedAction, { availabilityCondition })} stateFields={states.filter((item) => !item.conflict)} argumentFields={selectedAction.argumentFields} allowArguments={false} />
        <section className="grid gap-2 rounded-xl border border-[#17151f]/12 p-3"><div className="flex items-center justify-between"><strong>引数</strong><Button size="sm" variant="secondary" onClick={() => replaceLocalAction(selectedAction, { argumentFields: [...selectedAction.argumentFields, { code: nextAuthoringCode('argument'), label: '新しい引数', valueType: 'string', required: false }] })}>引数を追加</Button></div>{selectedAction.argumentFields.map((field, index) => <div key={`${field.code}-${index}`} className="grid gap-2 rounded-lg border border-[#17151f]/10 p-2"><label>stable code<Input aria-label={`Object action argument code ${index + 1}`} value={field.code} onChange={(event) => replaceLocalAction(selectedAction, { argumentFields: selectedAction.argumentFields.map((item, itemIndex) => itemIndex === index ? { ...item, code: event.target.value } : item) })} /></label><label>表示名<Input aria-label={`Object action argument label ${index + 1}`} value={field.label} onChange={(event) => replaceLocalAction(selectedAction, { argumentFields: selectedAction.argumentFields.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) })} /></label><Button size="sm" variant="text" onClick={() => replaceLocalAction(selectedAction, { argumentFields: selectedAction.argumentFields.filter((_, itemIndex) => itemIndex !== index) })}>この引数を削除</Button></div>)}</section>
        <Button size="sm" variant="text" onClick={() => { if (selectedAction.localIndex === null) return; if (object.actionRules.some((operation) => operation.operation === 'add' && operation.rule.actionCode === selectedAction.code)) return onNotice('このアクションを参照する実行ルールがあります。先に実行ルールを削除してください。', true); onChange({ ...object, actions: object.actions.filter((_, index) => index !== selectedAction.localIndex) }); setSelection(null); }}>このアクションを削除</Button>
      </div>)}
    </EditPane>

    <EditPane layer={1} open={Boolean(selectedRule)} onOpenChange={(open) => { if (!open) setSelection(null); }} eyebrow="実行ルール" title={selectedRule?.rule.code ?? '実行ルール'} description={selectedLocalRule ? 'このObjectだけで使う実行ルールを編集します。' : 'この実行結果は読み取り専用です。定義や既存の変更内容は保存時もそのまま保持されます。'} footer={<Button onClick={() => setSelection(null)}>閉じる</Button>}>
      {selectedRule && (selectedLocalRule ? <ObjectActionRuleEditorPresentation value={value} rule={selectedLocalRule.rule} actions={actions.filter((item) => !item.conflict)} stateFields={states.filter((item) => !item.conflict)} sourceObjectCode={object.code} onChange={replaceLocalRule} onDelete={deleteLocalRule} /> : <div className={editorClass}>
        <p className="text-sm text-myr-ink-subtle">この項目の定義はObject種類側で変更します。Object側からoverride / delete / adjustを開始することはできません。</p>
        {selectedAdjustment && <section className="grid gap-2 rounded-xl border border-[#17151f]/12 p-3" aria-label="adjust condition"><div className="flex items-center justify-between gap-2"><strong>条件の調整</strong><Button size="sm" variant="secondary" onClick={() => { if (selectedRule.operationIndex === null) return; const hasCondition = 'condition' in selectedAdjustment.adjustments; onChange({ ...object, actionRules: object.actionRules.map((operation, index) => index !== selectedRule.operationIndex || operation.operation !== 'adjust' ? operation : { ...operation, adjustments: hasCondition ? Object.fromEntries(Object.entries(operation.adjustments).filter(([key]) => key !== 'condition')) : { ...operation.adjustments, condition: structuredClone(selectedRule.rule.condition) } }) }); }}>{'condition' in selectedAdjustment.adjustments ? '継承条件へ戻す' : '条件を調整'}</Button></div>{'condition' in selectedAdjustment.adjustments && selectedAdjustment.adjustments.condition && <ConditionTablePresentation label="調整後の実行条件" value={selectedAdjustment.adjustments.condition} onChange={(condition) => { if (selectedRule.operationIndex === null) return; onChange({ ...object, actionRules: object.actionRules.map((operation, index) => index === selectedRule.operationIndex && operation.operation === 'adjust' ? { ...operation, adjustments: { ...operation.adjustments, condition } } : operation) }); }} stateFields={states.filter((item) => !item.conflict)} argumentFields={actions.find((item) => item.code === selectedRule.rule.actionCode)?.argumentFields ?? []} allowArguments />}</section>}
        <ReadOnlyValue label="qualified rule" value={selectedRule.key} /><ReadOnlyValue label="stable code" value={selectedRule.rule.code} /><ReadOnlyValue label="アクション" value={selectedRule.rule.actionCode} />{!('condition' in (selectedAdjustment?.adjustments ?? {})) && <ConditionTablePresentation label="実行条件" value={selectedRule.rule.condition} stateFields={states.filter((item) => !item.conflict)} argumentFields={actions.find((item) => item.code === selectedRule.rule.actionCode)?.argumentFields ?? []} allowArguments readOnly readOnlyDescription="この実行ルールの条件は読み取り専用です。" />}<ReadOnlyValue label="優先度" value={String(selectedRule.rule.priority)} /><ReadOnlyValue label="メモ" value={selectedRule.rule.note} /><ReadOnlyValue label="実行内容" value={selectedRule.rule.effects.map((effect) => effect.kind).join(' → ') || 'なし'} /><ReadOnlyValue label="状態" value={selectedRule.state === 'deleted' ? '無効' : '有効'} />
      </div>)}
    </EditPane>
  </section>;
}
