import { Button, Input, Textarea } from '../../../../components/ui';
import { MyrialeSelect } from '../../../../ui/MyrialeRadix';
import { createProfileField, type ScenarioProfileField, type ScenarioProfileValue } from './scenarioRuleDataModel';

type Props = {
  title: string;
  description: string;
  fields: ScenarioProfileField[];
  defaults: ScenarioProfileValue[];
  onChange: (value: { fields: ScenarioProfileField[]; defaults: ScenarioProfileValue[] }) => void;
};

const cardClass = 'grid gap-3 rounded-xl border border-[#17151f]/12 bg-white/65 p-3';

export function ProfileFieldsEditorPresentation({ title, description, fields, defaults, onChange }: Props) {
  const replaceField = (index: number, patch: Partial<ScenarioProfileField>) => {
    const previous = fields[index];
    const next = fields.map((field, itemIndex) => itemIndex === index ? { ...field, ...patch } : field);
    const nextDefaults = patch.code ? defaults.map((item) => item.profileCode === previous.code ? { ...item, profileCode: patch.code! } : item) : defaults;
    onChange({ fields: next, defaults: nextDefaults });
  };
  const setDefault = (field: ScenarioProfileField, value: string) => {
    const without = defaults.filter((item) => item.profileCode !== field.code);
    onChange({ fields, defaults: value === '' ? without : [...without, { profileCode: field.code, value }] });
  };
  return <section className="grid gap-3" aria-label={title}>
    <div className="flex items-center justify-between gap-2"><div><h3>{title}</h3><p className="text-sm text-myr-ink-subtle">{description}</p></div><Button size="sm" variant="secondary" onClick={() => onChange({ fields: [...fields, createProfileField()], defaults })}>項目を追加</Button></div>
    {fields.map((field, index) => <div key={`${field.code}-${index}`} className={cardClass}>
      <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1"><label>stable code<Input aria-label={`${title}${index + 1}のstable code`} value={field.code} onChange={(event) => replaceField(index, { code: event.target.value })} /></label><label>表示名<Input aria-label={`${title}${index + 1}の表示名`} value={field.label} onChange={(event) => replaceField(index, { label: event.target.value })} /></label></div>
      <label>説明<Textarea aria-label={`${title}${index + 1}の説明`} value={field.description} onChange={(event) => replaceField(index, { description: event.target.value })} /></label>
      <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1"><MyrialeSelect label="値の型" value={field.valueType} onValueChange={(valueType) => replaceField(index, { valueType: valueType as ScenarioProfileField['valueType'] })} options={[{ value: 'string', label: 'string' }, { value: 'number', label: 'number' }, { value: 'boolean', label: 'boolean' }]} /><label>default（任意）<Input aria-label={`${field.code}のprofile default`} value={defaults.find((item) => item.profileCode === field.code)?.value ?? ''} onChange={(event) => setDefault(field, event.target.value)} /></label><label className="!grid-cols-[1fr_auto] items-center"><span>必須</span><input type="checkbox" aria-label={`${field.code}は必須`} checked={field.required} onChange={(event) => replaceField(index, { required: event.target.checked })} /></label></div>
      <Button size="sm" variant="text" onClick={() => onChange({ fields: fields.filter((_, itemIndex) => itemIndex !== index), defaults: defaults.filter((item) => item.profileCode !== field.code) })}>この項目を削除</Button>
    </div>)}
    {fields.length === 0 && <p className="text-sm text-myr-ink-subtle">プロフィール項目はありません。</p>}
  </section>;
}
