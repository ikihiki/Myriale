import { useState } from 'react';
import { Button, Input, Textarea } from '../../../../components/ui';
import { EditPane } from '../../../../shared/EditPane';
import { MyrialeSelect } from '../../../../ui/MyrialeRadix';
import {
  createObjectType,
  createStateField,
  createTypeAction,
  dependencyMessageForType,
  type ScenarioRuleData,
} from './scenarioRuleDataModel';

type Props = {
  mode: 'create' | 'edit';
  value: ScenarioRuleData;
  onChange: (value: ScenarioRuleData) => void;
  onNotice: (message: string, danger?: boolean) => void;
};

const cardClass = 'grid gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4';
const miniClass = 'grid gap-2 rounded-xl border border-[#17151f]/12 bg-[#fffef9]/85 p-3';
const tableClass = 'w-full min-w-[640px] border-collapse text-left text-sm';
const cellClass = 'border-b border-[#17151f]/10 px-3 py-3 align-middle';

export function ObjectTypesEditorPresentation({ mode, value, onChange, onNotice }: Props) {
  const [selectedCode, setSelectedCode] = useState('');
  const [paneOpen, setPaneOpen] = useState(false);
  const selectedIndex = value.objectTypes.findIndex((item) => item.code === selectedCode);
  const selected = value.objectTypes[selectedIndex];

  const replaceSelected = (next: typeof selected) => {
    if (!next || selectedIndex < 0) return;
    const objectTypes = [...value.objectTypes];
    objectTypes[selectedIndex] = next;
    onChange({ ...value, objectTypes });
  };
  const openType = (code: string) => { setSelectedCode(code); setPaneOpen(true); };
  const addType = () => {
    const next = createObjectType();
    onChange({ ...value, objectTypes: [...value.objectTypes, next] });
    openType(next.code);
  };
  const removeType = () => {
    if (!selected) return;
    const blocked = dependencyMessageForType(value, selected.code);
    if (blocked) return onNotice(blocked, true);
    onChange({ ...value, objectTypes: value.objectTypes.filter((item) => item !== selected) });
    setPaneOpen(false);
    setSelectedCode('');
    onNotice(`オブジェクト種類「${selected.name}」を削除しました。`);
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
          <tbody>
            {value.objectTypes.map((type) => <tr key={type.code} className="hover:bg-white/65"><td className={cellClass}><Button size="sm" variant="secondary" onClick={() => openType(type.code)} aria-label={`${type.name}を編集`}>編集</Button></td><td className={cellClass}><strong>{type.name}</strong><span className="mt-0.5 block text-xs text-myr-ink-subtle">{type.description || '説明なし'}</span></td><td className={`${cellClass} font-mono text-xs`}>{type.code}</td><td className={cellClass}>{type.stateFields.length}件</td><td className={cellClass}>{type.actions.length}件</td></tr>)}
          </tbody>
        </table>
        {value.objectTypes.length === 0 && <p className="p-5 text-sm text-myr-ink-subtle">まだ種類がありません。「種類を追加」から登録します。</p>}
      </div>

      <EditPane open={paneOpen && Boolean(selected)} onOpenChange={setPaneOpen} eyebrow="オブジェクト種類" title={selected?.name ?? '種類を編集'} description="状態定義とアクション契約を編集します。変更はシナリオ全体の保存時に反映されます。" footer={<Button onClick={() => setPaneOpen(false)}>編集を完了</Button>}>
        {selected && (
          <div className={cardClass}>
            <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
              <label>stable code<Input aria-label="種類のstable code" value={selected.code} onChange={(event) => { const code = event.target.value; replaceSelected({ ...selected, code }); setSelectedCode(code); }} /></label>
              <label>表示名<Input aria-label="種類の表示名" value={selected.name} onChange={(event) => replaceSelected({ ...selected, name: event.target.value })} /></label>
            </div>
            <label>説明<Textarea aria-label="種類の説明" value={selected.description} onChange={(event) => replaceSelected({ ...selected, description: event.target.value })} /></label>
            <div className="flex items-center justify-between gap-2 border-t border-[#17151f]/12 pt-3"><h3>状態定義</h3><Button size="sm" variant="secondary" onClick={() => replaceSelected({ ...selected, stateFields: [...selected.stateFields, createStateField()] })}>状態を追加</Button></div>
            {selected.stateFields.map((field, index) => (
              <div className={miniClass} key={`${field.code}-${index}`}>
                <div className="grid grid-cols-2 gap-2 max-md:grid-cols-1"><label>状態code<Input aria-label={`状態${index + 1}のcode`} value={field.code} onChange={(event) => replaceSelected({ ...selected, stateFields: selected.stateFields.map((item, itemIndex) => itemIndex === index ? { ...item, code: event.target.value } : item) })} /></label><label>表示名<Input aria-label={`状態${index + 1}の表示名`} value={field.label} onChange={(event) => replaceSelected({ ...selected, stateFields: selected.stateFields.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) })} /></label></div>
                <div className="grid grid-cols-3 gap-2 max-md:grid-cols-1"><MyrialeSelect label={`状態${index + 1}の型`} value={field.valueType} onValueChange={(next) => replaceSelected({ ...selected, stateFields: selected.stateFields.map((item, itemIndex) => itemIndex === index ? { ...item, valueType: next as typeof item.valueType } : item) })} options={[{ value: 'boolean', label: '真偽' }, { value: 'string', label: '文字列' }, { value: 'number', label: '数値' }]} /><label>初期値<Input aria-label={`状態${index + 1}の初期値`} value={field.defaultValue} onChange={(event) => replaceSelected({ ...selected, stateFields: selected.stateFields.map((item, itemIndex) => itemIndex === index ? { ...item, defaultValue: event.target.value } : item) })} /></label><MyrialeSelect label={`状態${index + 1}の公開範囲`} value={field.visibility} onValueChange={(next) => replaceSelected({ ...selected, stateFields: selected.stateFields.map((item, itemIndex) => itemIndex === index ? { ...item, visibility: next as typeof item.visibility } : item) })} options={[{ value: 'public', label: '公開' }, { value: 'private', label: '非公開' }]} /></div>
                <Button size="sm" variant="text" onClick={() => replaceSelected({ ...selected, stateFields: selected.stateFields.filter((_, itemIndex) => itemIndex !== index) })}>この状態を削除</Button>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2 border-t border-[#17151f]/12 pt-3"><h3>アクション</h3><Button size="sm" variant="secondary" onClick={() => replaceSelected({ ...selected, actions: [...selected.actions, createTypeAction()] })}>アクションを追加</Button></div>
            {selected.actions.map((action, index) => (
              <div className={miniClass} key={`${action.code}-${index}`}>
                <div className="grid grid-cols-2 gap-2 max-md:grid-cols-1"><label>action code<Input aria-label={`アクション${index + 1}のcode`} value={action.code} onChange={(event) => replaceSelected({ ...selected, actions: selected.actions.map((item, itemIndex) => itemIndex === index ? { ...item, code: event.target.value } : item) })} /></label><label>表示名<Input aria-label={`アクション${index + 1}の表示名`} value={action.label} onChange={(event) => replaceSelected({ ...selected, actions: selected.actions.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) })} /></label></div>
                <label>AI向け説明<Input aria-label={`アクション${index + 1}の説明`} value={action.description} onChange={(event) => replaceSelected({ ...selected, actions: selected.actions.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item) })} /></label>
                <div className="grid grid-cols-2 gap-2 max-md:grid-cols-1"><MyrialeSelect label={`アクション${index + 1}の公開先`} value={action.visibility} onValueChange={(next) => replaceSelected({ ...selected, actions: selected.actions.map((item, itemIndex) => itemIndex === index ? { ...item, visibility: next as typeof item.visibility } : item) })} options={[{ value: 'ai-choice', label: 'AI候補' }, { value: 'manual-ui', label: '手動UI' }, { value: 'system-only', label: 'システムのみ' }]} /><MyrialeSelect label={`アクション${index + 1}の利用条件`} value={action.availability} onValueChange={(next) => replaceSelected({ ...selected, actions: selected.actions.map((item, itemIndex) => itemIndex === index ? { ...item, availability: next as typeof item.availability } : item) })} options={[{ value: 'always', label: '常に利用可能' }, { value: 'state-equals', label: '状態が一致' }]} /></div>
                {action.availability === 'state-equals' && <label>条件に使う状態code<Input aria-label={`アクション${index + 1}の条件状態code`} value={action.availabilityStateCode} onChange={(event) => replaceSelected({ ...selected, actions: selected.actions.map((item, itemIndex) => itemIndex === index ? { ...item, availabilityStateCode: event.target.value } : item) })} /></label>}
                <div className="flex items-center justify-between gap-2"><strong>引数schema</strong><Button size="sm" variant="secondary" onClick={() => replaceSelected({ ...selected, actions: selected.actions.map((item, itemIndex) => itemIndex === index ? { ...item, argumentFields: [...item.argumentFields, { code: `argument-${item.argumentFields.length + 1}`, label: '新しい引数', valueType: 'string', required: false }] } : item) })}>引数を追加</Button></div>
                {action.argumentFields.map((argument, argumentIndex) => <div key={`${argument.code}-${argumentIndex}`} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 max-md:grid-cols-1"><label>引数code<Input aria-label={`アクション${index + 1}の引数${argumentIndex + 1}code`} value={argument.code} onChange={(event) => replaceSelected({ ...selected, actions: selected.actions.map((item, itemIndex) => itemIndex === index ? { ...item, argumentFields: item.argumentFields.map((field, fieldIndex) => fieldIndex === argumentIndex ? { ...field, code: event.target.value } : field) } : item) })} /></label><label>表示名<Input aria-label={`アクション${index + 1}の引数${argumentIndex + 1}表示名`} value={argument.label} onChange={(event) => replaceSelected({ ...selected, actions: selected.actions.map((item, itemIndex) => itemIndex === index ? { ...item, argumentFields: item.argumentFields.map((field, fieldIndex) => fieldIndex === argumentIndex ? { ...field, label: event.target.value } : field) } : item) })} /></label><label className="!grid-cols-[auto_auto] items-center"><span>必須</span><input type="checkbox" aria-label={`アクション${index + 1}の引数${argumentIndex + 1}必須`} checked={argument.required} onChange={(event) => replaceSelected({ ...selected, actions: selected.actions.map((item, itemIndex) => itemIndex === index ? { ...item, argumentFields: item.argumentFields.map((field, fieldIndex) => fieldIndex === argumentIndex ? { ...field, required: event.target.checked } : field) } : item) })} /></label></div>)}
                <Button size="sm" variant="text" onClick={() => replaceSelected({ ...selected, actions: selected.actions.filter((_, itemIndex) => itemIndex !== index) })}>このアクションを削除</Button>
              </div>
            ))}
            <div className="flex justify-end"><Button size="sm" variant="text" onClick={removeType}>この種類を削除</Button></div>
          </div>
        )}
      </EditPane>
    </section>
  );
}
