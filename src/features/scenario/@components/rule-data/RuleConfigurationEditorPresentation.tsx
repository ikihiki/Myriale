import { useId, useState } from 'react';
import { Button, Input, Textarea } from '../../../../components/ui';
import { EditPane } from '../../../../shared/EditPane';
import { MyrialeSelect } from '../../../../ui/MyrialeRadix';
import { createStateField, createTypeAction, nextAuthoringCode, type ScenarioStateField, type ScenarioTypeAction } from './scenarioRuleDataModel';
import { ConditionBuilderPresentation } from './ConditionBuilderPresentation';

type Props = {
  stateFields: ScenarioStateField[];
  actions: ScenarioTypeAction[];
  onChange: (value: { stateFields: ScenarioStateField[]; actions: ScenarioTypeAction[] }) => void;
  onRenameState?: (index: number, code: string) => void;
  onRenameAction?: (index: number, code: string) => void;
  onDeleteState?: (index: number) => void;
  onDeleteAction?: (index: number) => void;
};

type Editing = { kind: 'state'; index: number } | { kind: 'action'; index: number } | { kind: 'argument'; actionIndex: number; index: number } | null;
const tableClass = 'w-full min-w-[560px] border-collapse text-left text-sm';
const cellClass = 'border-b border-[#17151f]/10 px-3 py-3 align-middle';
const editorClass = 'grid content-start gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4';
const sectionClass = 'grid gap-4 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4';

export function RuleConfigurationEditorPresentation({ stateFields, actions, onChange, onRenameState, onRenameAction, onDeleteState, onDeleteAction }: Props) {
  const headingId = useId();
  const [editing, setEditing] = useState<Editing>(null);
  const state = editing?.kind === 'state' ? stateFields[editing.index] : undefined;
  const actionIndex = editing?.kind === 'action' ? editing.index : editing?.kind === 'argument' ? editing.actionIndex : -1;
  const action = actions[actionIndex];
  const argument = editing?.kind === 'argument' ? action?.argumentFields[editing.index] : undefined;
  const replaceState = (index: number, patch: Partial<ScenarioStateField>) => onChange({ stateFields: stateFields.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item), actions });
  const replaceAction = (index: number, patch: Partial<ScenarioTypeAction>) => onChange({ stateFields, actions: actions.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });

  return <>
    <section className={sectionClass} aria-labelledby={`${headingId}-states`}>
      <div className="flex items-center justify-between gap-2"><div><h3 id={`${headingId}-states`}>状態</h3><p className="text-sm text-myr-ink-subtle">状態契約を一覧から選び、重ねた編集ペインで詳しく編集します。</p></div><Button size="sm" variant="secondary" onClick={() => { const index = stateFields.length; onChange({ stateFields: [...stateFields, createStateField()], actions }); setEditing({ kind: 'state', index }); }}>状態を追加</Button></div>
      <div className="overflow-x-auto rounded-xl border border-[#17151f]/12 bg-white/70"><table className={tableClass}><thead className="bg-[#17151f]/[.04] text-xs text-myr-slate-muted"><tr><th className={cellClass}>編集</th><th className={cellClass}>表示名</th><th className={cellClass}>stable code</th><th className={cellClass}>型</th><th className={cellClass}>公開</th></tr></thead><tbody>
        {stateFields.map((field, index) => <tr key={`${field.code}-${index}`}><td className={cellClass}><Button size="sm" variant="secondary" aria-label={`${field.label}を編集`} onClick={() => setEditing({ kind: 'state', index })}>編集</Button></td><td className={cellClass}><strong>{field.label}</strong></td><td className={`${cellClass} font-mono text-xs`}>{field.code}</td><td className={cellClass}>{field.valueType}</td><td className={cellClass}>{field.visibility}</td></tr>)}
      </tbody></table>{stateFields.length === 0 && <p className="p-4 text-xs text-myr-ink-subtle">状態はありません。</p>}</div>
    </section>
    <section className={sectionClass} aria-labelledby={`${headingId}-actions`}>
      <div className="flex items-center justify-between gap-2"><div><h3 id={`${headingId}-actions`}>アクション</h3><p className="text-sm text-myr-ink-subtle">アクション契約を一覧から選び、重ねた編集ペインで詳しく編集します。</p></div><Button size="sm" variant="secondary" onClick={() => { const index = actions.length; onChange({ stateFields, actions: [...actions, createTypeAction()] }); setEditing({ kind: 'action', index }); }}>アクションを追加</Button></div>
      <div className="overflow-x-auto rounded-xl border border-[#17151f]/12 bg-white/70"><table className={tableClass}><thead className="bg-[#17151f]/[.04] text-xs text-myr-slate-muted"><tr><th className={cellClass}>編集</th><th className={cellClass}>表示名</th><th className={cellClass}>stable code</th><th className={cellClass}>公開先</th><th className={cellClass}>引数</th></tr></thead><tbody>
        {actions.map((item, index) => <tr key={`${item.code}-${index}`}><td className={cellClass}><Button size="sm" variant="secondary" aria-label={`${item.label}を編集`} onClick={() => setEditing({ kind: 'action', index })}>編集</Button></td><td className={cellClass}><strong>{item.label}</strong></td><td className={`${cellClass} font-mono text-xs`}>{item.code}</td><td className={cellClass}>{item.visibility}</td><td className={cellClass}>{item.argumentFields.length}件</td></tr>)}
      </tbody></table>{actions.length === 0 && <p className="p-4 text-xs text-myr-ink-subtle">アクションはありません。</p>}</div>
    </section>

    <EditPane layer={1} open={Boolean(state)} onOpenChange={(open) => { if (!open) setEditing(null); }} eyebrow="状態" title={state?.label ?? '状態を編集'} description="stable code、型、default、公開範囲を編集します。" footer={<Button onClick={() => setEditing(null)}>状態の編集を完了</Button>}>
      {state && editing?.kind === 'state' && <div className={editorClass}>
        <label>stable code<Input aria-label={`状態${editing.index + 1}のstable code`} value={state.code} onChange={(event) => onRenameState ? onRenameState(editing.index, event.target.value) : replaceState(editing.index, { code: event.target.value })} /></label>
        <label>表示名<Input aria-label={`状態${editing.index + 1}の表示名`} value={state.label} onChange={(event) => replaceState(editing.index, { label: event.target.value })} /></label>
        <MyrialeSelect label="値の型" value={state.valueType} onValueChange={(valueType) => replaceState(editing.index, { valueType: valueType as ScenarioStateField['valueType'] })} options={[{ value: 'boolean', label: 'boolean' }, { value: 'string', label: 'string' }, { value: 'number', label: 'number' }]} />
        <label>default<Input aria-label={`状態${editing.index + 1}のdefault`} value={state.defaultValue} onChange={(event) => replaceState(editing.index, { defaultValue: event.target.value })} /></label>
        <MyrialeSelect label="公開" value={state.visibility} onValueChange={(visibility) => replaceState(editing.index, { visibility: visibility as ScenarioStateField['visibility'] })} options={[{ value: 'public', label: 'public' }, { value: 'private', label: 'private' }]} />
        <Button size="sm" variant="text" onClick={() => { onDeleteState ? onDeleteState(editing.index) : onChange({ stateFields: stateFields.filter((_, index) => index !== editing.index), actions }); setEditing(null); }}>この状態を削除</Button>
      </div>}
    </EditPane>

    <EditPane layer={1} open={editing?.kind === 'action' && Boolean(action)} onOpenChange={(open) => { if (!open) setEditing(null); }} eyebrow="アクション" title={action?.label ?? 'アクションを編集'} description="アクション契約と引数を編集します。実行ルールは別の一覧で管理します。" footer={<Button onClick={() => setEditing(null)}>アクションの編集を完了</Button>}>
      {action && editing?.kind === 'action' && <div className={editorClass}>
        <label>stable code<Input aria-label={`アクション${editing.index + 1}のstable code`} value={action.code} onChange={(event) => onRenameAction ? onRenameAction(editing.index, event.target.value) : replaceAction(editing.index, { code: event.target.value })} /></label>
        <label>表示名<Input aria-label={`アクション${editing.index + 1}の表示名`} value={action.label} onChange={(event) => replaceAction(editing.index, { label: event.target.value })} /></label>
        <label>説明<Textarea aria-label={`アクション${editing.index + 1}の説明`} value={action.description} onChange={(event) => replaceAction(editing.index, { description: event.target.value })} /></label>
        <MyrialeSelect label="visibility" value={action.visibility} onValueChange={(visibility) => replaceAction(editing.index, { visibility: visibility as ScenarioTypeAction['visibility'] })} options={[{ value: 'ai-choice', label: 'AI choice' }, { value: 'manual-ui', label: 'manual UI' }, { value: 'system-only', label: 'system only' }]} />
        <ConditionBuilderPresentation label="提示条件" value={action.availabilityCondition} onChange={(availabilityCondition) => replaceAction(editing.index, { availabilityCondition })} stateFields={stateFields} argumentFields={action.argumentFields} allowArguments={false} />
        <section className="grid gap-2 rounded-xl border border-[#17151f]/12 p-3"><div className="flex items-center justify-between"><strong>引数</strong><Button size="sm" variant="secondary" onClick={() => { const index = action.argumentFields.length; replaceAction(editing.index, { argumentFields: [...action.argumentFields, { code: nextAuthoringCode('argument'), label: '新しい引数', valueType: 'string', required: false }] }); setEditing({ kind: 'argument', actionIndex: editing.index, index }); }}>引数を追加</Button></div>
          {action.argumentFields.map((field, index) => <Button key={`${field.code}-${index}`} size="sm" variant="text" onClick={() => setEditing({ kind: 'argument', actionIndex: editing.index, index })}>{field.label} / {field.code}</Button>)}
        </section>
        <Button size="sm" variant="text" onClick={() => { onDeleteAction ? onDeleteAction(editing.index) : onChange({ stateFields, actions: actions.filter((_, index) => index !== editing.index) }); setEditing(null); }}>このアクションを削除</Button>
      </div>}
    </EditPane>

    <EditPane layer={2} open={editing?.kind === 'argument' && Boolean(argument)} onOpenChange={(open) => { if (!open) setEditing(action ? { kind: 'action', index: actionIndex } : null); }} eyebrow="アクション引数" title={argument?.label ?? '引数を編集'} description="アクション引数の契約を編集します。" footer={<Button onClick={() => setEditing({ kind: 'action', index: actionIndex })}>引数の編集を完了</Button>}>
      {action && argument && editing?.kind === 'argument' && <div className={editorClass}>
        <label>stable code<Input aria-label={`アクション${actionIndex + 1}の引数${editing.index + 1}のstable code`} value={argument.code} onChange={(event) => replaceAction(actionIndex, { argumentFields: action.argumentFields.map((field, index) => index === editing.index ? { ...field, code: event.target.value } : field) })} /></label>
        <label>表示名<Input aria-label={`アクション${actionIndex + 1}の引数${editing.index + 1}の表示名`} value={argument.label} onChange={(event) => replaceAction(actionIndex, { argumentFields: action.argumentFields.map((field, index) => index === editing.index ? { ...field, label: event.target.value } : field) })} /></label>
        <MyrialeSelect label="値の型" value={argument.valueType} onValueChange={(valueType) => replaceAction(actionIndex, { argumentFields: action.argumentFields.map((field, index) => index === editing.index ? { ...field, valueType: valueType as typeof argument.valueType } : field) })} options={[{ value: 'boolean', label: 'boolean' }, { value: 'string', label: 'string' }, { value: 'number', label: 'number' }]} />
        <label className="!grid-cols-[1fr_auto] items-center"><span>必須</span><input type="checkbox" aria-label="引数は必須" checked={argument.required} onChange={(event) => replaceAction(actionIndex, { argumentFields: action.argumentFields.map((field, index) => index === editing.index ? { ...field, required: event.target.checked } : field) })} /></label>
        <Button size="sm" variant="text" onClick={() => { replaceAction(actionIndex, { argumentFields: action.argumentFields.filter((_, index) => index !== editing.index) }); setEditing({ kind: 'action', index: actionIndex }); }}>この引数を削除</Button>
      </div>}
    </EditPane>
  </>;
}
