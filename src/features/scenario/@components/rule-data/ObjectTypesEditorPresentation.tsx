import { useState } from 'react';
import { Button, Input, Textarea } from '../../../../components/ui';
import { EditPane } from '../../../../shared/EditPane';
import { ObjectActionRuleEditorPresentation } from './ObjectActionRuleEditorPresentation';
import { RuleConfigurationEditorPresentation } from './RuleConfigurationEditorPresentation';
import {
  createActionRule,
  createObjectType,
  dependencyMessageForType,
  dependencyMessageForTypeRule,
  renameTypeActionCode,
  renameTypeRuleCode,
  type ScenarioActionRule,
  type ScenarioRuleData,
} from './scenarioRuleDataModel';

type Props = { mode: 'create' | 'edit'; value: ScenarioRuleData; onChange: (value: ScenarioRuleData) => void; onNotice: (message: string, danger?: boolean) => void };
const cardClass = 'grid gap-4 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4';
const tableClass = 'w-full min-w-[560px] border-collapse text-left text-sm';
const cellClass = 'border-b border-[#17151f]/10 px-3 py-3 align-middle';

export function ObjectTypesEditorPresentation({ mode, value, onChange, onNotice }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [paneOpen, setPaneOpen] = useState(false);
  const [editingRuleCode, setEditingRuleCode] = useState<string | null>(null);
  const selected = selectedIndex === null ? undefined : value.objectTypes[selectedIndex];
  const editingRule = selected?.actionRules.find((rule) => rule.code === editingRuleCode);
  const replaceSelected = (next: typeof selected) => {
    if (!selected || !next || selectedIndex === null) return;
    const previousCode = selected.code;
    onChange({
      ...value,
      objectTypes: value.objectTypes.map((type, index) => index === selectedIndex ? next : type),
      objects: value.objects.map((object) => !object.mixinTypeCodes.includes(previousCode) ? object : {
        ...object,
        mixinTypeCodes: object.mixinTypeCodes.map((code) => code === previousCode ? next.code : code),
        actionRules: object.actionRules.map((operation) => operation.operation !== 'add' && operation.targetTypeCode === previousCode ? { ...operation, targetTypeCode: next.code } : operation),
      }),
    });
  };
  const openType = (index: number) => { setSelectedIndex(index); setEditingRuleCode(null); setPaneOpen(true); };
  const addType = () => { const next = createObjectType(); onChange({ ...value, objectTypes: [...value.objectTypes, next] }); openType(value.objectTypes.length); };
  const removeType = () => {
    if (!selected || selectedIndex === null) return;
    const blocked = dependencyMessageForType(value, selected.code);
    if (blocked) return onNotice(blocked, true);
    onChange({ ...value, objectTypes: value.objectTypes.filter((_, index) => index !== selectedIndex) }); setPaneOpen(false); setSelectedIndex(null);
  };
  const replaceRule = (next: ScenarioActionRule) => {
    if (!selected || !editingRule) return;
    if (next.code !== editingRule.code) {
      const renamedData = renameTypeRuleCode(value, selected.code, editingRule.code, next.code);
      onChange({
        ...renamedData,
        objectTypes: renamedData.objectTypes.map((type) => type.code === selected.code
          ? { ...type, actionRules: type.actionRules.map((rule) => rule.code === next.code ? next : rule) }
          : type),
      });
      setEditingRuleCode(next.code);
      return;
    }
    replaceSelected({ ...selected, actionRules: selected.actionRules.map((rule) => rule.code === editingRule.code ? next : rule) });
  };
  const deleteRule = () => {
    if (!selected || !editingRule) return;
    const blocked = dependencyMessageForTypeRule(value, selected.code, editingRule.code);
    if (blocked) return onNotice(blocked, true);
    replaceSelected({ ...selected, actionRules: selected.actionRules.filter((rule) => rule.code !== editingRule.code) }); setEditingRuleCode(null);
  };

  return <section aria-label="オブジェクト種類" className="grid gap-4">
    <header className="flex items-end justify-between gap-4 max-md:items-start"><div><h2>オブジェクト種類</h2><p>{mode === 'edit' ? '保存済みの種類、状態、アクション、実行ルールを編集します。' : '種類、状態、アクション、実行ルールを定義します。'}</p></div><Button size="sm" variant="secondary" onClick={addType}>種類を追加</Button></header>
    <div className="overflow-x-auto rounded-2xl border border-[#17151f]/15 bg-white/55 shadow-[0_12px_30px_rgba(23,21,31,.07)]"><table className={tableClass}><thead className="bg-[#17151f]/[.045] text-xs text-myr-slate-muted"><tr><th className={cellClass}>編集</th><th className={cellClass}>表示名</th><th className={cellClass}>stable code</th><th className={cellClass}>状態</th><th className={cellClass}>アクション</th><th className={cellClass}>実行ルール</th></tr></thead><tbody>
      {value.objectTypes.map((type, index) => <tr key={`${type.code}-${index}`}><td className={cellClass}><Button size="sm" variant="secondary" onClick={() => openType(index)} aria-label={`${type.name}を編集`}>編集</Button></td><td className={cellClass}><strong>{type.name}</strong></td><td className={`${cellClass} font-mono text-xs`}>{type.code}</td><td className={cellClass}>{type.stateFields.length}件</td><td className={cellClass}>{type.actions.length}件</td><td className={cellClass}>{type.actionRules.length}件</td></tr>)}
    </tbody></table>{value.objectTypes.length === 0 && <p className="p-5 text-sm text-myr-ink-subtle">まだ種類がありません。</p>}</div>

    <EditPane open={paneOpen && Boolean(selected)} onOpenChange={(open) => { setPaneOpen(open); if (!open) setEditingRuleCode(null); }} eyebrow="オブジェクト種類" title={selected?.name ?? '種類を編集'} description="種類の基本情報、状態、アクション、実行ルールを管理します。Object固有の設定はObject側で編集します。" footer={<Button onClick={() => setPaneOpen(false)}>編集を完了</Button>}>
      {selected && <div className="grid gap-4">
        <section aria-labelledby="type-basic-information-heading" className={cardClass}>
          <h3 id="type-basic-information-heading">基本情報</h3>
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1"><label>stable code<Input aria-label="種類のstable code" value={selected.code} onChange={(event) => replaceSelected({ ...selected, code: event.target.value })} /></label><label>表示名<Input aria-label="種類の表示名" value={selected.name} onChange={(event) => replaceSelected({ ...selected, name: event.target.value })} /></label></div>
          <label>説明<Textarea aria-label="種類の説明" value={selected.description} onChange={(event) => replaceSelected({ ...selected, description: event.target.value })} /></label>
        </section>
        <RuleConfigurationEditorPresentation
          stateFields={selected.stateFields}
          actions={selected.actions}
          onChange={(configuration) => replaceSelected({ ...selected, ...configuration })}
          onRenameState={(index, code) => {
            const previous = selected.stateFields[index];
            replaceSelected({ ...selected,
              stateFields: selected.stateFields.map((field, fieldIndex) => fieldIndex === index ? { ...field, code } : field),
              actions: selected.actions.map((action) => action.availabilityStateCode === previous.code ? { ...action, availabilityStateCode: code } : action),
            });
          }}
          onRenameAction={(index, code) => { onChange(renameTypeActionCode(value, selected.code, selected.actions[index].code, code)); }}
          onDeleteState={(index) => {
            const state = selected.stateFields[index];
            if (selected.actions.some((action) => action.availabilityStateCode === state.code)) return onNotice('この状態を参照するAction提示条件があります。先に参照を解除してください。', true);
            replaceSelected({ ...selected, stateFields: selected.stateFields.filter((_, fieldIndex) => fieldIndex !== index) });
          }}
          onDeleteAction={(index) => {
            const action = selected.actions[index];
            const referenced = selected.actionRules.some((rule) => rule.actionCode === action.code) || value.objects.some((object) => object.mixinTypeCodes.includes(selected.code) && object.actionRules.some((operation) => (operation.operation === 'add' || operation.operation === 'override') && operation.rule.actionCode === action.code));
            if (referenced) return onNotice('このアクションを参照するruleがあります。先にルールを削除してください。', true);
            replaceSelected({ ...selected, actions: selected.actions.filter((_, actionIndex) => actionIndex !== index) });
          }}
        />
        <section aria-labelledby="type-execution-rules-heading" className={cardClass}><div className="flex items-center justify-between gap-2"><div><h3 id="type-execution-rules-heading">実行ルール</h3><p className="text-sm text-myr-ink-subtle">すべての実行ルールに参照用stable codeが必要です。</p></div><Button size="sm" variant="secondary" disabled={!selected.actions[0]} onClick={() => { const rule = createActionRule(selected.actions[0]?.code ?? ''); replaceSelected({ ...selected, actionRules: [...selected.actionRules, rule] }); setEditingRuleCode(rule.code); }}>実行ルールを追加</Button></div>
          <div className="overflow-x-auto rounded-xl border border-[#17151f]/12 bg-white/70"><table className={tableClass}><thead className="text-xs text-myr-slate-muted"><tr><th className={cellClass}>編集</th><th className={cellClass}>stable code</th><th className={cellClass}>アクション</th><th className={cellClass}>優先度</th><th className={cellClass}>効果</th></tr></thead><tbody>{selected.actionRules.map((rule) => <tr key={rule.code}><td className={cellClass}><Button size="sm" variant="secondary" aria-label={`${rule.code}の実行ルールを編集`} onClick={() => setEditingRuleCode(rule.code)}>編集</Button></td><td className={`${cellClass} font-mono text-xs`}>{rule.code}</td><td className={cellClass}>{selected.actions.find((action) => action.code === rule.actionCode)?.label ?? rule.actionCode}</td><td className={cellClass}>{rule.priority}</td><td className={cellClass}>{rule.effects.length}件</td></tr>)}</tbody></table>{selected.actionRules.length === 0 && <p className="p-4 text-sm text-myr-ink-subtle">実行ルールはありません。</p>}</div>
        </section>
        <Button size="sm" variant="text" onClick={removeType}>この種類を削除</Button>
      </div>}
    </EditPane>

    <EditPane layer={1} open={Boolean(editingRule)} onOpenChange={(open) => { if (!open) setEditingRuleCode(null); }} eyebrow="実行ルール" title={editingRule?.code ?? '実行ルールを編集'} description="条件、優先度、メモ、効果、module bindingを編集します。" footer={<Button onClick={() => setEditingRuleCode(null)}>実行ルールの編集を完了</Button>}>
      {selected && editingRule && <ObjectActionRuleEditorPresentation value={value} rule={editingRule} actions={selected.actions} onChange={replaceRule} onDelete={deleteRule} />}
    </EditPane>
  </section>;
}
