import { useState } from 'react';
import { useOptionalAppStore } from './app/store';
import { MyrialeDialogContent, MyrialeDialogRoot } from './ui/MyrialeRadix';

type NoteKind = 'person' | 'location';
type Certainty = 'Canon' | '未確定' | '噂';
type NoteMode = 'side' | 'full';

type SessionNote = {
  id: string;
  kind: NoteKind;
  name: string;
  aliases: string;
  details: string;
  speechOrAtmosphere: string;
  relationsOrFacilities: string;
  stateOrRules: string;
  firstTurn: string;
  certainty: Certainty;
};

const initialNotes: SessionNote[] = [
  {
    id: 'person-minato',
    kind: 'person',
    name: '月読ミナト',
    aliases: '濡れた外套の人物',
    details: '年齢不詳。濡れた外套を着ているが足元だけ乾いている。',
    speechOrAtmosphere: '静かな敬語。主人公の名前を聞き出そうとしない。',
    relationsOrFacilities: '主人公に警告する協力者候補。銀の鍵を知っている。',
    stateOrRules: '現在地: 水没した閲覧室 / 感情: 警戒しつつ協力的',
    firstTurn: 'Turn 04',
    certainty: 'Canon',
  },
  {
    id: 'location-library',
    kind: 'location',
    name: '水没した地下図書館',
    aliases: '星を食べ終えた図書館',
    details: '王都地下に広がる水没書庫。黒い水が膝まである。',
    speechOrAtmosphere: '湿った紙、星図灯の反射、遠い咳払い。',
    relationsOrFacilities: '索引棚、閉じた星座の扉、螺旋階段。',
    stateOrRules: '禁則: 名前を答えると棚の一部になる。',
    firstTurn: 'Turn 01',
    certainty: 'Canon',
  },
  {
    id: 'person-rumor',
    kind: 'person',
    name: '鐘楼の主',
    aliases: '未来の主人公という噂',
    details: '正体は不明。ミナトの言葉から存在だけ示唆された。',
    speechOrAtmosphere: '未登場。声や口調は未確定。',
    relationsOrFacilities: '主人公と関係がある可能性。',
    stateOrRules: '断定禁止。AIは可能性として扱う。',
    firstTurn: 'Turn 09',
    certainty: '噂',
  },
];

export function SessionNotesWorkspace({ mode = 'full' }: { mode?: NoteMode }) {
  const appStore = useOptionalAppStore();
  const [notes, setNotes] = useState(initialNotes);
  const [localOpenNoteId, setLocalOpenNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('セッション中いつでもノートを参照・編集できます。編集はダイアログで開き、サイド確認でも全画面でも同じDB状態を使います。');
  const [contextSummary, setContextSummary] = useState('Lorebook Canon: 月読ミナト / 水没した地下図書館。Recent Turns: 直近6件。');
  const [issue, setIssue] = useState('矛盾候補はありません。必要に応じて整合性チェックできます。');

  const openNoteId = appStore?.db.ui.openNoteId ?? localOpenNoteId;
  const editingNote = notes.find((note) => note.id === openNoteId) ?? null;
  const filteredNotes = notes.filter((note) => `${note.name} ${note.aliases}`.includes(search));
  const canonNotes = notes.filter((note) => note.certainty === 'Canon');

  const openNote = (noteId: string) => {
    if (appStore) {
      appStore.dispatch({ type: 'NOTE_DIALOG_OPENED', noteId });
    } else {
      setLocalOpenNoteId(noteId);
    }
    setNotice('ノート編集ダイアログを開きました。セッション状態を保ったまま編集できます。');
  };

  const closeNote = () => {
    if (appStore) {
      appStore.dispatch({ type: 'NOTE_DIALOG_CLOSED' });
    } else {
      setLocalOpenNoteId(null);
    }
    setNotice('ノート編集ダイアログを閉じました。開閉状態はDBのUI状態として管理します。');
  };

  const updateNote = (noteId: string, patch: Partial<SessionNote>) => {
    setNotes((current) => current.map((note) => (note.id === noteId ? { ...note, ...patch } : note)));
    setNotice('ノートを編集中です。変更はこのセッションの次ターンContext候補に反映できます。');
  };

  const createNote = (kind: NoteKind) => {
    const note: SessionNote = kind === 'person'
      ? {
          id: `person-${notes.length + 1}`,
          kind: 'person',
          name: '灯守アキラ',
          aliases: '灯台の記録係',
          details: '外見: 煤けた外套、片目に星図レンズ。年齢感は30代。',
          speechOrAtmosphere: '短く断定的に話す。語尾は「だろう」。',
          relationsOrFacilities: '地下天文台の記録係。主人公へ螺旋階段の由来を教える。',
          stateOrRules: '現在地: 地下天文台 / 確定前の提案',
          firstTurn: 'Turn 13',
          certainty: '未確定',
        }
      : {
          id: `location-${notes.length + 1}`,
          kind: 'location',
          name: '地下天文台',
          aliases: '星図盤の間',
          details: '種別: ダンジョン / 位置: 螺旋階段の先 / 危険度: 中',
          speechOrAtmosphere: '乾いた石、古い真鍮、回転する星図盤の低い音。',
          relationsOrFacilities: '主要施設: 星図盤、観測窓、封印扉。',
          stateOrRules: '禁則: 星図盤起動前に封印扉を開けない。',
          firstTurn: 'Turn 14',
          certainty: '未確定',
        };
    setNotes((current) => [...current, note]);
    openNote(note.id);
    setNotice(`${kind === 'person' ? '人物' : '場所'}ノートを作成し、編集ダイアログで開きました。`);
  };

  const markCertainty = (noteId: string, certainty: Certainty) => {
    updateNote(noteId, { certainty });
    setNotice(`ノートの確定度を「${certainty}」にしました。`);
  };

  const rebuildContext = () => {
    setContextSummary(`Lorebook Canon: ${canonNotes.map((note) => note.name).join(' / ')}。Session State + ChapterSummary + Recent Turnsを次ターンContextへ再構築。`);
    setNotice('次ターンContextを再構築しました。セッション中のノート編集を反映できます。');
  };

  const checkConsistency = () => {
    setIssue('矛盾候補: 水没した地下図書館の所在地 Canon「王都地下」と、新出発言「海底都市」が競合しています。');
    setNotice('整合性チェックで矛盾候補を検出しました。修正確定はユーザーが行います。');
  };

  return (
    <section className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)] gap-3" aria-label={mode === 'side' ? 'セッション中ノートサイドパネル' : 'セッション中ノート全画面'} data-testid={`session-notes-${mode}`}>
      <p className="visually-hidden" role="status" data-testid="session-notes-notice">{notice}</p>
      <p className="visually-hidden" data-testid="open-note-state">開いているノート: {openNoteId ?? 'なし'}</p>

      <div className="grid h-full min-h-0 grid-cols-1 items-stretch gap-2">
        <div className="grid min-h-0 content-start gap-1 overflow-auto" aria-label="ノート一覧">
          <div className={`grid items-end gap-2 border-b border-myr-ink/12 pb-1.5 ${mode === 'side' ? 'grid-cols-1' : 'grid-cols-[minmax(220px,1fr)_auto]'}`}>
            <label className="grid gap-1.5 text-xs font-black text-myr-slate-muted">ノート検索<input className="min-h-[30px] px-2 py-1.5 text-myr-ui-sm" aria-label="ノート検索" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="人物・場所名で検索" /></label>
            <div className={`flex flex-wrap gap-[5px] ${mode === 'side' ? 'justify-start' : 'justify-end'} [&_button]:rounded-full [&_button]:px-2 [&_button]:py-1 [&_button]:text-myr-caption`} aria-label="ノート操作">
              <button onClick={() => createNote('person')}>人物追加</button>
              <button onClick={() => createNote('location')}>場所追加</button>
              <button onClick={rebuildContext}>Context再構築</button>
              <button onClick={checkConsistency}>整合性チェック</button>
            </div>
          </div>

          <div className={`${mode === 'side' ? 'hidden' : 'grid'} grid-cols-[92px_minmax(120px,.8fr)_minmax(140px,1fr)_minmax(180px,1.4fr)_54px] items-center gap-2 px-1.5 py-1 text-[10px] font-black tracking-[.06em] text-myr-ink-subtle uppercase`} role="row">
            <span>種別</span><span>名前</span><span>別名・初出</span><span>要点</span><span>操作</span>
          </div>
          {filteredNotes.map((note) => (
            <article key={note.id} className={`grid items-center border-b border-myr-ink/8 px-1.5 py-[5px] text-left text-myr-ink ${mode === 'side' ? 'grid-cols-[74px_minmax(90px,1fr)_44px] gap-[5px]' : 'grid-cols-[92px_minmax(120px,.8fr)_minmax(140px,1fr)_minmax(180px,1.4fr)_54px] gap-2'}`} aria-label={`${note.name}のノート概要`}>
              <span className="text-[10px] font-black tracking-myr-label text-[#7054dd]">{note.kind === 'person' ? '人物' : '場所'} / {note.certainty}</span>
              <strong>{note.name}</strong>
              <small className={`${mode === 'side' ? 'hidden' : 'block'} overflow-hidden text-ellipsis whitespace-nowrap text-myr-ink-subtle`}>{note.aliases} · {note.firstTurn}</small>
              <p className={`${mode === 'side' ? 'hidden' : 'block'} m-0 overflow-hidden text-ellipsis whitespace-nowrap text-myr-slate`}>{note.details}</p>
              <button className="rounded-full px-2 py-1 text-myr-caption" onClick={() => openNote(note.id)} aria-label={`${note.name}を編集`}>編集</button>
            </article>
          ))}

          <section className={`${mode === 'side' ? 'hidden' : 'grid'} mt-2 gap-1 border-t border-myr-ink/16 pt-2`} aria-label="ノートContext">
            <div className="grid grid-cols-[112px_minmax(0,1fr)_auto] items-center gap-2 px-0.5 py-1 text-xs text-myr-slate-muted"><strong>Canon Notes</strong><span data-testid="canon-count">{canonNotes.length}件</span></div>
            <div className="grid grid-cols-[112px_minmax(0,1fr)_auto] items-center gap-2 px-0.5 py-1 text-xs text-myr-slate-muted"><strong>Context</strong><span data-testid="context-stack">{contextSummary}</span></div>
            <div className="grid grid-cols-[112px_minmax(0,1fr)_minmax(220px,auto)] items-center gap-2 border-t border-dashed border-myr-ink/14 px-0.5 pt-2 pb-1 text-xs text-myr-slate-muted [&_button]:rounded-full [&_button]:px-2 [&_button]:py-1 [&_button]:text-myr-caption"><strong>整合性</strong><span data-testid="consistency-issue">{issue}</span><div className="button-row"><button onClick={() => setNotice('ノート更新として確定しました。')}>ノートを更新</button><button onClick={() => setNotice('AI出力側を修正し、Canonは変更しません。')}>AI出力を修正</button><button onClick={() => setNotice('噂として保持しました。AIには断定させません。')}>噂として保持</button></div></div>
          </section>
        </div>
      </div>

      {editingNote && (
        <MyrialeDialogRoot open onOpenChange={(open) => { if (!open) closeNote(); }}>
          <MyrialeDialogContent title="ノート編集" className="wire-dialog note-edit-dialog" portal={false} data-testid="note-edit-dialog">
            <header className="flex items-center justify-between gap-4">
              <div><span>{editingNote.kind === 'person' ? '人物ノート' : '場所ノート'}</span><h2>{editingNote.name}</h2><p>{editingNote.firstTurn} 初出 / 確定度: <b>{editingNote.certainty}</b></p></div>
            </header>
            <div className="grid grid-cols-2 gap-2.5 max-myr-workspace:grid-cols-1 [&_label]:grid [&_label]:gap-[5px] [&_label]:text-xs [&_label]:font-black [&_label]:text-myr-slate-muted [&_textarea]:min-h-24">
              <label>表示名<input aria-label="表示名" value={editingNote.name} onChange={(event) => updateNote(editingNote.id, { name: event.target.value })} /></label>
              <label>別名<input aria-label="別名" value={editingNote.aliases} onChange={(event) => updateNote(editingNote.id, { aliases: event.target.value })} /></label>
              <label>外見・種別・詳細<textarea aria-label="外見・種別・詳細" value={editingNote.details} onChange={(event) => updateNote(editingNote.id, { details: event.target.value })} /></label>
              <label>口調または雰囲気<textarea aria-label="口調または雰囲気" value={editingNote.speechOrAtmosphere} onChange={(event) => updateNote(editingNote.id, { speechOrAtmosphere: event.target.value })} /></label>
              <label>関係性または施設<textarea aria-label="関係性または施設" value={editingNote.relationsOrFacilities} onChange={(event) => updateNote(editingNote.id, { relationsOrFacilities: event.target.value })} /></label>
              <label>現在状態または禁則<textarea aria-label="現在状態または禁則" value={editingNote.stateOrRules} onChange={(event) => updateNote(editingNote.id, { stateOrRules: event.target.value })} /></label>
            </div>
            <div className="button-row"><button className="primary" onClick={() => markCertainty(editingNote.id, 'Canon')}>Canonにする</button><button onClick={() => markCertainty(editingNote.id, '未確定')}>未確定にする</button><button onClick={() => markCertainty(editingNote.id, '噂')}>噂にする</button><button onClick={closeNote}>閉じる</button></div>
          </MyrialeDialogContent>
        </MyrialeDialogRoot>
      )}
    </section>
  );
}
