import { useEffect, useState } from 'react';
import { Button, Input, Textarea } from '../../../../components/ui';
import { MyrialeSelect } from '../../../../ui/MyrialeRadix';
import {
  createLocation,
  createObject,
  dependencyMessageForLocation,
  type ScenarioRuleData,
} from './scenarioRuleDataModel';

type Props = { value: ScenarioRuleData; onChange: (value: ScenarioRuleData) => void; onNotice: (message: string, danger?: boolean) => void };
const cardClass = 'grid content-start gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4 shadow-[0_12px_30px_rgba(23,21,31,.07)]';
const itemClass = 'grid cursor-pointer gap-0.5 rounded-xl border border-[#17151f]/12 bg-white/70 px-3 py-2 text-left aria-pressed:border-[#b84a4a] aria-pressed:bg-[#b84a4a]/10';

export function LocationsObjectsEditorPresentation({ value, onChange, onNotice }: Props) {
  const [selectedLocation, setSelectedLocation] = useState(value.locations[0]?.code ?? '');
  const [selectedObject, setSelectedObject] = useState(value.objects[0]?.code ?? '');
  const locationIndex = value.locations.findIndex((item) => item.code === selectedLocation);
  const objectIndex = value.objects.findIndex((item) => item.code === selectedObject);
  const location = value.locations[locationIndex];
  const object = value.objects[objectIndex];

  useEffect(() => { if (!location && value.locations[0]) setSelectedLocation(value.locations[0].code); }, [location, value.locations]);
  useEffect(() => { if (!object && value.objects[0]) setSelectedObject(value.objects[0].code); }, [object, value.objects]);

  const replaceLocation = (next: typeof location) => {
    if (!next || locationIndex < 0) return;
    const locations = [...value.locations]; locations[locationIndex] = next; onChange({ ...value, locations });
  };
  const replaceObject = (next: typeof object) => {
    if (!next || objectIndex < 0) return;
    const objects = [...value.objects]; objects[objectIndex] = next; onChange({ ...value, objects });
  };
  const addLocation = () => { const next = createLocation(); onChange({ ...value, locations: [...value.locations, next] }); setSelectedLocation(next.code); };
  const addObject = () => { const next = createObject(value); onChange({ ...value, objects: [...value.objects, next] }); setSelectedObject(next.code); };
  const removeLocation = () => {
    if (!location) return;
    const blocked = dependencyMessageForLocation(value, location.code);
    if (blocked) return onNotice(blocked, true);
    onChange({ ...value, locations: value.locations.filter((item) => item !== location) }); setSelectedLocation('');
  };
  const removeObject = () => { if (object) { onChange({ ...value, objects: value.objects.filter((item) => item !== object) }); setSelectedObject(''); } };

  return (
    <section aria-label="場所とオブジェクト配置" className="grid gap-4">
      <header><h2>World placement board</h2><p>場所を先に作り、各オブジェクトを1つの初期配置先へ置きます。globalを選ぶと場所を問わず列挙されます。</p></header>
      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <div className={cardClass}>
          <div className="flex items-center justify-between gap-2"><h3>場所</h3><Button size="sm" variant="secondary" onClick={addLocation}>場所を追加</Button></div>
          <div className="grid grid-cols-[minmax(150px,.36fr)_1fr] gap-3 max-md:grid-cols-1">
            <div className="grid content-start gap-2" aria-label="場所一覧">{value.locations.map((item) => <button key={item.code} type="button" className={itemClass} aria-pressed={item.code === selectedLocation} onClick={() => setSelectedLocation(item.code)}><strong>{item.name}</strong><span className="font-mono text-[11px]">{item.code}</span></button>)}</div>
            {location ? <div className="grid content-start gap-2"><label>stable code<Input aria-label="場所のstable code" value={location.code} onChange={(event) => { const code = event.target.value; replaceLocation({ ...location, code }); setSelectedLocation(code); }} /></label><label>表示名<Input aria-label="場所の表示名" value={location.name} onChange={(event) => replaceLocation({ ...location, name: event.target.value })} /></label><label>説明<Textarea aria-label="場所の説明" value={location.description} onChange={(event) => replaceLocation({ ...location, description: event.target.value })} /></label><label>雰囲気<Input aria-label="場所の雰囲気" value={location.atmosphere} onChange={(event) => replaceLocation({ ...location, atmosphere: event.target.value })} /></label><label>危険・アクセス条件<Input aria-label="場所の危険" value={location.danger} onChange={(event) => replaceLocation({ ...location, danger: event.target.value })} /></label><Button size="sm" variant="text" onClick={removeLocation}>この場所を削除</Button></div> : <p>場所を追加して世界の基点を作ります。</p>}
          </div>
        </div>
        <div className={cardClass}>
          <div className="flex items-center justify-between gap-2"><h3>オブジェクト</h3><Button size="sm" variant="secondary" onClick={addObject} disabled={value.objectTypes.length === 0}>オブジェクトを追加</Button></div>
          {value.objectTypes.length === 0 && <p>先にオブジェクト種類を1つ以上登録してください。</p>}
          <div className="grid grid-cols-[minmax(150px,.36fr)_1fr] gap-3 max-md:grid-cols-1">
            <div className="grid content-start gap-2" aria-label="オブジェクト一覧">{value.objects.map((item) => <button key={item.code} type="button" className={itemClass} aria-pressed={item.code === selectedObject} onClick={() => setSelectedObject(item.code)}><strong>{item.name}</strong><span className="font-mono text-[11px]">{item.code}</span></button>)}</div>
            {object && <div className="grid content-start gap-2"><label>stable code<Input aria-label="オブジェクトのstable code" value={object.code} onChange={(event) => { const code = event.target.value; replaceObject({ ...object, code }); setSelectedObject(code); }} /></label><label>表示名<Input aria-label="オブジェクトの表示名" value={object.name} onChange={(event) => replaceObject({ ...object, name: event.target.value })} /></label><MyrialeSelect label="オブジェクト種類" value={object.objectTypeCode} onValueChange={(objectTypeCode) => replaceObject({ ...object, objectTypeCode, initialStateOverrides: [], actionResults: [] })} options={value.objectTypes.map((type) => ({ value: type.code, label: `${type.name} / ${type.code}` }))} /><label className="!grid-cols-[1fr_auto] items-center"><span>すべての場所で公開</span><input type="checkbox" aria-label="globalオブジェクト" checked={object.global} onChange={(event) => replaceObject({ ...object, global: event.target.checked })} /></label>{!object.global && <MyrialeSelect label="初期配置" value={object.initialLocationCode} onValueChange={(initialLocationCode) => replaceObject({ ...object, initialLocationCode })} options={value.locations.map((item) => ({ value: item.code, label: `${item.name} / ${item.code}` }))} />}
              <div className="rounded-xl border border-[#17151f]/12 bg-[#fffef9]/80 p-3"><strong>初期状態override</strong>{(value.objectTypes.find((type) => type.code === object.objectTypeCode)?.stateFields ?? []).map((field) => { const override = object.initialStateOverrides.find((item) => item.stateCode === field.code); return <label key={field.code}>{field.label}<Input aria-label={`${field.label}の初期override`} placeholder={`default: ${field.defaultValue}`} value={override?.value ?? ''} onChange={(event) => replaceObject({ ...object, initialStateOverrides: [...object.initialStateOverrides.filter((item) => item.stateCode !== field.code), ...(event.target.value ? [{ stateCode: field.code, value: event.target.value }] : [])] })} /></label>; })}</div>
              <Button size="sm" variant="text" onClick={removeObject}>このオブジェクトを削除</Button></div>}
          </div>
        </div>
      </div>
    </section>
  );
}
