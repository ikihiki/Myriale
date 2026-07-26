import { Button, Input } from '../../../../components/ui';
import { MyrialeSelect } from '../../../../ui/MyrialeRadix';
import type { ScenarioCondition, ScenarioConditionScalar, ScenarioConditionSource, ScenarioConditionValueType } from '../../../../app/scenarioApi';
import { conditionSummary, createCondition } from '../../../../app/scenarioConditionAdapters';
import type { ScenarioActionArgumentFieldPayload, ScenarioStateFieldPayload } from '../../../../app/scenarioApi';

const card = 'grid gap-3 rounded-xl border border-[#17151f]/12 bg-[#fffef9]/85 p-3';
const kinds = [
  { value: 'always', label: '常に成立' }, { value: 'comparison', label: '値を比較' }, { value: 'in', label: '候補のいずれか' },
  { value: 'exists', label: '値が存在' }, { value: 'and', label: 'すべて成立（AND）' }, { value: 'or', label: 'いずれか成立（OR）' }, { value: 'not', label: '否定（NOT）' },
];

function scalarFor(type: ScenarioConditionValueType, raw: string | boolean): ScenarioConditionScalar {
  if (type === 'boolean') return raw === true || raw === 'true';
  if (type === 'number') { const number = Number(raw); return Number.isFinite(number) ? number : 0; }
  return String(raw);
}
function typeDefault(type: ScenarioConditionValueType): ScenarioConditionScalar { return type === 'boolean' ? false : type === 'number' ? 0 : ''; }
function changeKind(value: string): ScenarioCondition {
  if (value === 'always') return { kind: 'always' };
  if (value === 'and' || value === 'or') return { kind: 'group', operator: value, children: [createCondition()] };
  if (value === 'not') return { kind: 'not', child: createCondition() };
  if (value === 'exists') return { kind: 'exists', source: 'state', path: '' };
  if (value === 'in') return { kind: 'in', source: 'state', path: '', valueType: 'string', values: [''] };
  return createCondition();
}

export type ConditionBuilderProps = {
  label: string;
  value: ScenarioCondition;
  onChange: (condition: ScenarioCondition) => void;
  stateFields: ScenarioStateFieldPayload[];
  argumentFields?: ScenarioActionArgumentFieldPayload[];
  allowArguments?: boolean;
  readOnly?: boolean;
};

export function ConditionBuilderPresentation(props: ConditionBuilderProps) {
  return <section className="grid gap-2" aria-label={props.label}>
    <strong>{props.label}</strong>
    <ConditionNode {...props} depth={0} pathLabel={props.label} />
  </section>;
}

type NodeProps = ConditionBuilderProps & { depth: number; pathLabel: string };
function ConditionNode({ value, onChange, stateFields, argumentFields = [], allowArguments = true, readOnly = false, depth, pathLabel }: NodeProps) {
  if (readOnly || value.kind === 'unsupported') return <div className={card} data-condition-kind={value.kind}><p className="text-sm">{conditionSummary(value)}</p>{value.kind === 'unsupported' && <p className="text-xs text-myr-ink-subtle">この条件形式は未対応です。内容を変更せず保存します。</p>}</div>;
  const kindValue = value.kind === 'group' ? value.operator : value.kind;
  const replaceSource = (source: ScenarioConditionSource) => {
    if (value.kind === 'comparison' || value.kind === 'in' || value.kind === 'exists') onChange({ ...value, source, path: '' });
  };
  const source = value.kind === 'comparison' || value.kind === 'in' || value.kind === 'exists' ? value.source : 'state';
  const fields = source === 'state' ? stateFields : source === 'arguments' ? argumentFields : [];
  const replacePath = (path: string) => {
    if (value.kind === 'comparison' || value.kind === 'in' || value.kind === 'exists') onChange({ ...value, path });
  };
  const sourceOptions = [{ value: 'state', label: '状態' }, ...(allowArguments ? [{ value: 'arguments', label: 'アクション引数' }] : []), { value: 'session.flags', label: 'セッションフラグ' }];
  return <div className={card} style={{ marginLeft: depth ? Math.min(depth * 12, 36) : undefined }} data-condition-kind={value.kind}>
    <MyrialeSelect label={`${pathLabel}の条件種別`} value={kindValue} onValueChange={(kind) => onChange(changeKind(kind))} options={kinds} />
    {(value.kind === 'comparison' || value.kind === 'in' || value.kind === 'exists') && <>
      <MyrialeSelect label={`${pathLabel}のデータ元`} value={source} onValueChange={(next) => replaceSource(next as ScenarioConditionSource)} options={sourceOptions} />
      {source === 'session.flags' || fields.length === 0
        ? <label>field / path<Input aria-label={`${pathLabel}のfield path`} value={value.path} onChange={(event) => replacePath(event.target.value)} /></label>
        : <MyrialeSelect label={`${pathLabel}のfield path`} value={value.path} onValueChange={replacePath} options={fields.map((field) => ({ value: field.code, label: `${field.label} / ${field.code}` }))} />}
    </>}
    {value.kind === 'comparison' && <>
      <MyrialeSelect label={`${pathLabel}のoperator`} value={value.operator} onValueChange={(operator) => onChange({ ...value, operator: operator as typeof value.operator })} options={['eq', 'ne', 'lt', 'lte', 'gt', 'gte'].map((operator) => ({ value: operator, label: operator }))} />
      <ValueTypeAndInput label={pathLabel} valueType={value.valueType} value={value.value} onType={(valueType) => onChange({ ...value, valueType, value: typeDefault(valueType) })} onValue={(next) => onChange({ ...value, value: next })} />
    </>}
    {value.kind === 'in' && <>
      <MyrialeSelect label={`${pathLabel}の値の型`} value={value.valueType} onValueChange={(next) => { const valueType = next as ScenarioConditionValueType; onChange({ ...value, valueType, values: value.values.map(() => typeDefault(valueType)) }); }} options={['string', 'number', 'boolean'].map((type) => ({ value: type, label: type }))} />
      <ol className="grid gap-2" aria-label={`${pathLabel}の候補値`}>{value.values.map((item, index) => <li key={index} className="flex items-end gap-2"><ScalarInput label={`${pathLabel}の候補値${index + 1}`} valueType={value.valueType} value={item} onChange={(next) => onChange({ ...value, values: value.values.map((current, itemIndex) => itemIndex === index ? next : current) })} /><Button size="sm" variant="text" onClick={() => onChange({ ...value, values: value.values.filter((_, itemIndex) => itemIndex !== index) })}>削除</Button></li>)}</ol>
      <Button size="sm" variant="secondary" onClick={() => onChange({ ...value, values: [...value.values, typeDefault(value.valueType)] })}>候補値を追加</Button>
    </>}
    {value.kind === 'group' && <>
      <ol className="grid gap-3" aria-label={`${pathLabel}の子条件`}>{value.children.map((child, index) => <li key={index}><ConditionNode label={pathLabel} value={child} onChange={(next) => onChange({ ...value, children: value.children.map((current, childIndex) => childIndex === index ? next : current) })} stateFields={stateFields} argumentFields={argumentFields} allowArguments={allowArguments} depth={depth + 1} pathLabel={`${pathLabel} 子条件${index + 1}`} /><div className="flex gap-1 pl-3"><Button size="sm" variant="text" disabled={index === 0} onClick={() => { const children = [...value.children]; [children[index - 1], children[index]] = [children[index], children[index - 1]]; onChange({ ...value, children }); }}>上へ</Button><Button size="sm" variant="text" disabled={index === value.children.length - 1} onClick={() => { const children = [...value.children]; [children[index + 1], children[index]] = [children[index], children[index + 1]]; onChange({ ...value, children }); }}>下へ</Button><Button size="sm" variant="text" onClick={() => onChange({ ...value, children: value.children.filter((_, childIndex) => childIndex !== index) })}>子条件を削除</Button></div></li>)}</ol>
      <Button size="sm" variant="secondary" onClick={() => onChange({ ...value, children: [...value.children, createCondition()] })}>子条件を追加</Button>
    </>}
    {value.kind === 'not' && <ConditionNode label={pathLabel} value={value.child} onChange={(child) => onChange({ ...value, child })} stateFields={stateFields} argumentFields={argumentFields} allowArguments={allowArguments} depth={depth + 1} pathLabel={`${pathLabel} 否定する条件`} />}
  </div>;
}

function ValueTypeAndInput({ label, valueType, value, onType, onValue }: { label: string; valueType: ScenarioConditionValueType; value: ScenarioConditionScalar; onType: (type: ScenarioConditionValueType) => void; onValue: (value: ScenarioConditionScalar) => void }) {
  return <><MyrialeSelect label={`${label}の値の型`} value={valueType} onValueChange={(value) => onType(value as ScenarioConditionValueType)} options={['string', 'number', 'boolean'].map((type) => ({ value: type, label: type }))} /><ScalarInput label={`${label}の比較値`} valueType={valueType} value={value} onChange={onValue} /></>;
}
function ScalarInput({ label, valueType, value, onChange }: { label: string; valueType: ScenarioConditionValueType; value: ScenarioConditionScalar; onChange: (value: ScenarioConditionScalar) => void }) {
  if (valueType === 'boolean') return <MyrialeSelect label={label} value={String(value)} onValueChange={(next) => onChange(next === 'true')} options={[{ value: 'true', label: 'true' }, { value: 'false', label: 'false' }]} />;
  return <label>{label}<Input aria-label={label} type={valueType === 'number' ? 'number' : 'text'} value={String(value)} onChange={(event) => onChange(scalarFor(valueType, event.target.value))} /></label>;
}
