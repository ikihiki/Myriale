import { useMemo, useState } from 'react';
import type { ScenarioJsonObject, ScenarioRuleDebugRequest, ScenarioRuleDebugResponse } from '../../../../app/scenarioApi';
import { Button, Notice, Textarea } from '../../../../components/ui';
import { MyrialeSelect } from '../../../../ui/MyrialeRadix';
import type { ScenarioFormActions, ScenarioFormValues } from '../scenarioFormModel';
import { resolvedObjectConfiguration } from '../rule-data/scenarioRuleDataModel';

type Props = {
  scenarioId: string;
  values: ScenarioFormValues;
  execute: ScenarioFormActions['debug'];
};

function typedValue(value: string, type: 'boolean' | 'string' | 'number') {
  if (type === 'boolean') return value === 'true';
  if (type === 'number') return Number(value || 0);
  return value;
}

export function ScenarioRuleDebugPresentation({ scenarioId, values, execute }: Props) {
  const locations = values.ruleData.locations;
  const objects = useMemo(() => values.ruleData.objects.map((object) => {
    const resolved = resolvedObjectConfiguration(values.ruleData, object);
    return {
      object,
      actions: resolved.actions,
      initialState: Object.fromEntries(resolved.stateFields.map((field) => [field.code, typedValue(field.effectiveInitialValue, field.valueType)])) as ScenarioJsonObject,
    };
  }), [values.ruleData]);
  const [currentLocationCode, setCurrentLocationCode] = useState(values.ruleData.startLocationCode || locations[0]?.code || '');
  const [objectLocations, setObjectLocations] = useState<Record<string, string>>(() => Object.fromEntries(objects.map(({ object }) => [object.code, object.initialLocationCode])));
  const [objectStates, setObjectStates] = useState<Record<string, string>>(() => Object.fromEntries(objects.map(({ object, initialState }) => [object.code, JSON.stringify(initialState, null, 2)])));
  const [flagsText, setFlagsText] = useState('{}');
  const [selectedObjectCode, setSelectedObjectCode] = useState(objects[0]?.object.code ?? '');
  const selectedObject = objects.find(({ object }) => object.code === selectedObjectCode);
  const [selectedActionCode, setSelectedActionCode] = useState(selectedObject?.actions[0]?.code ?? '');
  const [argumentsText, setArgumentsText] = useState('{}');
  const [playerInput, setPlayerInput] = useState('');
  const [result, setResult] = useState<ScenarioRuleDebugResponse | null>(null);
  const [notice, setNotice] = useState(scenarioId === '未発行' ? '先に下書き保存してScenarioIdを発行してください。' : '保存済みのルール定義を、隔離された状態で実行します。');
  const [working, setWorking] = useState(false);

  const chooseObject = (code: string) => {
    setSelectedObjectCode(code);
    setSelectedActionCode(objects.find(({ object }) => object.code === code)?.actions[0]?.code ?? '');
  };

  const run = async (trigger: ScenarioRuleDebugRequest['trigger']) => {
    if (scenarioId === '未発行') return;
    setWorking(true);
    try {
      const request: ScenarioRuleDebugRequest = {
        trigger,
        currentLocationCode,
        flags: JSON.parse(flagsText) as Record<string, boolean>,
        objects: objects.map(({ object }) => ({
          objectCode: object.code,
          locationCode: objectLocations[object.code] ?? object.initialLocationCode,
          state: JSON.parse(objectStates[object.code] ?? '{}') as ScenarioJsonObject,
        })),
        objectCode: selectedObjectCode,
        actionCode: selectedActionCode,
        arguments: JSON.parse(argumentsText) as ScenarioJsonObject,
        playerInput,
      };
      const response = await execute(values, request);
      setNotice(response.message);
      setResult(response.value ?? null);
    } catch (error) {
      setNotice(error instanceof SyntaxError ? '状態・フラグ・引数はJSONオブジェクトで入力してください。' : 'デバッグ実行に失敗しました。');
    } finally {
      setWorking(false);
    }
  };

  return <section className="grid gap-5" aria-label="ルールエンジンデバッグ">
    <header className="grid gap-2 border-b border-[#17151f]/15 pb-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#5c4f8f]">Isolated rule laboratory</p>
      <h2>状態を組み替えて、結果だけを見る</h2>
      <p>現在地・全オブジェクトの配置と状態・Session flags・引数を自由に上書きできます。実行結果はDraftや本番Sessionへ書き戻しません。</p>
      <Notice tone={notice.includes('失敗') || notice.includes('してください') ? 'danger' : 'info'} data-testid="debug-notice">{notice}</Notice>
    </header>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,.9fr)]">
      <div className="grid gap-4">
        <section className="grid gap-3 rounded-2xl border border-[#17151f]/15 bg-white/60 p-4" aria-label="デバッグ世界状態">
          <h3>世界状態</h3>
          <MyrialeSelect label="現在地" value={currentLocationCode} onValueChange={setCurrentLocationCode} options={locations.map((location) => ({ value: location.code, label: `${location.name} (${location.code})` }))} />
          <label>Session flags (JSON)<Textarea className="!min-h-24" aria-label="Session flags" value={flagsText} onChange={(event) => setFlagsText(event.target.value)} /></label>
          {objects.map(({ object }) => <article key={object.code} className="grid gap-2 border-t border-[#17151f]/10 pt-3">
            <strong>{object.name} <code>{object.code}</code></strong>
            <MyrialeSelect label={`${object.name}の配置`} value={objectLocations[object.code] ?? ''} onValueChange={(value) => setObjectLocations((current) => ({ ...current, [object.code]: value }))} options={locations.map((location) => ({ value: location.code, label: location.name }))} />
            <label>{object.name}のstate (JSON)<Textarea className="!min-h-28" aria-label={`${object.name}のstate`} value={objectStates[object.code] ?? '{}'} onChange={(event) => setObjectStates((current) => ({ ...current, [object.code]: event.target.value }))} /></label>
          </article>)}
          <Button variant="secondary" size="sm" disabled={working || !locations.length} onClick={() => void run('enumerate')}>公開状態とアクションを確認</Button>
        </section>

        <section className="grid gap-3 rounded-2xl border border-[#17151f]/15 bg-white/60 p-4" aria-label="デバッグトリガー">
          <h3>トリガー</h3>
          <MyrialeSelect label="対象オブジェクト" value={selectedObjectCode} onValueChange={chooseObject} options={objects.map(({ object }) => ({ value: object.code, label: object.name }))} />
          <MyrialeSelect label="直接発動するアクション" value={selectedActionCode} onValueChange={setSelectedActionCode} options={(selectedObject?.actions ?? []).map((action) => ({ value: action.code, label: `${action.label} (${action.visibility})` }))} />
          <label>アクション引数 (JSON)<Textarea className="!min-h-24" aria-label="アクション引数" value={argumentsText} onChange={(event) => setArgumentsText(event.target.value)} /></label>
          <Button variant="primary" size="sm" disabled={working || !selectedActionCode} onClick={() => void run('direct-action')}>アクションを直接発動</Button>
          <label>ユーザー入力<Textarea className="!min-h-28" aria-label="デバッグ用ユーザー入力" value={playerInput} onChange={(event) => setPlayerInput(event.target.value)} placeholder="例: 扉をゆっくり開ける" /></label>
          <Button variant="primary" size="sm" disabled={working || !playerInput.trim()} onClick={() => void run('player-input')}>入力から起きることを確認</Button>
        </section>
      </div>

      <aside className="grid content-start gap-3 rounded-2xl border border-[#17151f]/15 bg-[#17151f] p-4 text-[#f7f3ea]" aria-label="デバッグ実行結果">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b9a9ff]">Runtime trace</p>
        <h3>実行結果</h3>
        {!result && <p>世界状態を確認するか、トリガーを実行すると snapshot / selected rule / effects / post-state を表示します。</p>}
        {result && <>
          <p><strong>現在地:</strong> {result.snapshot.currentLocation.name}</p>
          <p><strong>利用可能:</strong> {result.snapshot.actions.filter((action) => action.enabled).map((action) => action.label).join(' / ') || 'なし'}</p>
          <p><strong>選択rule:</strong> {result.selectedRuleCode ?? '未選択'}</p>
          <pre className="max-h-44 overflow-auto whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-xs" data-testid="debug-effects">{JSON.stringify(result.appliedEffects, null, 2)}</pre>
          {result.postState && <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-xs" data-testid="debug-post-state">{JSON.stringify(result.postState, null, 2)}</pre>}
          {(result.facts.length > 0 || result.hints.length > 0) && <div><strong>物語への材料</strong><ul>{[...result.facts, ...result.hints].map((text) => <li key={text}>{text}</li>)}</ul></div>}
        </>}
      </aside>
    </div>
  </section>;
}
