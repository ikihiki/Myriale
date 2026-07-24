import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Textarea } from '../../../../components/ui';
import { MyrialeSelect } from '../../../../ui/MyrialeRadix';
import { createActionResult, type ScenarioRuleData, type ScenarioRuleEffect } from './scenarioRuleDataModel';

type Props = { value: ScenarioRuleData; onChange: (value: ScenarioRuleData) => void };
const cardClass = 'grid content-start gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4 shadow-[0_12px_30px_rgba(23,21,31,.07)]';

function createEffect(kind: ScenarioRuleEffect['kind']): ScenarioRuleEffect {
  if (kind === 'move-object') return { kind, targetObjectCode: '', locationCode: '' };
  if (kind === 'emit-fact') return { kind, text: '' };
  if (kind === 'add-narrative-hint') return { kind, text: '' };
  return { kind: 'set-state', targetObjectCode: '', stateCode: '', value: '' };
}

export function ActionResultsEditorPresentation({ value, onChange }: Props) {
  const [selectedObjectCode, setSelectedObjectCode] = useState(value.objects[0]?.code ?? '');
  const [selectedResultCode, setSelectedResultCode] = useState('');
  const objectIndex = value.objects.findIndex((item) => item.code === selectedObjectCode);
  const object = value.objects[objectIndex];
  const type = value.objectTypes.find((item) => item.code === object?.objectTypeCode);
  const resultIndex = object?.actionResults.findIndex((item) => item.code === selectedResultCode) ?? -1;
  const result = object?.actionResults[resultIndex];

  useEffect(() => { if (!object && value.objects[0]) setSelectedObjectCode(value.objects[0].code); }, [object, value.objects]);
  useEffect(() => { if (object && !result && object.actionResults[0]) setSelectedResultCode(object.actionResults[0].code); }, [object, result]);

  const replaceObject = (next: typeof object) => { if (!next || objectIndex < 0) return; const objects = [...value.objects]; objects[objectIndex] = next; onChange({ ...value, objects }); };
  const replaceResult = (next: typeof result) => { if (!object || !next || resultIndex < 0) return; const actionResults = [...object.actionResults]; actionResults[resultIndex] = next; replaceObject({ ...object, actionResults }); };
  const addResult = () => { if (!object) return; const next = createActionResult(object, value); replaceObject({ ...object, actionResults: [...object.actionResults, next] }); setSelectedResultCode(next.code); };
  const preview = useMemo(() => {
    if (!object || !result) return '結果を選択すると、決定的な遷移を確認できます。';
    const action = type?.actions.find((item) => item.code === result.actionCode);
    const state = type?.stateFields.find((item) => item.code === result.fromStateCode);
    return `${object.name}: ${state?.label ?? 'any'} = ${result.fromStateValue || 'any'} → ${action?.label ?? 'action未選択'} → ${result.effects.length} effect`;
  }, [object, result, type]);

  return (
    <section aria-label="アクション結果" className="grid gap-4">
      <header><h2>Deterministic result table</h2><p>状態とアクションの組み合わせに対し、優先度順で1つだけ成立する結果を登録します。AIはここにあるeffectを変更できません。</p></header>
      <div className="rounded-2xl border border-[#7c5cff]/25 bg-[#7c5cff]/8 px-4 py-3 font-mono text-sm" data-testid="rule-result-preview">{preview}</div>
      <div className="grid grid-cols-[minmax(190px,.28fr)_minmax(0,1fr)] gap-4 max-lg:grid-cols-1">
        <aside className={cardClass} aria-label="アクション結果一覧">
          <MyrialeSelect label="対象オブジェクト" value={selectedObjectCode} onValueChange={(code) => { setSelectedObjectCode(code); setSelectedResultCode(''); }} options={value.objects.map((item) => ({ value: item.code, label: `${item.name} / ${item.code}` }))} />
          <Button size="sm" variant="secondary" onClick={addResult} disabled={!object || !type?.actions.length}>結果を追加</Button>
          {object?.actionResults.map((item) => <button key={item.code} type="button" aria-pressed={item.code === selectedResultCode} onClick={() => setSelectedResultCode(item.code)} className="grid cursor-pointer gap-0.5 rounded-xl border border-[#17151f]/12 bg-white/70 px-3 py-2 text-left aria-pressed:border-[#7c5cff] aria-pressed:bg-[#7c5cff]/10"><strong>{type?.actions.find((action) => action.code === item.actionCode)?.label ?? '未選択'}</strong><span className="font-mono text-[11px]">priority {item.priority}</span></button>)}
        </aside>
        {!result || !object ? <div className={cardClass}><p>オブジェクトを選び、「結果を追加」から状態遷移を定義します。</p></div> : <div className={cardClass}>
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1"><MyrialeSelect label="アクション" value={result.actionCode} onValueChange={(actionCode) => replaceResult({ ...result, actionCode })} options={(type?.actions ?? []).map((action) => ({ value: action.code, label: `${action.label} / ${action.code}` }))} /><label>優先度<Input aria-label="結果の優先度" type="number" value={result.priority} onChange={(event) => replaceResult({ ...result, priority: Number(event.target.value) })} /></label></div>
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1"><MyrialeSelect label="条件に使う状態" value={result.fromStateCode} onValueChange={(fromStateCode) => replaceResult({ ...result, fromStateCode })} options={(type?.stateFields ?? []).map((state) => ({ value: state.code, label: `${state.label} / ${state.code}` }))} /><label>条件値<Input aria-label="結果の条件値" value={result.fromStateValue} onChange={(event) => replaceResult({ ...result, fromStateValue: event.target.value })} /></label></div>
          <label>authoring note<Textarea aria-label="結果のメモ" value={result.note} onChange={(event) => replaceResult({ ...result, note: event.target.value })} /></label>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#17151f]/12 pt-3"><h3>順序付きeffect</h3><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => replaceResult({ ...result, effects: [...result.effects, createEffect('set-state')] })}>状態更新</Button><Button size="sm" variant="secondary" onClick={() => replaceResult({ ...result, effects: [...result.effects, createEffect('move-object')] })}>配置移動</Button><Button size="sm" variant="secondary" onClick={() => replaceResult({ ...result, effects: [...result.effects, createEffect('emit-fact')] })}>fact</Button><Button size="sm" variant="secondary" onClick={() => replaceResult({ ...result, effects: [...result.effects, createEffect('add-narrative-hint')] })}>hint</Button></div></div>
          {result.effects.map((effect, index) => <div key={index} className="grid gap-2 rounded-xl border border-[#17151f]/12 bg-[#fffef9]/85 p-3"><strong>{index + 1}. {effect.kind}</strong>{effect.kind === 'set-state' && <><MyrialeSelect label={`effect ${index + 1}の対象`} value={effect.targetObjectCode} onValueChange={(targetObjectCode) => replaceResult({ ...result, effects: result.effects.map((item, itemIndex) => itemIndex === index ? { ...effect, targetObjectCode } : item) })} options={value.objects.map((item) => ({ value: item.code, label: item.name }))} /><label>state code<Input aria-label={`effect ${index + 1}のstate code`} value={effect.stateCode} onChange={(event) => replaceResult({ ...result, effects: result.effects.map((item, itemIndex) => itemIndex === index ? { ...effect, stateCode: event.target.value } : item) })} /></label><label>更新値<Input aria-label={`effect ${index + 1}の更新値`} value={effect.value} onChange={(event) => replaceResult({ ...result, effects: result.effects.map((item, itemIndex) => itemIndex === index ? { ...effect, value: event.target.value } : item) })} /></label></>}{effect.kind === 'move-object' && <><MyrialeSelect label={`effect ${index + 1}の移動対象`} value={effect.targetObjectCode} onValueChange={(targetObjectCode) => replaceResult({ ...result, effects: result.effects.map((item, itemIndex) => itemIndex === index ? { ...effect, targetObjectCode } : item) })} options={value.objects.map((item) => ({ value: item.code, label: item.name }))} /><MyrialeSelect label={`effect ${index + 1}の移動先`} value={effect.locationCode} onValueChange={(locationCode) => replaceResult({ ...result, effects: result.effects.map((item, itemIndex) => itemIndex === index ? { ...effect, locationCode } : item) })} options={value.locations.map((item) => ({ value: item.code, label: item.name }))} /></>}{(effect.kind === 'emit-fact' || effect.kind === 'add-narrative-hint') && <label>内容<Input aria-label={`effect ${index + 1}の内容`} value={effect.text} onChange={(event) => replaceResult({ ...result, effects: result.effects.map((item, itemIndex) => itemIndex === index ? { ...effect, text: event.target.value } : item) })} /></label>}<Button size="sm" variant="text" onClick={() => replaceResult({ ...result, effects: result.effects.filter((_, itemIndex) => itemIndex !== index) })}>effectを削除</Button></div>)}
          <Button size="sm" variant="text" onClick={() => { replaceObject({ ...object, actionResults: object.actionResults.filter((item) => item !== result) }); setSelectedResultCode(''); }}>この結果を削除</Button>
        </div>}
      </div>
    </section>
  );
}
