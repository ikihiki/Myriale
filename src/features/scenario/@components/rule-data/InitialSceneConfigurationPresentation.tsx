import { Input } from '../../../../components/ui';
import { MyrialeSelect } from '../../../../ui/MyrialeRadix';
import { resolvedObjectConfiguration, type ResolvedStateField, type ScenarioObject, type ScenarioRuleData } from './scenarioRuleDataModel';

type Props = {
  value: ScenarioRuleData;
  onChange: (value: ScenarioRuleData) => void;
};

const cardClass = 'grid gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4';
const tableClass = 'w-full min-w-[760px] border-collapse text-left text-sm';
const cellClass = 'border-b border-[#17151f]/10 px-3 py-3 align-middle';

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
            value={value.startLocationCode}
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
          {states.length === 0 ? <p className="text-sm text-myr-ink-subtle">このオブジェクトにステートはありません。</p> : (
            <div className="overflow-x-auto rounded-xl border border-[#17151f]/12 bg-white/70">
              <table className={tableClass} aria-label={`${object.name}の初期ステート一覧`}>
                <thead className="bg-[#17151f]/[.045] text-xs text-myr-slate-muted">
                  <tr>
                    <th className={cellClass}>ステート</th>
                    <th className={cellClass}>stable code</th>
                    <th className={cellClass}>型</th>
                    <th className={cellClass}>基準値</th>
                    <th className={cellClass}>初期値</th>
                    <th className={cellClass}>設定状態</th>
                  </tr>
                </thead>
                <tbody>
                  {states.map((state) => <tr key={state.code}>
                    <th scope="row" className={cellClass}>{state.label}</th>
                    <td className={`${cellClass} font-mono text-xs`}>{state.code}</td>
                    <td className={cellClass}>{state.valueType}</td>
                    <td className={`${cellClass} font-mono text-xs`}>{state.baseInitialValue}</td>
                    <td className={`${cellClass} min-w-52`}>
                      {state.conflict ? <span className="text-sm text-[#9b3030]">編集不可</span> : state.valueType === 'boolean' ? (
                        <MyrialeSelect
                          label={`${object.name}の${state.label}初期値`}
                          value={state.effectiveInitialValue}
                          onValueChange={(nextValue) => setInitialValue(object, state, nextValue)}
                          options={[{ value: 'false', label: 'false' }, { value: 'true', label: 'true' }]}
                        />
                      ) : (
                        <Input
                          type={state.valueType === 'number' ? 'number' : 'text'}
                          aria-label={`${object.name}の${state.label}初期値`}
                          value={state.effectiveInitialValue}
                          onChange={(event) => setInitialValue(object, state, event.target.value)}
                        />
                      )}
                    </td>
                    <td className={cellClass}>{state.conflict
                      ? <span className="text-[#9b3030]">世界データで競合を解消してください。</span>
                      : state.hasInitialOverride
                        ? <strong className="text-[#72540b]">上書き中</strong>
                        : <span className="text-myr-ink-subtle">基準値を使用</span>}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          )}
        </article>;
      })}
    </section>
  </section>;
}
