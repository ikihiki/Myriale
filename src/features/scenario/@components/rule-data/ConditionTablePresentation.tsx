import { useId, useState } from 'react';
import type { ScenarioActionArgumentFieldPayload, ScenarioCondition, ScenarioStateFieldPayload } from '../../../../app/scenarioApi';
import { Button } from '../../../../components/ui';
import { EditPane } from '../../../../shared/EditPane';
import { ConditionBuilderPresentation } from './ConditionBuilderPresentation';

const tableClass = 'w-full min-w-[560px] border-collapse text-left text-sm';
const cellClass = 'border-b border-[#17151f]/10 px-3 py-3 align-middle';

type ConditionRow = {
  key: string;
  depth: number;
  join: string;
  condition: string;
  value: string;
  unsupported?: boolean;
};

const sourceNames = { state: '状態', arguments: 'アクション引数', 'session.flags': 'セッションフラグ' } as const;
const operatorNames = { eq: '＝', ne: '≠', lt: '＜', lte: '≦', gt: '＞', gte: '≧' } as const;
const scalarText = (value: string | number | boolean) => typeof value === 'string' ? `「${value}」` : String(value);

function conditionRows(condition: ScenarioCondition, join = 'ルート', depth = 0, key = 'root'): ConditionRow[] {
  if (condition.kind === 'always') return [{ key, depth, join, condition: '常に成立', value: '—' }];
  if (condition.kind === 'unsupported') return [{ key, depth, join, condition: '未対応の条件', value: '内容を変更せず保持', unsupported: true }];
  if (condition.kind === 'comparison') return [{ key, depth, join, condition: `${sourceNames[condition.source]}：${condition.path || 'field未設定'} ${operatorNames[condition.operator]}`, value: scalarText(condition.value) }];
  if (condition.kind === 'in') return [{ key, depth, join, condition: `${sourceNames[condition.source]}：${condition.path || 'field未設定'} が候補のいずれか`, value: condition.values.map(scalarText).join(', ') || '候補なし' }];
  if (condition.kind === 'exists') return [{ key, depth, join, condition: `${sourceNames[condition.source]}：${condition.path || 'field未設定'} が存在`, value: '—' }];
  if (condition.kind === 'not') return [
    { key, depth, join, condition: '否定（NOT）', value: '子条件 1件' },
    ...conditionRows(condition.child, 'NOT', depth + 1, `${key}.not`),
  ];
  const operator = condition.operator.toUpperCase();
  return [
    { key, depth, join, condition: condition.operator === 'and' ? 'すべて成立（AND）' : 'いずれか成立（OR）', value: `子条件 ${condition.children.length}件` },
    ...condition.children.flatMap((child, index) => conditionRows(child, `${operator} ${index + 1}`, depth + 1, `${key}.${index}`)),
  ];
}

export type ConditionTableProps = {
  label: string;
  value: ScenarioCondition;
  onChange?: (condition: ScenarioCondition) => void;
  stateFields: ScenarioStateFieldPayload[];
  argumentFields?: ScenarioActionArgumentFieldPayload[];
  allowArguments?: boolean;
  readOnly?: boolean;
  readOnlyDescription?: string;
  paneLayer?: number;
};

export function ConditionTablePresentation({ label, value, onChange, stateFields, argumentFields = [], allowArguments = true, readOnly = false, readOnlyDescription = 'この条件は読み取り専用です。', paneLayer = 2 }: ConditionTableProps) {
  const headingId = useId();
  const [editing, setEditing] = useState(false);
  const rows = conditionRows(value);
  const editable = !readOnly && value.kind !== 'unsupported' && Boolean(onChange);

  return <>
    <section className="grid gap-2 rounded-xl border border-[#17151f]/12 p-3" aria-labelledby={headingId}>
      <div><h3 id={headingId}>{label}</h3><p className="text-sm text-myr-ink-subtle">条件の結合と評価内容を表で確認します。</p></div>
      <div className="overflow-x-auto rounded-xl border border-[#17151f]/12 bg-white/70">
        <table aria-label={`${label} table`} className={tableClass}>
          <caption className="sr-only">{label}の構造</caption>
          <thead className="bg-[#17151f]/[.04] text-xs text-myr-slate-muted"><tr><th className={cellClass}>編集</th><th className={cellClass}>結合</th><th className={cellClass}>条件</th><th className={cellClass}>値</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.key} data-condition-row={row.key}>
            <td className={cellClass}>{editable ? <Button size="sm" variant="secondary" aria-label={`${row.join}の実行条件を編集`} onClick={() => setEditing(true)}>編集</Button> : <span className="text-xs text-myr-ink-subtle">読み取り専用</span>}</td>
            <td className={`${cellClass} whitespace-nowrap font-mono text-xs`}><span style={{ paddingLeft: `${Math.min(row.depth * 16, 48)}px` }}>{row.join}</span></td>
            <td className={cellClass}><strong>{row.condition}</strong>{row.unsupported && <span className="block text-xs text-myr-ink-subtle">未対応形式のためlosslessに保持します。</span>}</td>
            <td className={cellClass}>{row.value}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {!editable && <p className="text-xs text-myr-ink-subtle" role="note">{value.kind === 'unsupported' ? 'この条件形式は未対応です。内容を変更せず保存します。' : readOnlyDescription}</p>}
    </section>

    <EditPane layer={paneLayer} open={editing} onOpenChange={setEditing} eyebrow="実行条件" title={`${label}を編集`} description="条件の追加、削除、並べ替え、ネストを編集します。" footer={<Button onClick={() => setEditing(false)}>実行条件の編集を完了</Button>}>
      {editable && onChange && <ConditionBuilderPresentation label={label} value={value} onChange={onChange} stateFields={stateFields} argumentFields={argumentFields} allowArguments={allowArguments} />}
    </EditPane>
  </>;
}
