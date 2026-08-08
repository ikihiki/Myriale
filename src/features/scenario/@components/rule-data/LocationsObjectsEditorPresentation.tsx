import { useRef, useState } from 'react';
import { Button, Input, MarkdownEditor, Textarea } from '../../../../components/ui';
import { EditPane } from '../../../../shared/EditPane';
import { MyrialeSelect } from '../../../../ui/MyrialeRadix';
import { ProfileFieldsEditorPresentation } from './ProfileFieldsEditorPresentation';
import { ObjectResolvedTablesPresentation } from './ObjectResolvedTablesPresentation';
import {
  createLocation,
  createObject,
  dependencyMessageForLocation,
  effectiveObjectRules,
  filterObjectTypesForMixin,
  resolvedObjectConfiguration,
  resolvedObjectProfile,
  type ScenarioActionRule,
  type ScenarioRuleData,
} from './scenarioRuleDataModel';

type Props = {
  value: ScenarioRuleData;
  onChange: (value: ScenarioRuleData) => void;
  onNotice: (message: string, danger?: boolean) => void;
  scope?: 'all' | 'locations' | 'objects';
  protectedLocationCodes?: ReadonlySet<string>;
  onLocationCodeChange?: (previousCode: string, nextCode: string) => void;
};
type EditingEntity = { kind: 'location' | 'object'; code: string } | null;
const editorClass = 'grid content-start gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4';
const tableClass = 'w-full min-w-[640px] border-collapse text-left text-sm';
const cellClass = 'border-b border-[#17151f]/10 px-3 py-3 align-middle';
export function LocationsObjectsEditorPresentation({ value, onChange, onNotice, scope = 'all', protectedLocationCodes, onLocationCodeChange }: Props) {
  const [editing, setEditing] = useState<EditingEntity>(null);
  const showLocations = scope !== 'objects';
  const showObjects = scope !== 'locations';
  const [mixinSearchOpen, setMixinSearchOpen] = useState(false);
  const [mixinSearchQuery, setMixinSearchQuery] = useState('');
  const mixinSearchInputRef = useRef<HTMLInputElement>(null);
  const locationIndex = editing?.kind === 'location' ? value.locations.findIndex((item) => item.code === editing.code) : -1;
  const objectIndex = editing?.kind === 'object' ? value.objects.findIndex((item) => item.code === editing.code) : -1;
  const location = value.locations[locationIndex];
  const object = value.objects[objectIndex];
  const resolved = object ? resolvedObjectConfiguration(value, object) : null;
  const resolvedProfile = object ? resolvedObjectProfile(value, object) : null;
  const effectiveRules = object ? effectiveObjectRules(value, object) : [];
  const mixinCandidates = filterObjectTypesForMixin(value.objectTypes, mixinSearchQuery);
  const replaceLocation = (next: typeof location) => {
    if (!next || !location || locationIndex < 0) return;
    const locations = [...value.locations]; locations[locationIndex] = next;
    const codeChanged = next.code !== location.code;
    const rewriteEffects = (effects: ScenarioActionRule['effects']) => effects.map((effect) => (effect.kind === 'move-object' || effect.kind === 'move-session' || effect.kind === 'emit-event') && effect.locationCode === location.code ? { ...effect, locationCode: next.code } : effect);
    if (codeChanged) onLocationCodeChange?.(location.code, next.code);
    onChange({ ...value, startLocationCode: codeChanged && value.startLocationCode === location.code ? next.code : value.startLocationCode, locations, objects: codeChanged ? value.objects.map((item) => ({ ...item, initialLocationCode: item.initialLocationCode === location.code ? next.code : item.initialLocationCode, actionRules: item.actionRules.map((operation) => operation.operation === 'add' || operation.operation === 'override' ? { ...operation, rule: { ...operation.rule, effects: rewriteEffects(operation.rule.effects) } } : operation.operation === 'adjust' && operation.adjustments.effects ? { ...operation, adjustments: { ...operation.adjustments, effects: rewriteEffects(operation.adjustments.effects) } } : operation) })) : value.objects });
  };
  const replaceObject = (next: typeof object) => {
    if (!next || !object || objectIndex < 0) return;
    const objects = [...value.objects]; objects[objectIndex] = next; onChange({ ...value, objects });
  };
  const addLocation = () => { const next = createLocation(); onChange({ ...value, startLocationCode: value.startLocationCode || next.code, locations: [...value.locations, next] }); setEditing({ kind: 'location', code: next.code }); };
  const addObject = () => { const next = createObject(value); onChange({ ...value, objects: [...value.objects, next] }); setEditing({ kind: 'object', code: next.code }); };
  const removeLocation = () => { if (!location) return; if (value.startLocationCode === location.code) return onNotice('開始場所に選ばれています。「開始状態」ステップで別の開始場所を選択してから削除してください。', true); if (protectedLocationCodes?.has(location.code)) return onNotice('エンティティの初期Locationに選ばれています。別の場所へ移してから削除してください。', true); const blocked = dependencyMessageForLocation(value, location.code); if (blocked) return onNotice(blocked, true); onChange({ ...value, locations: value.locations.filter((item) => item !== location) }); setEditing(null); };
  const removeObject = () => { if (object) { onChange({ ...value, objects: value.objects.filter((item) => item !== object) }); setEditing(null); } };

  return <section aria-label={scope === 'locations' ? '場所' : scope === 'objects' ? 'エンティティ' : '場所とエンティティ'} className="grid gap-7">
    {showLocations && <section className="grid gap-4"><header className="flex items-end justify-between gap-4"><div><h2>場所</h2><p>舞台と配置先を管理します。</p></div><Button size="sm" variant="secondary" onClick={addLocation}>場所を追加</Button></header><div className="overflow-x-auto rounded-2xl border border-[#17151f]/15 bg-white/55"><table className={tableClass}><thead><tr><th className={cellClass}>編集</th><th className={cellClass}>表示名</th><th className={cellClass}>stable code</th><th className={cellClass}>配置数</th></tr></thead><tbody>{value.locations.map((item) => <tr key={item.code}><td className={cellClass}><Button size="sm" variant="secondary" aria-label={`${item.name}を編集`} onClick={() => setEditing({ kind: 'location', code: item.code })}>編集</Button></td><td className={cellClass}>{item.name}</td><td className={`${cellClass} font-mono text-xs`}>{item.code}</td><td className={cellClass}>{value.objects.filter((candidate) => candidate.initialLocationCode === item.code).length}件</td></tr>)}</tbody></table></div></section>}
    {showObjects && <section className="grid gap-4"><header className="flex items-end justify-between gap-4"><div><h2>エンティティ</h2><p>NPC、物品、扉、装置を同じ単位で、Markdownプロフィール・状態・アクション・実行ルールとともに管理します。</p></div><Button size="sm" variant="secondary" onClick={addObject}>エンティティを追加</Button></header><div className="overflow-x-auto rounded-2xl border border-[#17151f]/15 bg-white/55"><table className={tableClass} aria-label="エンティティ一覧"><thead><tr><th className={cellClass}>編集</th><th className={cellClass}>表示名</th><th className={cellClass}>stable code</th><th className={cellClass}>Markdown</th><th className={cellClass}>Type</th><th className={cellClass}>rule operations</th></tr></thead><tbody>{value.objects.map((item) => <tr key={item.code}><td className={cellClass}><Button size="sm" variant="secondary" aria-label={`${item.name}を編集`} onClick={() => setEditing({ kind: 'object', code: item.code })}>編集</Button></td><td className={cellClass}>{item.name}</td><td className={`${cellClass} font-mono text-xs`}>{item.code}</td><td className={cellClass}>{item.profileMarkdown.trim() ? `${item.profileMarkdown.trim().length.toLocaleString()}文字` : '未入力'}</td><td className={cellClass}>{item.mixinTypeCodes.join(' + ') || 'Entity local'}</td><td className={cellClass}>{item.actionRules.length}件</td></tr>)}</tbody></table></div></section>}

    <EditPane open={Boolean(location)} onOpenChange={(open) => { if (!open) setEditing(null); }} eyebrow="場所" title={location?.name ?? '場所を編集'} description="舞台としてAIへ渡す説明と空気を編集します。" footer={<Button onClick={() => setEditing(null)}>編集を完了</Button>}>{location && <div className={editorClass}><label>stable code<Input aria-label="場所のstable code" value={location.code} onChange={(event) => { replaceLocation({ ...location, code: event.target.value }); setEditing({ kind: 'location', code: event.target.value }); }} /></label><label>表示名<Input aria-label="場所の表示名" value={location.name} onChange={(event) => replaceLocation({ ...location, name: event.target.value })} /></label><label>説明<Textarea aria-label="場所の説明" value={location.description} onChange={(event) => replaceLocation({ ...location, description: event.target.value })} /></label><label>雰囲気<Input aria-label="場所の雰囲気" value={location.atmosphere} onChange={(event) => replaceLocation({ ...location, atmosphere: event.target.value })} /></label><label>危険<Input aria-label="場所の危険" value={location.danger} onChange={(event) => replaceLocation({ ...location, danger: event.target.value })} /></label><Button size="sm" variant="text" onClick={removeLocation}>この場所を削除</Button></div>}</EditPane>

    <EditPane open={Boolean(object)} onOpenChange={(open) => { if (!open) { setEditing(null); setMixinSearchOpen(false); setMixinSearchQuery(''); } }} eyebrow="エンティティ" title={object?.name ?? 'エンティティを編集'} description="NPC、物品、扉、装置を共通のEntityとして編集します。Markdownは外観・人物像・材質・描写指針を自由に記述できます。" footer={<Button onClick={() => { setEditing(null); setMixinSearchOpen(false); setMixinSearchQuery(''); }}>編集を完了</Button>}>{object && <div className={editorClass}>
      <label>stable code<Input aria-label="エンティティのstable code" value={object.code} onChange={(event) => { replaceObject({ ...object, code: event.target.value }); setEditing({ kind: 'object', code: event.target.value }); }} /></label><label>表示名<Input aria-label="エンティティの表示名" value={object.name} onChange={(event) => replaceObject({ ...object, name: event.target.value })} /></label>
      <MarkdownEditor label="エンティティプロフィール" value={object.profileMarkdown} onChange={(profileMarkdown) => replaceObject({ ...object, profileMarkdown })} placeholder={'## 外観・概要\n\n外観、人物像、材質などを記述します。\n\n## 描写指針\n\n現在状態やfactsに応じた描写方針を記述します。'} help="人物・物品を問わずAIへ渡される非公開の描写資料です。現在状態、公開済みfacts、禁止factsが正史として優先されます。" />
      <section className="grid gap-4 rounded-xl border border-[#17151f]/12 p-3" aria-label="構造化プロフィール">
        <ProfileFieldsEditorPresentation title="Entity固有プロフィール項目" description="再利用Typeを作らない、このEntityだけの静的プロフィール項目を宣言します。" fields={object.localProfileFields} defaults={object.localProfileDefaults} onChange={({ fields, defaults }) => replaceObject({ ...object, localProfileFields: fields, localProfileDefaults: defaults })} />
        <div className="grid gap-2"><h3>解決済みプロフィール</h3><p className="text-sm text-myr-ink-subtle">ordered mixin、Entity固有default、Entity値の順で解決したプレビューです。</p>
          {(resolvedProfile?.conflicts.length ?? 0) > 0 && <div role="alert" className="rounded-lg border border-[#a8324a]/35 bg-[#a8324a]/8 p-3 text-sm text-[#7b2337]">プロフィール定義が競合しています。</div>}
          {resolvedProfile?.fields.map((field) => <label key={field.code}>{field.label}{field.required ? '（必須）' : ''}<span className="text-xs text-myr-ink-subtle">{field.code} / {field.valueType} / {field.source}{field.defaultValue !== null ? ` / default: ${field.defaultValue}` : ''}</span><Input aria-label={`${field.code}のプロフィール値`} disabled={Boolean(field.conflict)} value={field.value ?? ''} placeholder={field.defaultValue ?? ''} onChange={(event) => { const without = object.profileValues.filter((item) => item.profileCode !== field.code); replaceObject({ ...object, profileValues: event.target.value === '' ? without : [...without, { profileCode: field.code, value: event.target.value }] }); }} /><span className="text-xs">解決値: {field.effectiveValue ?? '未入力'}</span></label>)}
          {resolvedProfile?.fields.length === 0 && <p className="text-sm text-myr-ink-subtle">構造化プロフィール項目はありません。</p>}
        </div>
      </section>
      <section aria-label="ordered Type mixins" className="grid gap-3 rounded-xl border border-[#17151f]/12 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong>ordered Type mixins</strong>
          <Button size="sm" variant="secondary" onClick={() => { setMixinSearchQuery(''); setMixinSearchOpen(true); }}>Type mixinを追加</Button>
        </div>
        {object.mixinTypeCodes.length === 0 && <p className="text-sm text-myr-ink-subtle">Type mixinはまだ追加されていません。</p>}
        {object.mixinTypeCodes.map((code, index, codes) => {
          const typeName = value.objectTypes.find((type) => type.code === code)?.name ?? code;
          return <div key={`${code}-${index}`} className="flex items-center gap-2">
            <span className="flex-1">{typeName}</span>
            <Button size="sm" variant="text" aria-label={`${typeName}を上へ移動`} disabled={index === 0} onClick={() => { const next = [...codes]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; replaceObject({ ...object, mixinTypeCodes: next }); }}>↑</Button>
            <Button size="sm" variant="text" aria-label={`${typeName}を下へ移動`} disabled={index === codes.length - 1} onClick={() => { const next = [...codes]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; replaceObject({ ...object, mixinTypeCodes: next }); }}>↓</Button>
            <Button size="sm" variant="text" aria-label={`${typeName}を削除`} onClick={() => replaceObject({ ...object, mixinTypeCodes: codes.filter((_, itemIndex) => itemIndex !== index) })}>削除</Button>
          </div>;
        })}
      </section>
      <label className="!grid-cols-[1fr_auto] items-center"><span>すべての場所で公開</span><input type="checkbox" aria-label="globalエンティティ" checked={object.global} onChange={(event) => replaceObject({ ...object, global: event.target.checked })} /></label>{!object.global && <MyrialeSelect label="初期配置" value={object.initialLocationCode} onValueChange={(initialLocationCode) => replaceObject({ ...object, initialLocationCode })} options={value.locations.map((item) => ({ value: item.code, label: `${item.name} / ${item.code}` }))} />}
      <ObjectResolvedTablesPresentation value={value} object={object} states={resolved?.stateFields ?? []} actions={resolved?.actions ?? []} rules={effectiveRules} conflicts={resolved?.conflicts ?? []} onChange={replaceObject} onNotice={onNotice} />
      <Button size="sm" variant="text" onClick={removeObject}>このエンティティを削除</Button>
    </div>}</EditPane>

    <EditPane
      layer={1}
      open={Boolean(object) && mixinSearchOpen}
      onOpenChange={(open) => { setMixinSearchOpen(open); if (!open) setMixinSearchQuery(''); }}
      eyebrow="エンティティの種類"
      title="追加するType mixinを選ぶ"
      description="このエンティティに受け継がせたい種類を検索して追加します。追加した種類は一覧の末尾に並びます。"
      initialFocusRef={mixinSearchInputRef}
      footer={<Button onClick={() => { setMixinSearchOpen(false); setMixinSearchQuery(''); }}>選択をやめる</Button>}
    >
      {object && <div className="grid gap-4">
        <label className="grid gap-2" htmlFor="type-mixin-search">
          <span className="font-semibold">種類を検索</span>
          <Input
            id="type-mixin-search"
            ref={mixinSearchInputRef}
            type="search"
            value={mixinSearchQuery}
            onChange={(event) => setMixinSearchQuery(event.target.value)}
            placeholder="表示名・stable code・説明で検索"
            aria-describedby="type-mixin-search-help type-mixin-search-results"
          />
        </label>
        <p id="type-mixin-search-help" className="text-sm text-myr-ink-subtle">入力した文字を含む候補を表示します。大文字と小文字は区別しません。</p>
        <p id="type-mixin-search-results" className="text-sm text-myr-ink-subtle" aria-live="polite">{mixinCandidates.length}件の候補</p>
        {value.objectTypes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#17151f]/20 bg-white/45 p-5 text-sm text-myr-ink-subtle" role="status">追加できるTypeがまだ登録されていません。先にエンティティ種類を作成してください。</div>
        ) : mixinCandidates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#17151f]/20 bg-white/45 p-5 text-sm text-myr-ink-subtle" role="status">検索条件に一致するTypeはありません。別の名前、stable code、または説明で検索してください。</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#17151f]/12 bg-white/70">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <caption className="sr-only">追加できるType mixinの候補</caption>
              <thead className="bg-[#17151f]/[.045] text-xs text-myr-slate-muted"><tr><th className={cellClass}>表示名</th><th className={cellClass}>stable code</th><th className={cellClass}>説明</th><th className={cellClass}>状態</th><th className={cellClass}>操作</th></tr></thead>
              <tbody>{mixinCandidates.map((type) => {
                const alreadyAdded = object.mixinTypeCodes.includes(type.code);
                return <tr key={type.code}>
                  <td className={cellClass}><strong>{type.name}</strong></td>
                  <td className={`${cellClass} font-mono text-xs`}>{type.code}</td>
                  <td className={cellClass}>{type.description || '説明なし'}</td>
                  <td className={cellClass}>{alreadyAdded ? '追加済み' : '未追加'}</td>
                  <td className={cellClass}><Button
                    size="sm"
                    variant="secondary"
                    disabled={alreadyAdded}
                    aria-label={alreadyAdded ? `${type.name}は追加済み` : `${type.name}を追加`}
                    onClick={() => {
                      if (object.mixinTypeCodes.includes(type.code)) return;
                      replaceObject({ ...object, mixinTypeCodes: [...object.mixinTypeCodes, type.code] });
                      setMixinSearchOpen(false);
                      setMixinSearchQuery('');
                    }}
                  >{alreadyAdded ? '追加済み' : '追加'}</Button></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        )}
      </div>}
    </EditPane>


  </section>;
}
