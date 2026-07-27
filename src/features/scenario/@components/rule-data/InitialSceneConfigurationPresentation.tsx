import { Input } from '../../../../components/ui';
import { MyrialeSelect } from '../../../../ui/MyrialeRadix';
import { resolvedObjectConfiguration, type ResolvedStateField, type ScenarioObject, type ScenarioRuleData } from './scenarioRuleDataModel';

type Props = {
  value: ScenarioRuleData;
  onChange: (value: ScenarioRuleData) => void;
};

const cardClass = 'grid gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4';

export function InitialSceneConfigurationPresentation({ value, onChange }: Props) {
  const replaceObject = (object: ScenarioObject, next: ScenarioObject) => {
    onChange({ ...value, objects: value.objects.map((candidate) => candidate.code === object.code ? next : candidate) });
  };
  const setInitialValue = (object: ScenarioObject, state: ResolvedStateField, nextValue: string) => {
    if (state.conflict) return;
    const without = object.initialStateOverrides.filter((item) => item.stateCode !== state.code);
    replaceObject(object, {
      ...object,
      initialStateOverrides: nextValue === state.baseInitialValue ? without : [...without, { stateCode: state.code, value: nextValue }],
    });
  };

  return <section className="grid gap-5" aria-label="第一場面の初期設定">
    <section className={cardClass} aria-labelledby="start-location-heading">
      <div>
        <h3 id="start-location-heading">開始場所</h3>
        <p className="text-sm text-myr-ink-subtle">セッション開始時にプレイヤーがいる場所を選択します。</p>
      </div>
      {value.locations.length === 0
        ? <p className="text-sm text-[#9b3030]">先に「世界データ」で場所を追加してください。</p>
        : <MyrialeSelect
            label="セッション開始場所"
            value={value.startLocationCode ?? ''}
            onValueChange={(startLocationCode) => onChange({ ...value, startLocationCode })}
            options={value.locations.map((location) => ({ value: location.code, label: `${location.name} / ${location.code}` }))}
          />}
    </section>

    <section className="grid gap-4" aria-labelledby="initial-states-heading">
      <div>
        <h3 id="initial-states-heading">各オブジェクトの初期ステート</h3>
        <p className="text-sm text-myr-ink-subtle">種類で定義したdefaultを基準に、第一場面で使う各Objectの初期値を上書きできます。</p>
      </div>
      {value.objects.length === 0 && <p className="text-sm text-myr-ink-subtle">初期ステートを設定するオブジェクトはありません。</p>}
      {value.objects.map((object) => {
        const states = resolvedObjectConfiguration(value, object).stateFields;
        return <article key={object.code} className={cardClass} aria-label={`${object.name}の初期ステート`}>
          <header className="flex flex-wrap items-baseline justify-between gap-2">
            <h4>{object.name}</h4>
            <code className="text-xs text-myr-slate-muted">{object.code}</code>
          </header>
          {states.length === 0 && <p className="text-sm text-myr-ink-subtle">このオブジェクトにステートはありません。</p>}
          <div className="grid gap-3 md:grid-cols-2">
            {states.map((state) => <div key={state.code} className="grid gap-1 rounded-xl border border-[#17151f]/10 bg-white/65 p-3">
              <div className="flex items-center justify-between gap-2"><strong>{state.label}</strong><code className="text-xs">{state.code}</code></div>
              <p className="text-xs text-myr-ink-subtle">基準値: {state.baseInitialValue} / {state.valueType}{state.hasInitialOverride ? ' / 上書き中' : ''}</p>
              {state.conflict ? <p className="text-sm text-[#9b3030]">競合を世界データで解消してください。</p> : state.valueType === 'boolean' ? (
                <MyrialeSelect
                  label={`${object.name}の${state.label}初期値`}
                  value={state.effectiveInitialValue}
                  onValueChange={(nextValue) => setInitialValue(object, state, nextValue)}
                  options={[{ value: 'false', label: 'false' }, { value: 'true', label: 'true' }]}
                />
              ) : (
                <label>{state.label}の初期値<Input
                  type={state.valueType === 'number' ? 'number' : 'text'}
                  aria-label={`${object.name}の${state.label}初期値`}
                  value={state.effectiveInitialValue}
                  onChange={(event) => setInitialValue(object, state, event.target.value)}
                /></label>
              )}
            </div>)}
          </div>
        </article>;
      })}
    </section>
  </section>;
}
