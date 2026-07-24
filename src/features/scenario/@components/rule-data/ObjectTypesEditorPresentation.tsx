import { useEffect, useState } from 'react';
import { Button, Input, Textarea } from '../../../../components/ui';
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

const cardClass = 'grid gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4 shadow-[0_12px_30px_rgba(23,21,31,.07)]';
const miniClass = 'grid gap-2 rounded-xl border border-[#17151f]/12 bg-[#fffef9]/85 p-3';

export function ObjectTypesEditorPresentation({ mode, value, onChange, onNotice }: Props) {
  const [selectedCode, setSelectedCode] = useState(value.objectTypes[0]?.code ?? '');
  const selectedIndex = value.objectTypes.findIndex((item) => item.code === selectedCode);
  const selected = value.objectTypes[selectedIndex];

  useEffect(() => {
    if (!selected && value.objectTypes[0]) setSelectedCode(value.objectTypes[0].code);
  }, [selected, value.objectTypes]);

  const replaceSelected = (next: typeof selected) => {
    if (!next || selectedIndex < 0) return;
    const objectTypes = [...value.objectTypes];
    objectTypes[selectedIndex] = next;
    onChange({ ...value, objectTypes });
  };
  const addType = () => {
    const next = createObjectType();
    onChange({ ...value, objectTypes: [...value.objectTypes, next] });
    setSelectedCode(next.code);
  };
  const removeType = () => {
    if (!selected) return;
    const blocked = dependencyMessageForType(value, selected.code);
    if (blocked) return onNotice(blocked, true);
    onChange({ ...value, objectTypes: value.objectTypes.filter((item) => item !== selected) });
    setSelectedCode('');
    onNotice(`オブジェクト種類「${selected.name}」を削除しました。`);
  };

  return (
    <section aria-label="オブジェクト種類" className="grid gap-4">
      <header>
        <h2>{mode === 'edit' ? '保存済みObject Typeを編集' : 'Object Type ledger'}</h2>
        <p>{mode === 'edit' ? '保存済みの状態・アクション契約を読み込んでいます。stable codeと参照関係を保ちながら変更し、画面下の「変更を保存」で基本情報と一緒に保存します。' : '種類は状態の辞書と、AI・手動UIへ公開するアクションの境界を定義します。raw JSONではなく項目ごとに契約を組み立てます。'}</p>
      </header>
      <div className="grid grid-cols-[minmax(180px,0.34fr)_minmax(0,1fr)] gap-4 max-lg:grid-cols-1">
        <aside className={`${cardClass} content-start`} aria-label="オブジェクト種類一覧">
          <div className="flex items-center justify-between gap-2"><strong>種類</strong><Button size="sm" variant="secondary" onClick={addType}>種類を追加</Button></div>
          {value.objectTypes.length === 0 && <p>まだ種類がありません。扉、鍵、進行など、状態を持つものから登録します。</p>}
          {value.objectTypes.map((type) => <button key={type.code} type="button" aria-pressed={type.code === selectedCode} onClick={() => setSelectedCode(type.code)} className="grid cursor-pointer gap-0.5 rounded-xl border border-[#17151f]/12 bg-white/70 px-3 py-2 text-left aria-pressed:border-[#7c5cff] aria-pressed:bg-[#7c5cff]/10"><strong>{type.name}</strong><span className="font-mono text-[11px] text-[#687182]">{type.code}</span></button>)}
        </aside>
        {!selected ? <div className={cardClass}><p>「種類を追加」から状態とアクションの契約を作成します。</p></div> : (
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
      </div>
    </section>
  );
}
