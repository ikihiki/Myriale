import { useState } from 'react';
import type { ScenarioNpcPayload } from '../../../app/scenarioApi';
import { Button, Input, MarkdownEditor } from '../../../components/ui';
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

const profileTemplate = `## 役割

このNPCが物語で担う役割を記述します。

## 人物像と演技指針

- 性格、価値観、感情の出し方
- 状態に応じた振る舞い
- 避けるべき演技

## 話し方

- 一人称:
- 口調:

## 知識

このNPCが知っていることを記述します。

## 秘密・条件付き知識

秘密の内容と、どの公開状態・factsが揃った場合に話せるかを記述します。
`;

const createNpc = (index: number, initialLocationCode: string): ScenarioNpcPayload => ({
  code: `new-npc-${index + 1}`,
  name: '新しいNPC',
  initialLocationCode,
  profileMarkdown: profileTemplate,
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
      onNotice('先に「場所」ステップでNPCの初期Locationを追加してください。', true);
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
        <p>識別情報と初期Locationは構造化し、演技指針や知識はシナリオ固有のMarkdownで自由に記述します。</p>
      </div>
      <Button size="sm" variant="secondary" onClick={addNpc}>NPCを追加</Button>
    </header>

    <div className="overflow-x-auto rounded-2xl border border-[#17151f]/15 bg-white/55 shadow-[0_12px_30px_rgba(23,21,31,.07)]">
      <table className={tableClass} aria-label="NPC一覧">
        <thead className="bg-[#17151f]/[.045] text-xs text-myr-slate-muted">
          <tr><th className={cellClass}>編集</th><th className={cellClass}>名前</th><th className={cellClass}>stable code</th><th className={cellClass}>初期Location</th><th className={cellClass}>Markdownプロフィール</th></tr>
        </thead>
        <tbody>{value.map((npc, index) => <tr key={`${npc.code}-${index}`}>
          <td className={cellClass}><Button size="sm" variant="secondary" aria-label={`${npc.name}を編集`} onClick={() => setSelectedIndex(index)}>編集</Button></td>
          <th scope="row" className={cellClass}>{npc.name}</th>
          <td className={`${cellClass} font-mono text-xs`}>{npc.code}</td>
          <td className={cellClass}>{ruleData.locations.find((location) => location.code === npc.initialLocationCode)?.name ?? (npc.initialLocationCode || '未選択')}</td>
          <td className={cellClass}>{npc.profileMarkdown.trim() ? `${npc.profileMarkdown.trim().length.toLocaleString()}文字` : '未入力'}</td>
        </tr>)}</tbody>
      </table>
      {value.length === 0 && <p className="p-5 text-sm text-myr-ink-subtle">NPCはまだ登録されていません。</p>}
    </div>

    <EditPane
      open={Boolean(selected)}
      onOpenChange={(open) => { if (!open) setSelectedIndex(null); }}
      eyebrow="NPC設定"
      title={selected?.name ?? 'NPCを編集'}
      description="人物像、演技指針、話し方、知識をMarkdownで自由に記述します。秘密の開示可否はルールエンジンの公開状態とfactsで制御してください。"
      footer={<Button onClick={() => setSelectedIndex(null)}>編集を完了</Button>}
    >
      {selected && <div className="grid gap-4">
        <section className="grid gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4" aria-label="NPC基本情報">
          <h3>基本情報</h3>
          <div className={fieldGridClass}>
            <label>stable code<Input aria-label="NPCのstable code" value={selected.code} onChange={(event) => replaceSelected({ ...selected, code: event.target.value })} /></label>
            <label>名前<Input aria-label="NPC名" value={selected.name} onChange={(event) => replaceSelected({ ...selected, name: event.target.value })} /></label>
          </div>
          <MyrialeSelect label="NPCの初期Location" value={selected.initialLocationCode} onValueChange={(initialLocationCode) => replaceSelected({ ...selected, initialLocationCode })} options={ruleData.locations.map((location) => ({ value: location.code, label: `${location.name} / ${location.code}` }))} />
        </section>
        <section className="grid gap-3 rounded-2xl border border-[#17151f]/15 bg-white/55 p-4" aria-label="NPCのMarkdownプロフィール">
          <div>
            <h3>Markdownプロフィール</h3>
            <p className="mt-1 text-sm leading-6 text-myr-slate-muted">見出しは例です。シナリオに必要な項目を追加・削除できます。状態変化や秘密の開示判定は、文章ではなく世界データのルールでも定義してください。</p>
          </div>
          <MarkdownEditor
            label="NPCプロフィール"
            value={selected.profileMarkdown}
            onChange={(profileMarkdown) => replaceSelected({ ...selected, profileMarkdown })}
            placeholder={profileTemplate}
            help="このMarkdownはAIへ人物表現の参考情報として渡されます。現在状態、公開済みfacts、禁止factsが正史として優先されます。"
          />
        </section>
        <Button size="sm" variant="text" onClick={removeSelected}>このNPCを削除</Button>
      </div>}
    </EditPane>
  </section>;
}
