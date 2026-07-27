import { useState } from 'react';
import type { ScenarioNpcPayload } from '../../../app/scenarioApi';
import { Button, Input, Textarea } from '../../../components/ui';
import { EditPane } from '../../../shared/EditPane';
import { MyrialeSelect } from '../../../ui/MyrialeRadix';
import type { ScenarioRuleData } from './rule-data/scenarioRuleDataModel';

type Props = {
  value: ScenarioNpcPayload[];
  ruleData: ScenarioRuleData;
  onChange: (value: ScenarioNpcPayload[]) => void;
  onNotice: (message: string, danger?: boolean) => void;
};

const tableClass = 'w-full min-w-[880px] border-collapse text-left text-sm';
const cellClass = 'border-b border-[#17151f]/10 px-3 py-3 align-middle';
const fieldGridClass = 'grid grid-cols-2 gap-3 max-md:grid-cols-1';

const createNpc = (index: number, initialLocationCode: string): ScenarioNpcPayload => ({
  code: `new-npc-${index + 1}`,
  name: '新しいNPC',
  role: '',
  initialLocationCode,
  personality: '',
  behavior: '',
  voice: '',
  firstPerson: '',
  publicKnowledge: '',
  secrets: '',
});

export function NpcSettingsPresentation({ value, ruleData, onChange, onNotice }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = selectedIndex === null ? undefined : value[selectedIndex];
  const replaceSelected = (next: ScenarioNpcPayload) => {
    if (selectedIndex === null) return;
    onChange(value.map((npc, index) => index === selectedIndex ? next : npc));
  };
  const addNpc = () => {
    if (ruleData.locations.length === 0) {
      onNotice('先に「世界データ」でNPCの初期Locationを追加してください。', true);
      return;
    }
    const next = createNpc(value.length, ruleData.startLocationCode);
    onChange([...value, next]);
    setSelectedIndex(value.length);
  };
  const removeSelected = () => {
    if (selectedIndex === null) return;
    onChange(value.filter((_, index) => index !== selectedIndex));
    setSelectedIndex(null);
  };

  return <section className="grid gap-4" aria-label="NPC設定">
    <header className="flex items-end justify-between gap-4 max-md:items-start">
      <div>
        <h2>NPC設定</h2>
        <p>物語に登場する人物の役割、初期Location、振る舞い、口調、知識と秘密を管理します。</p>
      </div>
      <Button size="sm" variant="secondary" onClick={addNpc}>NPCを追加</Button>
    </header>

    <div className="overflow-x-auto rounded-2xl border border-[#17151f]/15 bg-white/55 shadow-[0_12px_30px_rgba(23,21,31,.07)]">
      <table className={tableClass} aria-label="NPC一覧">
        <thead className="bg-[#17151f]/[.045] text-xs text-myr-slate-muted">
          <tr><th className={cellClass}>編集</th><th className={cellClass}>名前</th><th className={cellClass}>stable code</th><th className={cellClass}>役割</th><th className={cellClass}>初期Location</th><th className={cellClass}>一人称・口調</th></tr>
        </thead>
        <tbody>{value.map((npc, index) => <tr key={`${npc.code}-${index}`}>
          <td className={cellClass}><Button size="sm" variant="secondary" aria-label={`${npc.name}を編集`} onClick={() => setSelectedIndex(index)}>編集</Button></td>
          <th scope="row" className={cellClass}>{npc.name}</th>
          <td className={`${cellClass} font-mono text-xs`}>{npc.code}</td>
          <td className={cellClass}>{npc.role || '未入力'}</td>
          <td className={cellClass}>{ruleData.locations.find((location) => location.code === npc.initialLocationCode)?.name ?? (npc.initialLocationCode || '未選択')}</td>
          <td className={cellClass}>{[npc.firstPerson, npc.voice].filter(Boolean).join(' / ') || '未入力'}</td>
        </tr>)}</tbody>
      </table>
      {value.length === 0 && <p className="p-5 text-sm text-myr-ink-subtle">NPCはまだ登録されていません。</p>}
    </div>

    <EditPane
      open={Boolean(selected)}
      onOpenChange={(open) => { if (!open) setSelectedIndex(null); }}
      eyebrow="NPC設定"
      title={selected?.name ?? 'NPCを編集'}
      description="Narrative生成時に参照する人物設定です。秘密は一貫性のためにAIへ渡しますが、公開済み情報になるまでは開示させません。"
      footer={<Button onClick={() => setSelectedIndex(null)}>編集を完了</Button>}
    >
      {selected && <div className="grid gap-4">
        <section className="grid gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4" aria-label="NPC基本情報">
          <h3>基本情報</h3>
          <div className={fieldGridClass}>
            <label>stable code<Input aria-label="NPCのstable code" value={selected.code} onChange={(event) => replaceSelected({ ...selected, code: event.target.value })} /></label>
            <label>名前<Input aria-label="NPC名" value={selected.name} onChange={(event) => replaceSelected({ ...selected, name: event.target.value })} /></label>
          </div>
          <label>役割<Input aria-label="NPCの役割" value={selected.role} onChange={(event) => replaceSelected({ ...selected, role: event.target.value })} /></label>
          <MyrialeSelect label="NPCの初期Location" value={selected.initialLocationCode} onValueChange={(initialLocationCode) => replaceSelected({ ...selected, initialLocationCode })} options={ruleData.locations.map((location) => ({ value: location.code, label: `${location.name} / ${location.code}` }))} />
        </section>
        <section className="grid gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4" aria-label="NPCの演技指針">
          <h3>演技指針</h3>
          <label>性格<Textarea aria-label="NPCの性格" value={selected.personality} onChange={(event) => replaceSelected({ ...selected, personality: event.target.value })} /></label>
          <label>行動指針<Textarea aria-label="NPCの行動指針" value={selected.behavior} onChange={(event) => replaceSelected({ ...selected, behavior: event.target.value })} /></label>
          <div className={fieldGridClass}>
            <label>一人称<Input aria-label="NPCの一人称" value={selected.firstPerson} onChange={(event) => replaceSelected({ ...selected, firstPerson: event.target.value })} /></label>
            <label>口調<Input aria-label="NPCの口調" value={selected.voice} onChange={(event) => replaceSelected({ ...selected, voice: event.target.value })} /></label>
          </div>
        </section>
        <section className="grid gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4" aria-label="NPCの知識">
          <h3>知識</h3>
          <label>公開情報<Textarea aria-label="NPCの公開情報" value={selected.publicKnowledge} onChange={(event) => replaceSelected({ ...selected, publicKnowledge: event.target.value })} /></label>
          <label>秘密・未公開情報<Textarea aria-label="NPCの秘密" value={selected.secrets} onChange={(event) => replaceSelected({ ...selected, secrets: event.target.value })} /></label>
        </section>
        <Button size="sm" variant="text" onClick={removeSelected}>このNPCを削除</Button>
      </div>}
    </EditPane>
  </section>;
}
