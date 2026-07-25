import { useState } from 'react';
import { Button, Input, Textarea } from '../../../../components/ui';
import { EditPane } from '../../../../shared/EditPane';
import { MyrialeSelect } from '../../../../ui/MyrialeRadix';
import { ObjectActionRuleEditorPresentation } from './ObjectActionRuleEditorPresentation';
import {
  createActionResult,
  createObjectType,
  createStateField,
  createTypeAction,
  dependencyMessageForType,
  type ScenarioRuleData,
  type ScenarioStateField,
  type ScenarioTypeAction,
} from './scenarioRuleDataModel';

type Props = {
  mode: 'create' | 'edit';
  value: ScenarioRuleData;
  onChange: (value: ScenarioRuleData) => void;
  onNotice: (message: string, danger?: boolean) => void;
};

type NestedEditor =
  | { kind: 'state'; index: number }
  | { kind: 'action'; index: number }
  | { kind: 'argument'; actionIndex: number; argumentIndex: number }
  | { kind: 'rule'; actionIndex: number; objectCode: string; resultCode: string }
  | null;

const cardClass = 'grid gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4';
const tableClass = 'w-full min-w-[560px] border-collapse text-left text-sm';
const cellClass = 'border-b border-[#17151f]/10 px-3 py-3 align-middle';
const compactTableClass = 'w-full min-w-[480px] border-collapse text-left text-sm';

export function ObjectTypesEditorPresentation({ mode, value, onChange, onNotice }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [paneOpen, setPaneOpen] = useState(false);
  const [nestedEditor, setNestedEditor] = useState<NestedEditor>(null);
  const [newRuleObjectCode, setNewRuleObjectCode] = useState('');
  const selected = selectedIndex === null ? undefined : value.objectTypes[selectedIndex];
  const stateIndex = nestedEditor?.kind === 'state' ? nestedEditor.index : -1;
  const actionIndex = nestedEditor?.kind === 'action' ? nestedEditor.index : nestedEditor?.kind === 'argument' || nestedEditor?.kind === 'rule' ? nestedEditor.actionIndex : -1;
  const argumentIndex = nestedEditor?.kind === 'argument' ? nestedEditor.argumentIndex : -1;
  const stateField = selected?.stateFields[stateIndex];
  const action = selected?.actions[actionIndex];
  const argument = action?.argumentFields[argumentIndex];
  const typeObjects = selected ? value.objects.filter((object) => (object.mixinTypeCodes ?? [object.objectTypeCode]).includes(selected.code)) : [];
  const genericRules = action ? (selected?.actionResults ?? []).filter((result) => result.actionCode === action.code) : [];
  const actionRules = action ? typeObjects.flatMap((object) => object.actionResults
    .filter((result) => result.actionCode === action.code)
    .map((result) => ({ object, result }))) : [];
  const selectedRuleObjectCode = newRuleObjectCode || typeObjects[0]?.code || '';

  const replaceSelected = (next: typeof selected) => {
    if (!next || !selected || selectedIndex === null) return;
    const objectTypes = [...value.objectTypes];
    objectTypes[selectedIndex] = next;
    const objects = next.code === selected.code ? value.objects : value.objects.map((object) => {
      const mixins = object.mixinTypeCodes ?? (object.objectTypeCode ? [object.objectTypeCode] : []);
      if (!mixins.includes(selected.code)) return object;
      const mixinTypeCodes = mixins.map((code) => code === selected.code ? next.code : code);
      return { ...object, mixinTypeCodes, objectTypeCode: mixinTypeCodes[0] ?? '' };
    });
    onChange({ ...value, objectTypes, objects });
  };
  const openType = (index: number) => { setSelectedIndex(index); setNestedEditor(null); setPaneOpen(true); };
  const addType = () => {
    const next = createObjectType();
    onChange({ ...value, objectTypes: [...value.objectTypes, next] });
    openType(value.objectTypes.length);
  };
  const removeType = () => {
    if (!selected || selectedIndex === null) return;
    const blocked = dependencyMessageForType(value, selected.code);
    if (blocked) return onNotice(blocked, true);
    onChange({ ...value, objectTypes: value.objectTypes.filter((_, index) => index !== selectedIndex) });
    setPaneOpen(false);
    setSelectedIndex(null);
    onNotice(`オブジェクト種類「${selected.name}」を削除しました。`);
  };
  const replaceState = (index: number, patch: Partial<ScenarioStateField>) => {
    if (!selected || selectedIndex === null) return;
    const previous = selected.stateFields[index];
    const nextState = { ...previous, ...patch };
    const nextType = { ...selected, stateFields: selected.stateFields.map((item, itemIndex) => itemIndex === index ? nextState : item),
      actionResults: (selected.actionResults ?? []).map((result) => ({ ...result, fromStateCode: result.fromStateCode === previous.code ? nextState.code : result.fromStateCode,
        effects: result.effects.map((effect) => effect.kind === 'set-state' && effect.stateCode === previous.code ? { ...effect, stateCode: nextState.code } : effect) })) };
    const objectTypes = value.objectTypes.map((item, itemIndex) => itemIndex === selectedIndex ? nextType : item);
    const objects = previous.code === nextState.code ? value.objects : value.objects.map((object) => !(object.mixinTypeCodes ?? [object.objectTypeCode]).includes(selected.code) ? object : ({
      ...object,
      initialStateOverrides: object.initialStateOverrides.map((override) => override.stateCode === previous.code ? { ...override, stateCode: nextState.code } : override),
      actionResults: object.actionResults.map((result) => ({
        ...result,
        fromStateCode: result.fromStateCode === previous.code ? nextState.code : result.fromStateCode,
        effects: result.effects.map((effect) => effect.kind === 'set-state' && (!effect.targetObjectCode || effect.targetObjectCode === object.code) && effect.stateCode === previous.code ? { ...effect, stateCode: nextState.code } : effect),
      })),
    }));
    const cascadedType = previous.code === nextState.code ? nextType : {
      ...nextType,
      actions: nextType.actions.map((item) => item.availabilityStateCode === previous.code ? { ...item, availabilityStateCode: nextState.code } : item),
    };
    objectTypes[selectedIndex] = cascadedType;
    onChange({ ...value, objectTypes, objects });
  };
  const replaceAction = (index: number, patch: Partial<ScenarioTypeAction>) => {
    if (!selected || selectedIndex === null) return;
    const previous = selected.actions[index];
    const nextAction = { ...previous, ...patch };
    const objectTypes = value.objectTypes.map((item, itemIndex) => itemIndex === selectedIndex ? {
      ...selected,
      actions: selected.actions.map((candidate, candidateIndex) => candidateIndex === index ? nextAction : candidate),
      actionResults: (selected.actionResults ?? []).map((result) => result.actionCode === previous.code ? { ...result, actionCode: nextAction.code } : result),
    } : item);
    const objects = previous.code === nextAction.code ? value.objects : value.objects.map((object) => (object.mixinTypeCodes ?? [object.objectTypeCode]).includes(selected.code) ? {
      ...object,
      actionResults: object.actionResults.map((result) => result.actionCode === previous.code ? { ...result, actionCode: nextAction.code } : result),
    } : object);
    onChange({ ...value, objectTypes, objects });
  };
  const replaceArgument = (targetActionIndex: number, targetArgumentIndex: number, patch: Partial<ScenarioTypeAction['argumentFields'][number]>) => {
    if (!selected) return;
    replaceAction(targetActionIndex, {
      argumentFields: selected.actions[targetActionIndex].argumentFields.map((field, fieldIndex) => fieldIndex === targetArgumentIndex ? { ...field, ...patch } : field),
    });
  };
  const addRule = () => {
    if (!action || !selectedRuleObjectCode) return;
    const objectIndex = value.objects.findIndex((object) => object.code === selectedRuleObjectCode && (object.mixinTypeCodes ?? [object.objectTypeCode]).includes(selected?.code ?? ''));
    const object = value.objects[objectIndex];
    if (!object) return;
    const result = createActionResult(object, value, action.code);
    const objects = [...value.objects];
    objects[objectIndex] = { ...object, actionResults: [...object.actionResults, result] };
    onChange({ ...value, objects });
    setNestedEditor({ kind: 'rule', actionIndex, objectCode: object.code, resultCode: result.code });
  };
  const deleteRule = (objectCode: string, resultCode: string) => {
    onChange({ ...value, objects: value.objects.map((object) => object.code === objectCode ? { ...object, actionResults: object.actionResults.filter((result) => result.code !== resultCode) } : object) });
    setNestedEditor({ kind: 'action', index: actionIndex });
  };

  return (
    <section aria-label="オブジェクト種類" className="grid gap-4">
      <header className="flex items-end justify-between gap-4 max-md:items-start">
        <div><h2>オブジェクト種類</h2><p>{mode === 'edit' ? '保存済みの状態・アクション契約を一覧から選んで編集します。' : '状態の辞書と公開アクションの境界を定義します。'}</p></div>
        <Button size="sm" variant="secondary" onClick={addType}>種類を追加</Button>
      </header>
      <div className="overflow-x-auto rounded-2xl border border-[#17151f]/15 bg-white/55 shadow-[0_12px_30px_rgba(23,21,31,.07)]">
        <table className={tableClass}>
          <thead className="bg-[#17151f]/[.045] text-xs text-myr-slate-muted"><tr><th className={cellClass}>編集</th><th className={cellClass}>表示名</th><th className={cellClass}>stable code</th><th className={cellClass}>状態</th><th className={cellClass}>アクション</th></tr></thead>
          <tbody>{value.objectTypes.map((type, index) => <tr key={`${type.code}-${index}`} className="hover:bg-white/65"><td className={cellClass}><Button size="sm" variant="secondary" onClick={() => openType(index)} aria-label={`${type.name}を編集`}>編集</Button></td><td className={cellClass}><strong>{type.name}</strong><span className="mt-0.5 block text-xs text-myr-ink-subtle">{type.description || '説明なし'}</span></td><td className={`${cellClass} font-mono text-xs`}>{type.code}</td><td className={cellClass}>{type.stateFields.length}件</td><td className={cellClass}>{type.actions.length}件</td></tr>)}</tbody>
        </table>
        {value.objectTypes.length === 0 && <p className="p-5 text-sm text-myr-ink-subtle">まだ種類がありません。「種類を追加」から登録します。</p>}
      </div>

      <EditPane open={paneOpen && Boolean(selected)} onOpenChange={(open) => { setPaneOpen(open); if (!open) setNestedEditor(null); }} eyebrow="オブジェクト種類" title={selected?.name ?? '種類を編集'} description="状態定義とアクション契約を編集します。各項目は行の編集ボタンから重ねて開きます。" footer={<Button onClick={() => setPaneOpen(false)}>編集を完了</Button>}>
        {selected && <div className={cardClass}>
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
            <label>stable code<Input aria-label="種類のstable code" value={selected.code} onChange={(event) => replaceSelected({ ...selected, code: event.target.value })} /></label>
            <label>表示名<Input aria-label="種類の表示名" value={selected.name} onChange={(event) => replaceSelected({ ...selected, name: event.target.value })} /></label>
          </div>
          <label>説明<Textarea aria-label="種類の説明" value={selected.description} onChange={(event) => replaceSelected({ ...selected, description: event.target.value })} /></label>

          <section className="grid gap-3 border-t border-[#17151f]/12 pt-4" aria-labelledby="state-table-heading">
            <div className="flex items-center justify-between gap-2"><h3 id="state-table-heading">状態定義</h3><Button size="sm" variant="secondary" onClick={() => { const index = selected.stateFields.length; replaceSelected({ ...selected, stateFields: [...selected.stateFields, createStateField()] }); setNestedEditor({ kind: 'state', index }); }}>状態を追加</Button></div>
            <div className="overflow-x-auto rounded-xl border border-[#17151f]/12 bg-[#fffef9]/80">
              <table className={compactTableClass}><thead className="bg-[#17151f]/[.04] text-xs text-myr-slate-muted"><tr><th className={cellClass}>編集</th><th className={cellClass}>表示名</th><th className={cellClass}>code</th><th className={cellClass}>型</th><th className={cellClass}>公開範囲</th></tr></thead><tbody>{selected.stateFields.map((field, index) => <tr key={`${field.code}-${index}`}><td className={cellClass}><Button size="sm" variant="secondary" aria-label={`${field.label}を編集`} onClick={() => setNestedEditor({ kind: 'state', index })}>編集</Button></td><td className={cellClass}><strong>{field.label}</strong></td><td className={`${cellClass} font-mono text-xs`}>{field.code}</td><td className={cellClass}>{field.valueType}</td><td className={cellClass}>{field.visibility === 'public' ? '公開' : '非公開'}</td></tr>)}</tbody></table>
              {selected.stateFields.length === 0 && <p className="p-4 text-sm text-myr-ink-subtle">状態はまだありません。</p>}
            </div>
          </section>

          <section className="grid gap-3 border-t border-[#17151f]/12 pt-4" aria-labelledby="action-table-heading">
            <div className="flex items-center justify-between gap-2"><h3 id="action-table-heading">アクション</h3><Button size="sm" variant="secondary" onClick={() => { const index = selected.actions.length; replaceSelected({ ...selected, actions: [...selected.actions, createTypeAction()] }); setNestedEditor({ kind: 'action', index }); }}>アクションを追加</Button></div>
            <div className="overflow-x-auto rounded-xl border border-[#17151f]/12 bg-[#fffef9]/80">
              <table className={compactTableClass}><thead className="bg-[#17151f]/[.04] text-xs text-myr-slate-muted"><tr><th className={cellClass}>編集</th><th className={cellClass}>表示名</th><th className={cellClass}>code</th><th className={cellClass}>公開先</th><th className={cellClass}>引数</th></tr></thead><tbody>{selected.actions.map((item, index) => <tr key={`${item.code}-${index}`}><td className={cellClass}><Button size="sm" variant="secondary" aria-label={`${item.label}を編集`} onClick={() => setNestedEditor({ kind: 'action', index })}>編集</Button></td><td className={cellClass}><strong>{item.label}</strong></td><td className={`${cellClass} font-mono text-xs`}>{item.code}</td><td className={cellClass}>{item.visibility === 'ai-choice' ? 'AI候補' : item.visibility === 'manual-ui' ? '手動UI' : 'システムのみ'}</td><td className={cellClass}>{item.argumentFields.length}件</td></tr>)}</tbody></table>
              {selected.actions.length === 0 && <p className="p-4 text-sm text-myr-ink-subtle">アクションはまだありません。</p>}
            </div>
          </section>
          <div className="flex justify-end"><Button size="sm" variant="text" onClick={removeType}>この種類を削除</Button></div>
        </div>}
      </EditPane>

      <EditPane layer={1} open={nestedEditor?.kind === 'state' && Boolean(stateField)} onOpenChange={(open) => { if (!open) setNestedEditor(null); }} eyebrow="状態定義" title={stateField?.label ?? '状態を編集'} description="状態の型、初期値、公開範囲を編集します。" footer={<Button onClick={() => setNestedEditor(null)}>状態の編集を完了</Button>}>
        {selected && stateField && <div className={cardClass}>
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1"><label>状態code<Input aria-label={`状態${stateIndex + 1}のcode`} value={stateField.code} onChange={(event) => replaceState(stateIndex, { code: event.target.value })} /></label><label>表示名<Input aria-label={`状態${stateIndex + 1}の表示名`} value={stateField.label} onChange={(event) => replaceState(stateIndex, { label: event.target.value })} /></label></div>
          <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1"><MyrialeSelect label={`状態${stateIndex + 1}の型`} value={stateField.valueType} onValueChange={(next) => replaceState(stateIndex, { valueType: next as typeof stateField.valueType })} options={[{ value: 'boolean', label: '真偽' }, { value: 'string', label: '文字列' }, { value: 'number', label: '数値' }]} /><label>初期値<Input aria-label={`状態${stateIndex + 1}の初期値`} value={stateField.defaultValue} onChange={(event) => replaceState(stateIndex, { defaultValue: event.target.value })} /></label><MyrialeSelect label={`状態${stateIndex + 1}の公開範囲`} value={stateField.visibility} onValueChange={(next) => replaceState(stateIndex, { visibility: next as typeof stateField.visibility })} options={[{ value: 'public', label: '公開' }, { value: 'private', label: '非公開' }]} /></div>
          <Button size="sm" variant="text" onClick={() => { replaceSelected({ ...selected, stateFields: selected.stateFields.filter((_, index) => index !== stateIndex) }); setNestedEditor(null); }}>この状態を削除</Button>
        </div>}
      </EditPane>

      <EditPane layer={1} open={(nestedEditor?.kind === 'action' || nestedEditor?.kind === 'argument' || nestedEditor?.kind === 'rule') && Boolean(action)} onOpenChange={(open) => { if (!open) setNestedEditor(null); }} eyebrow="アクション" title={action?.label ?? 'アクションを編集'} description="種類共通の提示条件と、Objectごとの実行ルールを編集します。" footer={<Button onClick={() => setNestedEditor(null)}>アクションの編集を完了</Button>}>
        {selected && action && <div className={cardClass}>
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1"><label>action code<Input aria-label={`アクション${actionIndex + 1}のcode`} value={action.code} onChange={(event) => replaceAction(actionIndex, { code: event.target.value })} /></label><label>表示名<Input aria-label={`アクション${actionIndex + 1}の表示名`} value={action.label} onChange={(event) => replaceAction(actionIndex, { label: event.target.value })} /></label></div>
          <label>AI向け説明<Input aria-label={`アクション${actionIndex + 1}の説明`} value={action.description} onChange={(event) => replaceAction(actionIndex, { description: event.target.value })} /></label>
          <section className="grid gap-2 rounded-xl border border-[#17151f]/12 bg-[#fffef9]/75 p-3" aria-labelledby="availability-heading">
            <div><h3 id="availability-heading">種類共通のアクション提示条件</h3><p className="text-sm text-[#5e596b]">この種類の全Objectで、AIやUIへアクション候補を提示する条件です。Object個別の実行条件は下のテーブルで設定します。</p></div>
            <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1"><MyrialeSelect label={`アクション${actionIndex + 1}の公開先`} value={action.visibility} onValueChange={(next) => replaceAction(actionIndex, { visibility: next as typeof action.visibility })} options={[{ value: 'ai-choice', label: 'AI候補' }, { value: 'manual-ui', label: '手動UI' }, { value: 'system-only', label: 'システムのみ' }]} /><MyrialeSelect label={`アクション${actionIndex + 1}の種類共通の提示条件`} value={action.availability} onValueChange={(next) => replaceAction(actionIndex, { availability: next as typeof action.availability })} options={[{ value: 'always', label: '常に提示' }, { value: 'state-equals', label: '状態が一致するとき提示' }]} /></div>
            {action.availability === 'state-equals' && <label>提示条件に使う状態code<Input aria-label={`アクション${actionIndex + 1}の提示条件状態code`} value={action.availabilityStateCode} onChange={(event) => replaceAction(actionIndex, { availabilityStateCode: event.target.value })} /></label>}
          </section>
          <section className="grid gap-3 border-t border-[#17151f]/12 pt-4" aria-labelledby="argument-table-heading">
            <div className="flex items-center justify-between gap-2"><h3 id="argument-table-heading">引数schema</h3><Button size="sm" variant="secondary" onClick={() => { const index = action.argumentFields.length; replaceAction(actionIndex, { argumentFields: [...action.argumentFields, { code: `argument-${index + 1}`, label: '新しい引数', valueType: 'string', required: false }] }); setNestedEditor({ kind: 'argument', actionIndex, argumentIndex: index }); }}>引数を追加</Button></div>
            <div className="overflow-x-auto rounded-xl border border-[#17151f]/12 bg-[#fffef9]/80"><table className={compactTableClass}><thead className="bg-[#17151f]/[.04] text-xs text-myr-slate-muted"><tr><th className={cellClass}>編集</th><th className={cellClass}>表示名</th><th className={cellClass}>code</th><th className={cellClass}>型</th><th className={cellClass}>必須</th></tr></thead><tbody>{action.argumentFields.map((item, index) => <tr key={`${item.code}-${index}`}><td className={cellClass}><Button size="sm" variant="secondary" aria-label={`${item.label}を編集`} onClick={() => setNestedEditor({ kind: 'argument', actionIndex, argumentIndex: index })}>編集</Button></td><td className={cellClass}>{item.label}</td><td className={`${cellClass} font-mono text-xs`}>{item.code}</td><td className={cellClass}>{item.valueType}</td><td className={cellClass}>{item.required ? '必須' : '任意'}</td></tr>)}</tbody></table>{action.argumentFields.length === 0 && <p className="p-4 text-sm text-myr-ink-subtle">引数はありません。</p>}</div>
          </section>
          <section className="grid gap-3 border-t border-[#17151f]/12 pt-4" aria-labelledby="generic-rules-heading">
            <div className="flex items-center justify-between gap-2"><div><h3 id="generic-rules-heading">Type generic action rules</h3><p className="text-sm text-[#5e596b]">このTypeをmixinする全Objectへ適用し、Object local ruleより低いsource rankで解決します。</p></div><Button size="sm" variant="secondary" onClick={() => replaceSelected({ ...selected, actionResults: [...(selected.actionResults ?? []), { code: `generic-${action.code}-${Date.now()}`, actionCode: action.code, fromStateCode: selected.stateFields[0]?.code ?? '', fromStateValue: selected.stateFields[0]?.defaultValue ?? '', priority: 100, note: '', effects: [{ kind: 'emit-fact', text: '' }] }] })}>generic ruleを追加</Button></div>
            {genericRules.map((rule) => <div key={rule.code} className="grid gap-2 rounded-xl border border-[#17151f]/12 bg-[#fffef9]/80 p-3">
              <div className="grid grid-cols-3 gap-2 max-md:grid-cols-1"><label>条件state<Input aria-label={`${action.label} generic rule condition state`} value={rule.fromStateCode} onChange={(event) => replaceSelected({ ...selected, actionResults: (selected.actionResults ?? []).map((item) => item.code === rule.code ? { ...item, fromStateCode: event.target.value } : item) })} /></label><label>条件値<Input aria-label={`${action.label} generic rule condition value`} value={rule.fromStateValue} onChange={(event) => replaceSelected({ ...selected, actionResults: (selected.actionResults ?? []).map((item) => item.code === rule.code ? { ...item, fromStateValue: event.target.value } : item) })} /></label><label>priority<Input aria-label={`${action.label} generic rule priority`} type="number" value={rule.priority} onChange={(event) => replaceSelected({ ...selected, actionResults: (selected.actionResults ?? []).map((item) => item.code === rule.code ? { ...item, priority: Number(event.target.value) } : item) })} /></label></div>
              <label>authoring note<Input aria-label={`${action.label} generic rule note`} value={rule.note} onChange={(event) => replaceSelected({ ...selected, actionResults: (selected.actionResults ?? []).map((item) => item.code === rule.code ? { ...item, note: event.target.value } : item) })} /></label>
              <label>確定fact<Input aria-label={`${action.label} generic rule fact`} value={rule.effects.find((effect) => effect.kind === 'emit-fact')?.text ?? ''} onChange={(event) => replaceSelected({ ...selected, actionResults: (selected.actionResults ?? []).map((item) => item.code === rule.code ? { ...item, effects: [{ kind: 'emit-fact', text: event.target.value }] } : item) })} /></label>
              <Button size="sm" variant="text" onClick={() => replaceSelected({ ...selected, actionResults: (selected.actionResults ?? []).filter((item) => item.code !== rule.code) })}>generic ruleを削除</Button>
            </div>)}
          </section>
          <section className="grid gap-3 border-t border-[#17151f]/12 pt-4" aria-labelledby="object-rules-heading">
            <div><h3 id="object-rules-heading">オブジェクト別の実行ルール</h3><p className="text-sm text-[#5e596b]">この種類・このアクションに一致するObject個別ルールです。1ルールを1行で表示し、effectの順序は編集ペインで管理します。</p></div>
            {typeObjects.length === 0 ? <div className="rounded-xl border border-dashed border-[#17151f]/20 bg-[#17151f]/[.025] p-4"><strong>対象Objectがありません</strong><p className="mt-1 text-sm text-[#5e596b]">世界データでこの種類のObjectを登録すると、実行ルールを追加できます。</p><Button className="mt-3" size="sm" variant="secondary" disabled>実行ルールを追加</Button></div> : <>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 max-md:grid-cols-1">
                <MyrialeSelect label="対象Objectを選択" value={selectedRuleObjectCode} onValueChange={setNewRuleObjectCode} options={typeObjects.map((object) => ({ value: object.code, label: `${object.name} / ${object.code}` }))} />
                <Button size="sm" variant="secondary" onClick={addRule}>このObjectへ実行ルールを追加</Button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#17151f]/12 bg-[#fffef9]/80">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead className="bg-[#17151f]/[.04] text-xs text-myr-slate-muted"><tr><th className={cellClass}>対象Object</th><th className={cellClass}>Object個別の実行条件</th><th className={cellClass}>priority</th><th className={cellClass}>effects</th><th className={cellClass}>編集</th></tr></thead>
                  <tbody>{actionRules.map(({ object, result }) => <tr key={`${object.code}-${result.code}`}><td className={cellClass}><strong>{object.name}</strong><span className="block font-mono text-xs">{object.code}</span></td><td className={cellClass}><span className="font-mono text-xs">{result.fromStateCode || 'any'} = {result.fromStateValue || 'any'}</span></td><td className={cellClass}>{result.priority}</td><td className={cellClass}>{result.effects.length}件</td><td className={cellClass}><Button size="sm" variant="secondary" aria-label={`${object.name}の実行ルールを編集`} onClick={() => setNestedEditor({ kind: 'rule', actionIndex, objectCode: object.code, resultCode: result.code })}>編集</Button></td></tr>)}</tbody>
                </table>
                {actionRules.length === 0 && <p className="p-4 text-sm text-myr-ink-subtle">このアクションの実行ルールはまだありません。対象Objectを選んで追加してください。</p>}
              </div>
            </>}
          </section>
          <Button size="sm" variant="text" onClick={() => {
            if (actionRules.length > 0 || genericRules.length > 0) return onNotice(`このアクションは${actionRules.length}件の実行ルールから参照されています。先にルールを削除してください。`, true);
            replaceSelected({ ...selected, actions: selected.actions.filter((_, index) => index !== actionIndex) });
            setNestedEditor(null);
          }}>このアクションを削除</Button>
        </div>}
      </EditPane>

      <EditPane layer={2} open={nestedEditor?.kind === 'argument' && Boolean(argument)} onOpenChange={(open) => { if (!open && action) setNestedEditor({ kind: 'action', index: actionIndex }); }} eyebrow="アクション引数" title={argument?.label ?? '引数を編集'} description="アクションへ渡す引数の契約を編集します。" footer={<Button onClick={() => setNestedEditor({ kind: 'action', index: actionIndex })}>引数の編集を完了</Button>}>
        {selected && action && argument && <div className={cardClass}>
          <label>引数code<Input aria-label={`アクション${actionIndex + 1}の引数${argumentIndex + 1}code`} value={argument.code} onChange={(event) => replaceArgument(actionIndex, argumentIndex, { code: event.target.value })} /></label>
          <label>表示名<Input aria-label={`アクション${actionIndex + 1}の引数${argumentIndex + 1}表示名`} value={argument.label} onChange={(event) => replaceArgument(actionIndex, argumentIndex, { label: event.target.value })} /></label>
          <MyrialeSelect label={`アクション${actionIndex + 1}の引数${argumentIndex + 1}の型`} value={argument.valueType} onValueChange={(next) => replaceArgument(actionIndex, argumentIndex, { valueType: next as typeof argument.valueType })} options={[{ value: 'string', label: '文字列' }, { value: 'number', label: '数値' }, { value: 'boolean', label: '真偽' }]} />
          <label className="!grid-cols-[1fr_auto] items-center"><span>必須引数</span><input type="checkbox" aria-label={`アクション${actionIndex + 1}の引数${argumentIndex + 1}を必須にする`} checked={argument.required} onChange={(event) => replaceArgument(actionIndex, argumentIndex, { required: event.target.checked })} /></label>
          <Button size="sm" variant="text" onClick={() => { replaceAction(actionIndex, { argumentFields: action.argumentFields.filter((_, index) => index !== argumentIndex) }); setNestedEditor({ kind: 'action', index: actionIndex }); }}>この引数を削除</Button>
        </div>}
      </EditPane>

      <EditPane layer={2} open={nestedEditor?.kind === 'rule'} onOpenChange={(open) => { if (!open && action) setNestedEditor({ kind: 'action', index: actionIndex }); }} eyebrow="Object別実行ルール" title={nestedEditor?.kind === 'rule' ? `${value.objects.find((object) => object.code === nestedEditor.objectCode)?.name ?? 'Object'} / ${action?.label ?? 'アクション'}` : '実行ルールを編集'} description="対象Objectとアクションは固定です。条件、priority、effectの内容と実行順を編集します。" footer={<Button onClick={() => setNestedEditor({ kind: 'action', index: actionIndex })}>実行ルールの編集を完了</Button>}>
        {nestedEditor?.kind === 'rule' && action && <ObjectActionRuleEditorPresentation
          value={value}
          objectCode={nestedEditor.objectCode}
          actionCode={action.code}
          resultCode={nestedEditor.resultCode}
          onChange={onChange}
          onDelete={() => deleteRule(nestedEditor.objectCode, nestedEditor.resultCode)}
        />}
      </EditPane>
    </section>
  );
}
