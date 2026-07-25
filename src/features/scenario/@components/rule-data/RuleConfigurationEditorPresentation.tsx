import { Button, Input } from '../../../../components/ui';
import { MyrialeSelect } from '../../../../ui/MyrialeRadix';
import { createStateField, createTypeAction, type ScenarioStateField, type ScenarioTypeAction } from './scenarioRuleDataModel';

type Props = {
  label: string;
  stateFields: ScenarioStateField[];
  actions: ScenarioTypeAction[];
  onChange: (value: { stateFields: ScenarioStateField[]; actions: ScenarioTypeAction[] }) => void;
};

export function RuleConfigurationEditorPresentation({ label, stateFields, actions, onChange }: Props) {
  return <section aria-label={`${label} rule configuration`} className="grid gap-4 rounded-xl border border-[#17151f]/12 bg-[#fffef9]/80 p-3">
    <header><strong>{label}</strong><p className="text-xs text-myr-ink-subtle">状態・default・公開範囲・Action契約を同じeditorで編集します。</p></header>
    <div className="grid gap-2">
      <div className="flex items-center justify-between"><strong className="text-sm">状態 fields</strong><Button size="sm" variant="secondary" onClick={() => onChange({ stateFields: [...stateFields, createStateField()], actions })}>状態を追加</Button></div>
      {stateFields.map((field, index) => <div key={`${field.code}-${index}`} className="grid grid-cols-[1fr_1fr_120px_110px_auto] gap-2 max-lg:grid-cols-2">
        <Input aria-label={`${label} state code ${index + 1}`} value={field.code} onChange={(event) => onChange({ stateFields: stateFields.map((item, i) => i === index ? { ...item, code: event.target.value } : item), actions })} />
        <Input aria-label={`${label} state label ${index + 1}`} value={field.label} onChange={(event) => onChange({ stateFields: stateFields.map((item, i) => i === index ? { ...item, label: event.target.value } : item), actions })} />
        <Input aria-label={`${label} state default ${index + 1}`} value={field.defaultValue} onChange={(event) => onChange({ stateFields: stateFields.map((item, i) => i === index ? { ...item, defaultValue: event.target.value } : item), actions })} />
        <MyrialeSelect label="公開" value={field.visibility} onValueChange={(visibility) => onChange({ stateFields: stateFields.map((item, i) => i === index ? { ...item, visibility: visibility as ScenarioStateField['visibility'] } : item), actions })} options={[{ value: 'public', label: 'public' }, { value: 'private', label: 'private' }]} />
        <Button size="sm" variant="text" onClick={() => onChange({ stateFields: stateFields.filter((_, i) => i !== index), actions })}>削除</Button>
      </div>)}
      {stateFields.length === 0 && <span className="text-xs text-myr-ink-subtle">local stateはありません。</span>}
    </div>
    <div className="grid gap-2">
      <div className="flex items-center justify-between"><strong className="text-sm">Actions</strong><Button size="sm" variant="secondary" onClick={() => onChange({ stateFields, actions: [...actions, createTypeAction()] })}>Actionを追加</Button></div>
      {actions.map((action, index) => <div key={`${action.code}-${index}`} className="grid grid-cols-[1fr_1fr_140px_auto] gap-2 max-lg:grid-cols-2">
        <Input aria-label={`${label} action code ${index + 1}`} value={action.code} onChange={(event) => onChange({ stateFields, actions: actions.map((item, i) => i === index ? { ...item, code: event.target.value } : item) })} />
        <Input aria-label={`${label} action label ${index + 1}`} value={action.label} onChange={(event) => onChange({ stateFields, actions: actions.map((item, i) => i === index ? { ...item, label: event.target.value } : item) })} />
        <MyrialeSelect label="visibility" value={action.visibility} onValueChange={(visibility) => onChange({ stateFields, actions: actions.map((item, i) => i === index ? { ...item, visibility: visibility as ScenarioTypeAction['visibility'] } : item) })} options={[{ value: 'ai-choice', label: 'AI choice' }, { value: 'manual-ui', label: 'manual UI' }, { value: 'system-only', label: 'system only' }]} />
        <Button size="sm" variant="text" onClick={() => onChange({ stateFields, actions: actions.filter((_, i) => i !== index) })}>削除</Button>
      </div>)}
      {actions.length === 0 && <span className="text-xs text-myr-ink-subtle">local actionはありません。</span>}
    </div>
  </section>;
}
