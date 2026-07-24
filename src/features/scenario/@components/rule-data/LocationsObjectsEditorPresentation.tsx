import { useState } from 'react';
import { Button, Input, Textarea } from '../../../../components/ui';
import { EditPane } from '../../../../shared/EditPane';
import { MyrialeSelect } from '../../../../ui/MyrialeRadix';
import {
  createLocation,
  createObject,
  dependencyMessageForLocation,
  type ScenarioRuleData,
} from './scenarioRuleDataModel';

type Props = { value: ScenarioRuleData; onChange: (value: ScenarioRuleData) => void; onNotice: (message: string, danger?: boolean) => void };
type EditingEntity = { kind: 'location' | 'object'; code: string } | null;
const editorClass = 'grid content-start gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4';
const tableClass = 'w-full min-w-[640px] border-collapse text-left text-sm';
const cellClass = 'border-b border-[#17151f]/10 px-3 py-3 align-middle';

export function LocationsObjectsEditorPresentation({ value, onChange, onNotice }: Props) {
  const [editing, setEditing] = useState<EditingEntity>(null);
  const locationIndex = editing?.kind === 'location' ? value.locations.findIndex((item) => item.code === editing.code) : -1;
  const objectIndex = editing?.kind === 'object' ? value.objects.findIndex((item) => item.code === editing.code) : -1;
  const location = value.locations[locationIndex];
  const object = value.objects[objectIndex];

  const replaceLocation = (next: typeof location) => {
    if (!next || locationIndex < 0) return;
    const locations = [...value.locations]; locations[locationIndex] = next; onChange({ ...value, locations });
  };
  const replaceObject = (next: typeof object) => {
    if (!next || objectIndex < 0) return;
    const objects = [...value.objects]; objects[objectIndex] = next; onChange({ ...value, objects });
  };
  const addLocation = () => { const next = createLocation(); onChange({ ...value, locations: [...value.locations, next] }); setEditing({ kind: 'location', code: next.code }); };
  const addObject = () => { const next = createObject(value); onChange({ ...value, objects: [...value.objects, next] }); setEditing({ kind: 'object', code: next.code }); };
  const removeLocation = () => {
    if (!location) return;
    const blocked = dependencyMessageForLocation(value, location.code);
    if (blocked) return onNotice(blocked, true);
    onChange({ ...value, locations: value.locations.filter((item) => item !== location) }); setEditing(null);
  };
  const removeObject = () => { if (object) { onChange({ ...value, objects: value.objects.filter((item) => item !== object) }); setEditing(null); } };

  return (
    <section aria-label="場所とオブジェクト" className="grid gap-7">
      <section className="grid gap-4" aria-labelledby="locations-heading">
        <header className="flex items-end justify-between gap-4 max-md:items-start"><div><h2 id="locations-heading">場所</h2><p>物語の舞台と、雰囲気・危険・アクセス条件を管理します。</p></div><Button size="sm" variant="secondary" onClick={addLocation}>場所を追加</Button></header>
        <div className="overflow-x-auto rounded-2xl border border-[#17151f]/15 bg-white/55 shadow-[0_12px_30px_rgba(23,21,31,.07)]">
          <table className={tableClass}><thead className="bg-[#17151f]/[.045] text-xs text-myr-slate-muted"><tr><th className={cellClass}>編集</th><th className={cellClass}>表示名</th><th className={cellClass}>stable code</th><th className={cellClass}>雰囲気</th><th className={cellClass}>配置数</th></tr></thead><tbody>
            {value.locations.map((item) => <tr key={item.code} className="hover:bg-white/65"><td className={cellClass}><Button size="sm" variant="secondary" onClick={() => setEditing({ kind: 'location', code: item.code })} aria-label={`${item.name}を編集`}>編集</Button></td><td className={cellClass}><strong>{item.name}</strong><span className="mt-0.5 block text-xs text-myr-ink-subtle">{item.description || '説明なし'}</span></td><td className={`${cellClass} font-mono text-xs`}>{item.code}</td><td className={cellClass}>{item.atmosphere || '—'}</td><td className={cellClass}>{value.objects.filter((candidate) => !candidate.global && candidate.initialLocationCode === item.code).length}件</td></tr>)}
          </tbody></table>
          {value.locations.length === 0 && <p className="p-5 text-sm text-myr-ink-subtle">まだ場所がありません。「場所を追加」から登録します。</p>}
        </div>
      </section>

      <section className="grid gap-4" aria-labelledby="objects-heading">
        <header className="flex items-end justify-between gap-4 max-md:items-start"><div><h2 id="objects-heading">オブジェクト</h2><p>種類を選び、初期配置先と状態の上書きを設定します。</p></div><Button size="sm" variant="secondary" onClick={addObject} disabled={value.objectTypes.length === 0}>オブジェクトを追加</Button></header>
        {value.objectTypes.length === 0 && <p className="rounded-xl border border-[#b84a4a]/25 bg-[#b84a4a]/8 p-3 text-sm">先にオブジェクト種類を1つ以上登録してください。</p>}
        <div className="overflow-x-auto rounded-2xl border border-[#17151f]/15 bg-white/55 shadow-[0_12px_30px_rgba(23,21,31,.07)]">
          <table className={tableClass}><thead className="bg-[#17151f]/[.045] text-xs text-myr-slate-muted"><tr><th className={cellClass}>編集</th><th className={cellClass}>表示名</th><th className={cellClass}>stable code</th><th className={cellClass}>種類</th><th className={cellClass}>初期配置</th></tr></thead><tbody>
            {value.objects.map((item) => { const type = value.objectTypes.find((candidate) => candidate.code === item.objectTypeCode); const place = value.locations.find((candidate) => candidate.code === item.initialLocationCode); return <tr key={item.code} className="hover:bg-white/65"><td className={cellClass}><Button size="sm" variant="secondary" onClick={() => setEditing({ kind: 'object', code: item.code })} aria-label={`${item.name}を編集`}>編集</Button></td><td className={cellClass}><strong>{item.name}</strong></td><td className={`${cellClass} font-mono text-xs`}>{item.code}</td><td className={cellClass}>{type?.name ?? item.objectTypeCode}</td><td className={cellClass}>{item.global ? 'すべての場所' : place?.name ?? item.initialLocationCode}</td></tr>; })}
          </tbody></table>
          {value.objects.length === 0 && <p className="p-5 text-sm text-myr-ink-subtle">まだオブジェクトがありません。</p>}
        </div>
      </section>

      <EditPane open={Boolean(location)} onOpenChange={(open) => { if (!open) setEditing(null); }} eyebrow="場所" title={location?.name ?? '場所を編集'} description="舞台としてAIへ渡す説明と空気を編集します。" footer={<Button onClick={() => setEditing(null)}>編集を完了</Button>}>
        {location && <div className={editorClass}>
          <label>stable code<Input aria-label="場所のstable code" value={location.code} onChange={(event) => { const code = event.target.value; replaceLocation({ ...location, code }); setEditing({ kind: 'location', code }); }} /></label>
          <label>表示名<Input aria-label="場所の表示名" value={location.name} onChange={(event) => replaceLocation({ ...location, name: event.target.value })} /></label>
          <label>説明<Textarea aria-label="場所の説明" value={location.description} onChange={(event) => replaceLocation({ ...location, description: event.target.value })} /></label>
          <label>雰囲気<Input aria-label="場所の雰囲気" value={location.atmosphere} onChange={(event) => replaceLocation({ ...location, atmosphere: event.target.value })} /></label>
          <label>危険・アクセス条件<Input aria-label="場所の危険" value={location.danger} onChange={(event) => replaceLocation({ ...location, danger: event.target.value })} /></label>
          <Button size="sm" variant="text" onClick={removeLocation}>この場所を削除</Button>
        </div>}
      </EditPane>

      <EditPane open={Boolean(object)} onOpenChange={(open) => { if (!open) setEditing(null); }} eyebrow="オブジェクト" title={object?.name ?? 'オブジェクトを編集'} description="種類、初期配置、開始時の状態を編集します。" footer={<Button onClick={() => setEditing(null)}>編集を完了</Button>}>
        {object && <div className={editorClass}>
          <label>stable code<Input aria-label="オブジェクトのstable code" value={object.code} onChange={(event) => { const code = event.target.value; replaceObject({ ...object, code }); setEditing({ kind: 'object', code }); }} /></label>
          <label>表示名<Input aria-label="オブジェクトの表示名" value={object.name} onChange={(event) => replaceObject({ ...object, name: event.target.value })} /></label>
          <MyrialeSelect label="オブジェクト種類" value={object.objectTypeCode} onValueChange={(objectTypeCode) => replaceObject({ ...object, objectTypeCode, initialStateOverrides: [], actionResults: [] })} options={value.objectTypes.map((type) => ({ value: type.code, label: `${type.name} / ${type.code}` }))} />
          <label className="!grid-cols-[1fr_auto] items-center"><span>すべての場所で公開</span><input type="checkbox" aria-label="globalオブジェクト" checked={object.global} onChange={(event) => replaceObject({ ...object, global: event.target.checked })} /></label>
          {!object.global && <MyrialeSelect label="初期配置" value={object.initialLocationCode} onValueChange={(initialLocationCode) => replaceObject({ ...object, initialLocationCode })} options={value.locations.map((item) => ({ value: item.code, label: `${item.name} / ${item.code}` }))} />}
          <div className="grid gap-2 rounded-xl border border-[#17151f]/12 bg-[#fffef9]/80 p-3"><strong>初期状態override</strong>{(value.objectTypes.find((type) => type.code === object.objectTypeCode)?.stateFields ?? []).map((field) => { const override = object.initialStateOverrides.find((item) => item.stateCode === field.code); return <label key={field.code}>{field.label}<Input aria-label={`${field.label}の初期override`} placeholder={`default: ${field.defaultValue}`} value={override?.value ?? ''} onChange={(event) => replaceObject({ ...object, initialStateOverrides: [...object.initialStateOverrides.filter((item) => item.stateCode !== field.code), ...(event.target.value ? [{ stateCode: field.code, value: event.target.value }] : [])] })} /></label>; })}</div>
          <Button size="sm" variant="text" onClick={removeObject}>このオブジェクトを削除</Button>
        </div>}
      </EditPane>
    </section>
  );
}
