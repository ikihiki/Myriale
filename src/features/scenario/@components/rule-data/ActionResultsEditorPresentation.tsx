import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Textarea } from '../../../../components/ui';
import { MyrialeSelect } from '../../../../ui/MyrialeRadix';
import { createActionResult, type ScenarioRuleData, type ScenarioRuleEffect } from './scenarioRuleDataModel';

type Props = { value: ScenarioRuleData; onChange: (value: ScenarioRuleData) => void };
const cardClass = 'grid content-start gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4 shadow-[0_12px_30px_rgba(23,21,31,.07)]';
const effectNames: Record<ScenarioRuleEffect['kind'], string> = {
  'set-state': '状態を更新',
  'move-object': 'オブジェクトを移動',
  'move-session': 'プレイヤーの現在地を移動',
  'emit-fact': '確定した事実を追加',
  'emit-event': '出来事を記録',
  'add-narrative-hint': '描写のヒントを追加',
  'forbid-narrative-fact': '矛盾する描写を禁止',
  unsupported: '未対応のeffect（内容を保持）',
};

function createEffect(kind: Exclude<ScenarioRuleEffect['kind'], 'unsupported'>): ScenarioRuleEffect {
  if (kind === 'move-object') return { kind, targetObjectCode: '', locationCode: '' };
  if (kind === 'move-session') return { kind, locationCode: '' };
  if (kind === 'emit-event') return { kind, event: '', locationCode: '' };
  if (kind === 'emit-fact' || kind === 'add-narrative-hint' || kind === 'forbid-narrative-fact') return { kind, text: '' };
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

  const replaceObject = (next: typeof object) => {
    if (!next || objectIndex < 0) return;
    const objects = [...value.objects];
    objects[objectIndex] = next;
    onChange({ ...value, objects });
  };
  const replaceResult = (next: typeof result) => {
    if (!object || !next || resultIndex < 0) return;
    const actionResults = [...object.actionResults];
    actionResults[resultIndex] = next;
    replaceObject({ ...object, actionResults });
  };
  const addResult = () => {
    if (!object) return;
    const next = createActionResult(object, value);
    replaceObject({ ...object, actionResults: [...object.actionResults, next] });
    setSelectedResultCode(next.code);
  };
  const replaceEffect = (index: number, effect: ScenarioRuleEffect) => {
    if (!result) return;
    replaceResult({ ...result, effects: result.effects.map((item, itemIndex) => itemIndex === index ? effect : item) });
  };
  const moveEffect = (from: number, to: number) => {
    if (!result || to < 0 || to >= result.effects.length) return;
    const effects = [...result.effects];
    const [effect] = effects.splice(from, 1);
    effects.splice(to, 0, effect);
    replaceResult({ ...result, effects });
  };
  const preview = useMemo(() => {
    if (!object || !result) return '結果を選択すると、決定的な遷移を確認できます。';
    const action = type?.actions.find((item) => item.code === result.actionCode);
    const state = type?.stateFields.find((item) => item.code === result.fromStateCode);
    return `${object.name}: ${state?.label ?? 'any'} = ${result.fromStateValue || 'any'} → ${action?.label ?? 'action未選択'} → ${result.effects.length} effect`;
  }, [object, result, type]);
  const locationOptions = value.locations.map((location) => ({ value: location.code, label: `${location.name} / ${location.code}` }));

  return (
    <section aria-label="アクション結果" className="grid gap-4">
      <header><h2>Deterministic result table</h2><p>状態とアクションの組み合わせに対し、上から順に実行する結果を登録します。AIはここで確定した内容や順序を変更できません。</p></header>
      <div className="rounded-2xl border border-[#7c5cff]/25 bg-[#7c5cff]/8 px-4 py-3 font-mono text-sm" data-testid="rule-result-preview" aria-live="polite">{preview}</div>
      <div className="grid grid-cols-[minmax(190px,.28fr)_minmax(0,1fr)] gap-4 max-lg:grid-cols-1">
        <aside className={cardClass} aria-label="アクション結果一覧">
          <MyrialeSelect label="対象オブジェクト" value={selectedObjectCode} onValueChange={(code) => { setSelectedObjectCode(code); setSelectedResultCode(''); }} options={value.objects.map((item) => ({ value: item.code, label: `${item.name} / ${item.code}` }))} />
          <Button size="sm" variant="secondary" onClick={addResult} disabled={!object || !type?.actions.length}>結果を追加</Button>
          {object?.actionResults.map((item) => <button key={item.code} type="button" aria-pressed={item.code === selectedResultCode} onClick={() => setSelectedResultCode(item.code)} className="grid cursor-pointer gap-0.5 rounded-xl border border-[#17151f]/12 bg-white/70 px-3 py-2 text-left aria-pressed:border-[#7c5cff] aria-pressed:bg-[#7c5cff]/10"><strong>{type?.actions.find((action) => action.code === item.actionCode)?.label ?? '未選択'}</strong><span className="font-mono text-[11px]">priority {item.priority}</span></button>)}
        </aside>
        {!result || !object ? <div className={cardClass}><p>オブジェクトを選び、「結果を追加」から状態遷移を定義します。</p></div> : <div className={cardClass}>
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1"><MyrialeSelect label="アクション" value={result.actionCode} onValueChange={(actionCode) => replaceResult({ ...result, actionCode })} options={(type?.actions ?? []).map((action) => ({ value: action.code, label: `${action.label} / ${action.code}` }))} /><label>優先度<Input aria-label="結果の優先度" type="number" value={result.priority} onChange={(event) => replaceResult({ ...result, priority: Number(event.target.value) })} /></label></div>
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1"><MyrialeSelect label="条件に使う状態" value={result.fromStateCode} onValueChange={(fromStateCode) => replaceResult({ ...result, fromStateCode })} options={(type?.stateFields ?? []).map((state) => ({ value: state.code, label: `${state.label} / ${state.code}` }))} /><label>条件値<Input aria-label="結果の条件値" value={result.fromStateValue} onChange={(event) => replaceResult({ ...result, fromStateValue: event.target.value })} /></label></div>
          <label>作成メモ<Textarea aria-label="結果のメモ" value={result.note} onChange={(event) => replaceResult({ ...result, note: event.target.value })} /></label>
          <div className="grid gap-2 border-t border-[#17151f]/12 pt-3">
            <div><h3>実行すること（上から順）</h3><p className="text-sm text-[#5e596b]">順番を変えると、保存される実行順も変わります。</p></div>
            <div className="flex flex-wrap gap-2" aria-label="実行内容を追加">
              <Button size="sm" variant="secondary" onClick={() => replaceResult({ ...result, effects: [...result.effects, createEffect('set-state')] })}>状態を更新</Button>
              <Button size="sm" variant="secondary" onClick={() => replaceResult({ ...result, effects: [...result.effects, createEffect('move-object')] })}>物を別の場所へ移動</Button>
              <Button size="sm" variant="secondary" onClick={() => replaceResult({ ...result, effects: [...result.effects, createEffect('move-session')] })}>プレイヤーを移動</Button>
              <Button size="sm" variant="secondary" onClick={() => replaceResult({ ...result, effects: [...result.effects, createEffect('emit-fact')] })}>確定した事実</Button>
              <Button size="sm" variant="secondary" onClick={() => replaceResult({ ...result, effects: [...result.effects, createEffect('emit-event')] })}>出来事を記録</Button>
              <Button size="sm" variant="secondary" onClick={() => replaceResult({ ...result, effects: [...result.effects, createEffect('add-narrative-hint')] })}>描写のヒント</Button>
              <Button size="sm" variant="secondary" onClick={() => replaceResult({ ...result, effects: [...result.effects, createEffect('forbid-narrative-fact')] })}>矛盾する描写を禁止</Button>
            </div>
          </div>
          <ol className="grid gap-3" aria-label="順序付きの実行内容">
            {result.effects.map((effect, index) => <li key={`${effect.kind}-${index}`} className="grid gap-3 rounded-xl border border-[#17151f]/12 bg-[#fffef9]/85 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>{index + 1}. {effectNames[effect.kind]}</strong>
                <div className="flex flex-wrap gap-1" aria-label={`${index + 1}番目の実行順を編集`}>
                  <Button size="sm" variant="text" disabled={index === 0} aria-label={`${index + 1}番目を上へ移動`} onClick={() => moveEffect(index, index - 1)}>上へ</Button>
                  <Button size="sm" variant="text" disabled={index === result.effects.length - 1} aria-label={`${index + 1}番目を下へ移動`} onClick={() => moveEffect(index, index + 1)}>下へ</Button>
                  {effect.kind !== 'unsupported' && <Button size="sm" variant="text" aria-label={`${index + 1}番目を削除`} onClick={() => replaceResult({ ...result, effects: result.effects.filter((_, itemIndex) => itemIndex !== index) })}>削除</Button>}
                </div>
              </div>
              {effect.kind === 'set-state' && <><MyrialeSelect label={`${index + 1}番目で更新するオブジェクト`} value={effect.targetObjectCode || object.code} onValueChange={(targetObjectCode) => replaceEffect(index, { ...effect, targetObjectCode })} options={value.objects.map((item) => ({ value: item.code, label: `${item.name} / ${item.code}` }))} /><label>更新する状態のcode<Input aria-label={`${index + 1}番目の状態code`} value={effect.stateCode} onChange={(event) => replaceEffect(index, { ...effect, stateCode: event.target.value })} /></label><label>更新後の値<Input aria-label={`${index + 1}番目の更新値`} value={effect.value} onChange={(event) => replaceEffect(index, { ...effect, value: event.target.value })} /></label></>}
              {effect.kind === 'move-object' && <><MyrialeSelect label={`${index + 1}番目で移動するオブジェクト`} value={effect.targetObjectCode || object.code} onValueChange={(targetObjectCode) => replaceEffect(index, { ...effect, targetObjectCode })} options={value.objects.map((item) => ({ value: item.code, label: `${item.name} / ${item.code}` }))} /><MyrialeSelect label={`${index + 1}番目の移動先`} value={effect.locationCode} onValueChange={(locationCode) => replaceEffect(index, { ...effect, locationCode })} options={locationOptions} /></>}
              {effect.kind === 'move-session' && <MyrialeSelect label={`${index + 1}番目のプレイヤー移動先`} value={effect.locationCode} onValueChange={(locationCode) => replaceEffect(index, { ...effect, locationCode })} options={locationOptions} />}
              {effect.kind === 'emit-event' && <><label>出来事の名前<Input aria-label={`${index + 1}番目の出来事の名前`} value={effect.event} placeholder="例: session-moved" onChange={(event) => replaceEffect(index, { ...effect, event: event.target.value })} /></label><label>関連する場所（任意）<Input aria-label={`${index + 1}番目の出来事の場所code`} value={effect.locationCode} list="scenario-location-codes" placeholder="例: outside" onChange={(event) => replaceEffect(index, { ...effect, locationCode: event.target.value })} /></label></>}
              {(effect.kind === 'emit-fact' || effect.kind === 'add-narrative-hint' || effect.kind === 'forbid-narrative-fact') && <label>{effect.kind === 'emit-fact' ? '確定した事実' : effect.kind === 'add-narrative-hint' ? '描写してほしいこと' : '描写してはいけないこと'}<Textarea aria-label={`${index + 1}番目の文章`} value={effect.text} onChange={(event) => replaceEffect(index, { ...effect, text: event.target.value })} /></label>}
              {effect.kind === 'unsupported' && <p className="text-sm text-[#5e596b]">この種類（{effect.type}）はまだ画面で編集できません。保存時に内容を変更せず保持します。</p>}
            </li>)}
          </ol>
          <datalist id="scenario-location-codes">{value.locations.map((location) => <option key={location.code} value={location.code}>{location.name}</option>)}</datalist>
          <Button size="sm" variant="text" onClick={() => { replaceObject({ ...object, actionResults: object.actionResults.filter((item) => item !== result) }); setSelectedResultCode(''); }}>この結果を削除</Button>
        </div>}
      </div>
    </section>
  );
}
