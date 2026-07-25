import { useRef, useState } from 'react';
import { Button, Input, Textarea } from '../../../../components/ui';
import { EditPane } from '../../../../shared/EditPane';
import { MyrialeSelect } from '../../../../ui/MyrialeRadix';
import { ObjectActionRuleEditorPresentation } from './ObjectActionRuleEditorPresentation';
import { RuleConfigurationEditorPresentation } from './RuleConfigurationEditorPresentation';
import {
  createLocation,
  createObject,
  createObjectAddRule,
  dependencyMessageForLocation,
  effectiveObjectRules,
  filterObjectTypesForMixin,
  resolvedObjectConfiguration,
  type ScenarioActionRule,
  type ScenarioObjectRuleOperation,
  type ScenarioRuleData,
} from './scenarioRuleDataModel';

type Props = { value: ScenarioRuleData; onChange: (value: ScenarioRuleData) => void; onNotice: (message: string, danger?: boolean) => void };
type EditingEntity = { kind: 'location' | 'object'; code: string } | null;
const editorClass = 'grid content-start gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4';
const tableClass = 'w-full min-w-[640px] border-collapse text-left text-sm';
const cellClass = 'border-b border-[#17151f]/10 px-3 py-3 align-middle';
const adjustmentFields = ['condition', 'priority', 'effects', 'note', 'moduleBinding'] as const;

export function LocationsObjectsEditorPresentation({ value, onChange, onNotice }: Props) {
  const [editing, setEditing] = useState<EditingEntity>(null);
  const [editingOperationIndex, setEditingOperationIndex] = useState<number | null>(null);
  const [mixinSearchOpen, setMixinSearchOpen] = useState(false);
  const [mixinSearchQuery, setMixinSearchQuery] = useState('');
  const mixinSearchInputRef = useRef<HTMLInputElement>(null);
  const locationIndex = editing?.kind === 'location' ? value.locations.findIndex((item) => item.code === editing.code) : -1;
  const objectIndex = editing?.kind === 'object' ? value.objects.findIndex((item) => item.code === editing.code) : -1;
  const location = value.locations[locationIndex];
  const object = value.objects[objectIndex];
  const resolved = object ? resolvedObjectConfiguration(value, object) : null;
  const effectiveRules = object ? effectiveObjectRules(value, object) : [];
  const mixinCandidates = filterObjectTypesForMixin(value.objectTypes, mixinSearchQuery);
  const editingOperation = object && editingOperationIndex !== null ? object.actionRules[editingOperationIndex] : undefined;
  const editingEffective = editingOperationIndex === null ? undefined : effectiveRules.find((entry) => entry.operationIndex === editingOperationIndex);
  const replaceLocation = (next: typeof location) => {
    if (!next || !location || locationIndex < 0) return;
    const locations = [...value.locations]; locations[locationIndex] = next;
    const codeChanged = next.code !== location.code;
    const rewriteEffects = (effects: ScenarioActionRule['effects']) => effects.map((effect) => (effect.kind === 'move-object' || effect.kind === 'move-session' || effect.kind === 'emit-event') && effect.locationCode === location.code ? { ...effect, locationCode: next.code } : effect);
    onChange({ ...value, locations, objects: codeChanged ? value.objects.map((item) => ({ ...item, initialLocationCode: item.initialLocationCode === location.code ? next.code : item.initialLocationCode, actionRules: item.actionRules.map((operation) => operation.operation === 'add' || operation.operation === 'override' ? { ...operation, rule: { ...operation.rule, effects: rewriteEffects(operation.rule.effects) } } : operation.operation === 'adjust' && operation.adjustments.effects ? { ...operation, adjustments: { ...operation.adjustments, effects: rewriteEffects(operation.adjustments.effects) } } : operation) })) : value.objects });
  };
  const replaceObject = (next: typeof object) => {
    if (!next || !object || objectIndex < 0) return;
    const objects = [...value.objects]; objects[objectIndex] = next; onChange({ ...value, objects });
  };
  const replaceOperation = (next: ScenarioObjectRuleOperation) => {
    if (!object || editingOperationIndex === null) return;
    replaceObject({ ...object, actionRules: object.actionRules.map((operation, index) => index === editingOperationIndex ? next : operation) });
  };
  const addLocation = () => { const next = createLocation(); onChange({ ...value, locations: [...value.locations, next] }); setEditing({ kind: 'location', code: next.code }); };
  const addObject = () => { const next = createObject(value); onChange({ ...value, objects: [...value.objects, next] }); setEditing({ kind: 'object', code: next.code }); };
  const removeLocation = () => { if (!location) return; const blocked = dependencyMessageForLocation(value, location.code); if (blocked) return onNotice(blocked, true); onChange({ ...value, locations: value.locations.filter((item) => item !== location) }); setEditing(null); };
  const removeObject = () => { if (object) { onChange({ ...value, objects: value.objects.filter((item) => item !== object) }); setEditing(null); } };
  const startInheritedOperation = (entry: (typeof effectiveRules)[number], operation: 'override' | 'delete' | 'adjust') => {
    if (!object || !entry.sourceTypeCode) return;
    const next: ScenarioObjectRuleOperation = operation === 'delete'
      ? { operation, targetTypeCode: entry.sourceTypeCode, targetRuleCode: entry.rule.code }
      : operation === 'adjust'
        ? { operation, targetTypeCode: entry.sourceTypeCode, targetRuleCode: entry.rule.code, adjustments: { priority: entry.rule.priority } }
        : { operation, targetTypeCode: entry.sourceTypeCode, targetRuleCode: entry.rule.code, rule: structuredClone(entry.rule) };
    const index = object.actionRules.length; replaceObject({ ...object, actionRules: [...object.actionRules, next] }); setEditingOperationIndex(index);
  };
  const removeOperation = () => { if (!object || editingOperationIndex === null) return; replaceObject({ ...object, actionRules: object.actionRules.filter((_, index) => index !== editingOperationIndex) }); setEditingOperationIndex(null); };
  const ruleForEditor = editingOperation?.operation === 'add' || editingOperation?.operation === 'override' ? editingOperation.rule : editingEffective?.rule;
  const changeRule = (rule: ScenarioActionRule) => {
    if (!editingOperation) return;
    if (editingOperation.operation === 'add' || editingOperation.operation === 'override') replaceOperation({ ...editingOperation, rule });
    else if (editingOperation.operation === 'adjust') replaceOperation({ ...editingOperation, adjustments: {
      ...editingOperation.adjustments,
      ...('condition' in editingOperation.adjustments ? { condition: rule.condition } : {}),
      ...('priority' in editingOperation.adjustments ? { priority: rule.priority } : {}),
      ...('note' in editingOperation.adjustments ? { note: rule.note } : {}),
      ...('effects' in editingOperation.adjustments ? { effects: rule.effects } : {}),
      ...('moduleBinding' in editingOperation.adjustments ? { moduleBinding: rule.moduleBinding } : {}),
    } });
  };

  return <section aria-label="場所とオブジェクト" className="grid gap-7">
    <section className="grid gap-4"><header className="flex items-end justify-between gap-4"><div><h2>場所</h2><p>舞台と配置先を管理します。</p></div><Button size="sm" variant="secondary" onClick={addLocation}>場所を追加</Button></header><div className="overflow-x-auto rounded-2xl border border-[#17151f]/15 bg-white/55"><table className={tableClass}><thead><tr><th className={cellClass}>編集</th><th className={cellClass}>表示名</th><th className={cellClass}>stable code</th><th className={cellClass}>配置数</th></tr></thead><tbody>{value.locations.map((item) => <tr key={item.code}><td className={cellClass}><Button size="sm" variant="secondary" aria-label={`${item.name}を編集`} onClick={() => setEditing({ kind: 'location', code: item.code })}>編集</Button></td><td className={cellClass}>{item.name}</td><td className={`${cellClass} font-mono text-xs`}>{item.code}</td><td className={cellClass}>{value.objects.filter((candidate) => candidate.initialLocationCode === item.code).length}件</td></tr>)}</tbody></table></div></section>
    <section className="grid gap-4"><header className="flex items-end justify-between gap-4"><div><h2>オブジェクト</h2><p>local configurationと継承rule operationを管理します。</p></div><Button size="sm" variant="secondary" onClick={addObject}>オブジェクトを追加</Button></header><div className="overflow-x-auto rounded-2xl border border-[#17151f]/15 bg-white/55"><table className={tableClass}><thead><tr><th className={cellClass}>編集</th><th className={cellClass}>表示名</th><th className={cellClass}>stable code</th><th className={cellClass}>Type</th><th className={cellClass}>rule operations</th></tr></thead><tbody>{value.objects.map((item) => <tr key={item.code}><td className={cellClass}><Button size="sm" variant="secondary" aria-label={`${item.name}を編集`} onClick={() => setEditing({ kind: 'object', code: item.code })}>編集</Button></td><td className={cellClass}>{item.name}</td><td className={`${cellClass} font-mono text-xs`}>{item.code}</td><td className={cellClass}>{item.mixinTypeCodes.join(' + ') || 'Object local'}</td><td className={cellClass}>{item.actionRules.length}件</td></tr>)}</tbody></table></div></section>

    <EditPane open={Boolean(location)} onOpenChange={(open) => { if (!open) setEditing(null); }} eyebrow="場所" title={location?.name ?? '場所を編集'} description="舞台としてAIへ渡す説明と空気を編集します。" footer={<Button onClick={() => setEditing(null)}>編集を完了</Button>}>{location && <div className={editorClass}><label>stable code<Input aria-label="場所のstable code" value={location.code} onChange={(event) => { replaceLocation({ ...location, code: event.target.value }); setEditing({ kind: 'location', code: event.target.value }); }} /></label><label>表示名<Input aria-label="場所の表示名" value={location.name} onChange={(event) => replaceLocation({ ...location, name: event.target.value })} /></label><label>説明<Textarea aria-label="場所の説明" value={location.description} onChange={(event) => replaceLocation({ ...location, description: event.target.value })} /></label><label>雰囲気<Input aria-label="場所の雰囲気" value={location.atmosphere} onChange={(event) => replaceLocation({ ...location, atmosphere: event.target.value })} /></label><label>危険<Input aria-label="場所の危険" value={location.danger} onChange={(event) => replaceLocation({ ...location, danger: event.target.value })} /></label><Button size="sm" variant="text" onClick={removeLocation}>この場所を削除</Button></div>}</EditPane>

    <EditPane open={Boolean(object)} onOpenChange={(open) => { if (!open) { setEditing(null); setEditingOperationIndex(null); setMixinSearchOpen(false); setMixinSearchQuery(''); } }} eyebrow="オブジェクト" title={object?.name ?? 'オブジェクトを編集'} description="Typeの継承結果とObject local差分を編集します。" footer={<Button onClick={() => { setEditing(null); setMixinSearchOpen(false); setMixinSearchQuery(''); }}>編集を完了</Button>}>{object && <div className={editorClass}>
      <label>stable code<Input aria-label="オブジェクトのstable code" value={object.code} onChange={(event) => { replaceObject({ ...object, code: event.target.value }); setEditing({ kind: 'object', code: event.target.value }); }} /></label><label>表示名<Input aria-label="オブジェクトの表示名" value={object.name} onChange={(event) => replaceObject({ ...object, name: event.target.value })} /></label>
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
      <label className="!grid-cols-[1fr_auto] items-center"><span>すべての場所で公開</span><input type="checkbox" aria-label="globalオブジェクト" checked={object.global} onChange={(event) => replaceObject({ ...object, global: event.target.checked })} /></label>{!object.global && <MyrialeSelect label="初期配置" value={object.initialLocationCode} onValueChange={(initialLocationCode) => replaceObject({ ...object, initialLocationCode })} options={value.locations.map((item) => ({ value: item.code, label: `${item.name} / ${item.code}` }))} />}
      <div className="grid gap-2 rounded-xl border border-[#17151f]/12 p-3"><strong>初期状態override</strong>{(resolved?.stateFields ?? []).map((field) => { const override = object.initialStateOverrides.find((item) => item.stateCode === field.code); return <label key={field.code}>{field.label}<Input aria-label={`${field.label}の初期override`} value={override?.value ?? ''} onChange={(event) => replaceObject({ ...object, initialStateOverrides: [...object.initialStateOverrides.filter((item) => item.stateCode !== field.code), ...(event.target.value ? [{ stateCode: field.code, value: event.target.value }] : [])] })} /></label>; })}</div>
      <RuleConfigurationEditorPresentation label="Object local configuration" stateFields={object.stateFields} actions={object.actions} onChange={(configuration) => replaceObject({ ...object, ...configuration })} onRenameAction={(index, code) => { const previous = object.actions[index].code; replaceObject({ ...object, actions: object.actions.map((action, actionIndex) => actionIndex === index ? { ...action, code } : action), actionRules: object.actionRules.map((operation) => operation.operation === 'add' && operation.rule.actionCode === previous ? { ...operation, rule: { ...operation.rule, actionCode: code } } : operation) }); }} onDeleteAction={(index) => { const action = object.actions[index]; if (object.actionRules.some((operation) => operation.operation === 'add' && operation.rule.actionCode === action.code)) return onNotice('このアクションを参照するlocal ruleがあります。先にruleを削除してください。', true); replaceObject({ ...object, actions: object.actions.filter((_, actionIndex) => actionIndex !== index) }); }} />
      <section aria-label="Object effective rules" className="grid gap-3 rounded-xl border border-[#17151f]/12 p-3"><div className="flex items-center justify-between"><div><h3>Effective rules</h3><p className="text-sm text-myr-ink-subtle">継承元とObjectでのeffective stateを確認します。</p></div><Button size="sm" variant="secondary" disabled={!resolved?.actions[0]} onClick={() => { const operation = createObjectAddRule(resolved?.actions[0]?.code ?? ''); const index = object.actionRules.length; replaceObject({ ...object, actionRules: [...object.actionRules, operation] }); setEditingOperationIndex(index); }}>local add</Button></div><div className="overflow-x-auto"><table className={tableClass}><thead><tr><th className={cellClass}>rule</th><th className={cellClass}>source</th><th className={cellClass}>effective state</th><th className={cellClass}>priority</th><th className={cellClass}>操作</th></tr></thead><tbody>{effectiveRules.map((entry) => <tr key={entry.key}><td className={`${cellClass} font-mono text-xs`}>{entry.rule.code}</td><td className={cellClass}>{entry.source}</td><td className={cellClass}>{entry.state}</td><td className={cellClass}>{entry.rule.priority}</td><td className={cellClass}><div className="flex flex-wrap gap-1">{entry.state === 'inherited' ? <><Button size="sm" variant="text" onClick={() => startInheritedOperation(entry, 'override')}>override</Button><Button size="sm" variant="text" onClick={() => startInheritedOperation(entry, 'adjust')}>adjust</Button><Button size="sm" variant="text" onClick={() => startInheritedOperation(entry, 'delete')}>delete</Button></> : <><Button size="sm" variant="secondary" aria-label={`${entry.rule.code} operationを編集`} onClick={() => setEditingOperationIndex(entry.operationIndex)}>編集</Button><Button size="sm" variant="text" onClick={() => { if (entry.operationIndex !== null) replaceObject({ ...object, actionRules: object.actionRules.filter((_, index) => index !== entry.operationIndex) }); }}>operationを削除</Button></>}</div></td></tr>)}</tbody></table>{effectiveRules.length === 0 && <p className="p-3 text-sm text-myr-ink-subtle">effective ruleはありません。</p>}</div></section>
      <Button size="sm" variant="text" onClick={removeObject}>このオブジェクトを削除</Button>
    </div>}</EditPane>

    <EditPane
      layer={1}
      open={Boolean(object) && mixinSearchOpen}
      onOpenChange={(open) => { setMixinSearchOpen(open); if (!open) setMixinSearchQuery(''); }}
      eyebrow="オブジェクトの種類"
      title="追加するType mixinを選ぶ"
      description="このオブジェクトに受け継がせたい種類を検索して追加します。追加した種類は一覧の末尾に並びます。"
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
          <div className="rounded-xl border border-dashed border-[#17151f]/20 bg-white/45 p-5 text-sm text-myr-ink-subtle" role="status">追加できるTypeがまだ登録されていません。先にオブジェクト種類を作成してください。</div>
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

    <EditPane layer={1} open={Boolean(editingOperation)} onOpenChange={(open) => { if (!open) setEditingOperationIndex(null); }} eyebrow="Object rule operation" title={editingOperation?.operation ?? 'operationを編集'} description="add / override / delete / adjustをstrict v2 schemaで保存します。" footer={<Button onClick={() => setEditingOperationIndex(null)}>operationの編集を完了</Button>}>
      {editingOperation?.operation === 'delete' && <div className={editorClass}><p>Type <code>{editingOperation.targetTypeCode}</code> の rule <code>{editingOperation.targetRuleCode}</code> をこのObjectでは無効にします。</p><Button size="sm" variant="text" onClick={removeOperation}>delete operationを削除して継承へ戻す</Button></div>}
      {editingOperation?.operation === 'adjust' && editingEffective && <div className="grid gap-3"><section className={editorClass}><h3>調整するfield</h3>{adjustmentFields.map((field) => <label key={field} className="!grid-cols-[1fr_auto] items-center"><span>{field}</span><input type="checkbox" aria-label={`${field}をadjust`} checked={field in editingOperation.adjustments} onChange={(event) => { const adjustments = { ...editingOperation.adjustments }; if (event.target.checked) { const inherited = value.objectTypes.find((type) => type.code === editingOperation.targetTypeCode)?.actionRules.find((rule) => rule.code === editingOperation.targetRuleCode); if (inherited) { if (field === 'condition') adjustments.condition = structuredClone(inherited.condition); if (field === 'priority') adjustments.priority = inherited.priority; if (field === 'note') adjustments.note = inherited.note; if (field === 'effects') adjustments.effects = structuredClone(inherited.effects); if (field === 'moduleBinding') adjustments.moduleBinding = inherited.moduleBinding ? structuredClone(inherited.moduleBinding) : null; } } else delete adjustments[field]; replaceOperation({ ...editingOperation, adjustments }); }} /></label>)}<Button size="sm" variant="text" onClick={removeOperation}>adjust operationを削除</Button></section><ObjectActionRuleEditorPresentation value={value} rule={editingEffective.rule} actions={resolved?.actions ?? []} sourceObjectCode={object?.code} actionFixed onChange={changeRule} /></div>}
      {(editingOperation?.operation === 'add' || editingOperation?.operation === 'override') && ruleForEditor && <ObjectActionRuleEditorPresentation value={value} rule={ruleForEditor} actions={resolved?.actions ?? []} sourceObjectCode={object?.code} actionFixed={editingOperation.operation === 'override'} onChange={changeRule} onDelete={removeOperation} />}
    </EditPane>
  </section>;
}
