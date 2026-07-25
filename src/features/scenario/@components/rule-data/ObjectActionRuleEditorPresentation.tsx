import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Textarea } from '../../../../components/ui';
import { MyrialeSelect } from '../../../../ui/MyrialeRadix';
import type { ScenarioJsonObject } from '../../../../app/scenarioApi';
import type { ScenarioActionRule, ScenarioRuleData, ScenarioRuleEffect, ScenarioTypeAction } from './scenarioRuleDataModel';

const cardClass = 'grid content-start gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4 shadow-[0_12px_30px_rgba(23,21,31,.07)]';
const effectNames: Record<ScenarioRuleEffect['kind'], string> = {
  'set-state': '状態を更新', 'move-object': 'オブジェクトを移動', 'move-session': 'プレイヤーの現在地を移動',
  'emit-fact': '確定した事実を追加', 'emit-event': '出来事を記録', 'add-narrative-hint': '描写のヒントを追加',
  'forbid-narrative-fact': '矛盾する描写を禁止', unsupported: '未対応のeffect（内容を保持）',
};

function createEffect(kind: Exclude<ScenarioRuleEffect['kind'], 'unsupported'>): ScenarioRuleEffect {
  if (kind === 'move-object') return { kind, targetObjectCode: '', locationCode: '' };
  if (kind === 'move-session') return { kind, locationCode: '' };
  if (kind === 'emit-event') return { kind, event: '', locationCode: '' };
  if (kind === 'emit-fact' || kind === 'add-narrative-hint' || kind === 'forbid-narrative-fact') return { kind, text: '' };
  return { kind: 'set-state', targetObjectCode: '', stateCode: '', value: '' };
}

function JsonObjectField({ label, ariaLabel, value, onChange }: { label: string; ariaLabel: string; value: ScenarioJsonObject; onChange: (value: ScenarioJsonObject) => void }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState('');
  useEffect(() => { setText(JSON.stringify(value, null, 2)); }, [value]);
  const commit = () => {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
      setError('');
      onChange(parsed as ScenarioJsonObject);
    } catch {
      setError('JSON objectとして入力してください。');
    }
  };
  return <label>{label}<Textarea aria-label={ariaLabel} value={text} onChange={(event) => setText(event.target.value)} onBlur={commit} /><span role={error ? 'alert' : undefined} className="text-xs text-[#a8324a]">{error}</span></label>;
}

export type ObjectActionRuleEditorProps = {
  value: ScenarioRuleData;
  rule: ScenarioActionRule;
  actions: ScenarioTypeAction[];
  sourceObjectCode?: string;
  actionFixed?: boolean;
  onChange: (rule: ScenarioActionRule) => void;
  onDelete?: () => void;
};

export function ObjectActionRuleEditorPresentation({ value, rule, actions, sourceObjectCode = '', actionFixed = false, onChange, onDelete }: ObjectActionRuleEditorProps) {
  const action = actions.find((item) => item.code === rule.actionCode);
  const preview = useMemo(() => `${rule.code || '(code未設定)'}: ${(action?.label ?? rule.actionCode) || '(action未設定)'} / priority ${rule.priority} / ${rule.effects.length} effect`, [action, rule]);
  const replaceEffect = (index: number, effect: ScenarioRuleEffect) => onChange({ ...rule, effects: rule.effects.map((item, itemIndex) => itemIndex === index ? effect : item) });
  const moveEffect = (from: number, to: number) => {
    if (to < 0 || to >= rule.effects.length) return;
    const effects = [...rule.effects]; const [effect] = effects.splice(from, 1); effects.splice(to, 0, effect); onChange({ ...rule, effects });
  };
  const locationOptions = value.locations.map((location) => ({ value: location.code, label: `${location.name} / ${location.code}` }));
  return <div className={cardClass}>
    <div className="rounded-xl border border-[#7c5cff]/25 bg-[#7c5cff]/8 px-4 py-3 font-mono text-sm" data-testid="rule-result-preview" aria-live="polite">{preview}</div>
    <label>rule stable code<Input aria-label="実行ルールのstable code" value={rule.code} readOnly={actionFixed} onChange={(event) => onChange({ ...rule, code: event.target.value })} /></label>
    {actionFixed ? <label>アクション（固定）<Input aria-label="実行ルールのアクション" value={`${action?.label ?? rule.actionCode} / ${rule.actionCode}`} readOnly /></label> : <MyrialeSelect label="アクション" value={rule.actionCode} onValueChange={(actionCode) => onChange({ ...rule, actionCode })} options={actions.map((item) => ({ value: item.code, label: `${item.label} / ${item.code}` }))} />}
    <JsonObjectField label="condition (JSON object)" ariaLabel="実行ルールのcondition JSON" value={rule.condition} onChange={(condition) => onChange({ ...rule, condition })} />
    <label>優先度<Input aria-label="実行ルールの優先度" type="number" value={rule.priority} onChange={(event) => onChange({ ...rule, priority: Number(event.target.value) })} /></label>
    <label>作成メモ<Textarea aria-label="実行ルールのメモ" value={rule.note} onChange={(event) => onChange({ ...rule, note: event.target.value })} /></label>
    <section className="grid gap-3 rounded-xl border border-[#17151f]/12 p-3" aria-label="module binding">
      <div className="flex items-center justify-between"><strong>module binding</strong><Button size="sm" variant="secondary" onClick={() => onChange({ ...rule, moduleBinding: rule.moduleBinding ? null : { moduleId: '', version: '', digest: '', configuration: {} } })}>{rule.moduleBinding ? 'bindingを解除' : 'bindingを追加'}</Button></div>
      {rule.moduleBinding && <><label>module id<Input aria-label="module binding id" value={rule.moduleBinding.moduleId} onChange={(event) => onChange({ ...rule, moduleBinding: { ...rule.moduleBinding!, moduleId: event.target.value } })} /></label><label>version<Input aria-label="module binding version" value={rule.moduleBinding.version} onChange={(event) => onChange({ ...rule, moduleBinding: { ...rule.moduleBinding!, version: event.target.value } })} /></label><label>digest<Input aria-label="module binding digest" value={rule.moduleBinding.digest} onChange={(event) => onChange({ ...rule, moduleBinding: { ...rule.moduleBinding!, digest: event.target.value } })} /></label><JsonObjectField label="configuration" ariaLabel="module binding configuration JSON" value={rule.moduleBinding.configuration} onChange={(configuration) => onChange({ ...rule, moduleBinding: { ...rule.moduleBinding!, configuration } })} /></>}
    </section>
    <div className="grid gap-2 border-t border-[#17151f]/12 pt-3"><div><h3>実行すること（上から順）</h3><p className="text-sm text-[#5e596b]">順番を変えると、保存される実行順も変わります。</p></div><div className="flex flex-wrap gap-2" aria-label="実行内容を追加">
      {(['set-state', 'move-object', 'move-session', 'emit-fact', 'emit-event', 'add-narrative-hint', 'forbid-narrative-fact'] as const).map((kind) => <Button key={kind} size="sm" variant="secondary" onClick={() => onChange({ ...rule, effects: [...rule.effects, createEffect(kind)] })}>{effectNames[kind]}</Button>)}
    </div></div>
    <ol className="grid gap-3" aria-label="順序付きの実行内容">{rule.effects.map((effect, index) => <li key={`${effect.kind}-${index}`} className="grid gap-3 rounded-xl border border-[#17151f]/12 bg-[#fffef9]/85 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><strong>{index + 1}. {effectNames[effect.kind]}</strong><div className="flex flex-wrap gap-1"><Button size="sm" variant="text" disabled={index === 0} aria-label={`${index + 1}番目を上へ移動`} onClick={() => moveEffect(index, index - 1)}>上へ</Button><Button size="sm" variant="text" disabled={index === rule.effects.length - 1} aria-label={`${index + 1}番目を下へ移動`} onClick={() => moveEffect(index, index + 1)}>下へ</Button>{effect.kind !== 'unsupported' && <Button size="sm" variant="text" aria-label={`${index + 1}番目を削除`} onClick={() => onChange({ ...rule, effects: rule.effects.filter((_, itemIndex) => itemIndex !== index) })}>削除</Button>}</div></div>
      {effect.kind === 'set-state' && <><MyrialeSelect label={`${index + 1}番目で更新するオブジェクト`} value={effect.targetObjectCode || sourceObjectCode} onValueChange={(targetObjectCode) => replaceEffect(index, { ...effect, targetObjectCode })} options={value.objects.map((item) => ({ value: item.code, label: `${item.name} / ${item.code}` }))} /><label>更新する状態のcode<Input aria-label={`${index + 1}番目の状態code`} value={effect.stateCode} onChange={(event) => replaceEffect(index, { ...effect, stateCode: event.target.value })} /></label><label>更新後の値<Input aria-label={`${index + 1}番目の更新値`} value={effect.value} onChange={(event) => replaceEffect(index, { ...effect, value: event.target.value })} /></label></>}
      {effect.kind === 'move-object' && <><MyrialeSelect label={`${index + 1}番目で移動するオブジェクト`} value={effect.targetObjectCode || sourceObjectCode} onValueChange={(targetObjectCode) => replaceEffect(index, { ...effect, targetObjectCode })} options={value.objects.map((item) => ({ value: item.code, label: `${item.name} / ${item.code}` }))} /><MyrialeSelect label={`${index + 1}番目の移動先`} value={effect.locationCode} onValueChange={(locationCode) => replaceEffect(index, { ...effect, locationCode })} options={locationOptions} /></>}
      {effect.kind === 'move-session' && <MyrialeSelect label={`${index + 1}番目のプレイヤー移動先`} value={effect.locationCode} onValueChange={(locationCode) => replaceEffect(index, { ...effect, locationCode })} options={locationOptions} />}
      {effect.kind === 'emit-event' && <><label>出来事の名前<Input aria-label={`${index + 1}番目の出来事の名前`} value={effect.event} onChange={(event) => replaceEffect(index, { ...effect, event: event.target.value })} /></label><label>関連する場所（任意）<Input aria-label={`${index + 1}番目の出来事の場所code`} value={effect.locationCode} onChange={(event) => replaceEffect(index, { ...effect, locationCode: event.target.value })} /></label></>}
      {(effect.kind === 'emit-fact' || effect.kind === 'add-narrative-hint' || effect.kind === 'forbid-narrative-fact') && <label>文章<Textarea aria-label={`${index + 1}番目の文章`} value={effect.text} onChange={(event) => replaceEffect(index, { ...effect, text: event.target.value })} /></label>}
      {effect.kind === 'unsupported' && <p className="text-sm text-[#5e596b]">この種類（{effect.type}）は編集できません。順序とJSONを変更せず保存します。</p>}
    </li>)}</ol>
    {onDelete && <Button size="sm" variant="text" onClick={onDelete}>この実行ルールを削除</Button>}
  </div>;
}
