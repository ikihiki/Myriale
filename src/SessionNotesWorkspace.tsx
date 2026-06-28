import { useState } from 'react';
import { useOptionalAppStore } from './app/store';

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
  const [selectedId, setSelectedId] = useState(initialNotes[0].id);
  const [localOpenNoteId, setLocalOpenNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('セッション中いつでもノートを参照・編集できます。編集はダイアログで開き、サイド確認でも全画面でも同じDB状態を使います。');
  const [contextSummary, setContextSummary] = useState('Lorebook Canon: 月読ミナト / 水没した地下図書館。Recent Turns: 直近6件。');
  const [issue, setIssue] = useState('矛盾候補はありません。必要に応じて整合性チェックできます。');

  const openNoteId = appStore?.db.ui.openNoteId ?? localOpenNoteId;
  const selected = notes.find((note) => note.id === selectedId) ?? notes[0];
  const editingNote = notes.find((note) => note.id === openNoteId) ?? null;
  const filteredNotes = notes.filter((note) => `${note.name} ${note.aliases}`.includes(search));
  const canonNotes = notes.filter((note) => note.certainty === 'Canon');

  const openNote = (noteId: string) => {
    setSelectedId(noteId);
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
    setSelectedId(note.id);
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
    <section className={`session-notes-workspace ${mode === 'side' ? 'side' : 'full'}`} aria-label={mode === 'side' ? 'セッション中ノートサイドパネル' : 'セッション中ノート全画面'} data-testid={`session-notes-${mode}`}>
      <header className="notes-workspace-header">
        <div>
          <span className="kicker">Session notes / unified workspace</span>
          <h2>ノート</h2>
          <p role="status" data-testid="session-notes-notice">{notice}</p>
          <p data-testid="open-note-state">開いているノート: {openNoteId ?? 'なし'}</p>
        </div>
      </header>

      <div className="session-notes-grid">
        <div className="lorebook-list compact-note-list" aria-label="ノート一覧">
          <div className="note-list-toolbar">
            <label>ノート検索<input aria-label="ノート検索" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="人物・場所名で検索" /></label>
            <div className="note-list-actions" aria-label="ノート操作">
              <button onClick={() => createNote('person')}>人物追加</button>
              <button onClick={() => createNote('location')}>場所追加</button>
              <button onClick={rebuildContext}>Context再構築</button>
              <button onClick={checkConsistency}>整合性チェック</button>
            </div>
          </div>

          <div className="note-list-header" role="row">
            <span>種別</span><span>名前</span><span>別名・初出</span><span>要点</span><span>操作</span>
          </div>
          {filteredNotes.map((note) => (
            <article key={note.id} className={`note-notification note-list-row ${selected.id === note.id ? 'active' : ''}`} aria-label={`${note.name}のノート概要`}>
              <span>{note.kind === 'person' ? '人物' : '場所'} / {note.certainty}</span>
              <strong>{note.name}</strong>
              <small>{note.aliases} · {note.firstTurn}</small>
              <p>{note.details}</p>
              <button onClick={() => openNote(note.id)} aria-label={`${note.name}を編集`}>編集</button>
            </article>
          ))}

          <section className="notes-context-panel" aria-label="ノートContext">
            <div className="notes-context-line"><strong>選択中</strong><span>{selected.name} / {selected.aliases}</span><button className="primary" onClick={() => openNote(selected.id)}>選択中ノートを編集</button></div>
            <div className="notes-context-line"><strong>Canon Notes</strong><span data-testid="canon-count">{canonNotes.length}件</span></div>
            <div className="notes-context-line"><strong>Context</strong><span data-testid="context-stack">{contextSummary}</span></div>
            <div className="notes-consistency-line"><strong>整合性</strong><span data-testid="consistency-issue">{issue}</span><div className="button-row"><button onClick={() => setNotice('ノート更新として確定しました。')}>ノートを更新</button><button onClick={() => setNotice('AI出力側を修正し、Canonは変更しません。')}>AI出力を修正</button><button onClick={() => setNotice('噂として保持しました。AIには断定させません。')}>噂として保持</button></div></div>
          </section>
        </div>
      </div>

      {editingNote && (
        <div className="wire-dialog-backdrop" role="presentation">
          <section className="wire-dialog note-edit-dialog" role="dialog" aria-modal="true" aria-label="ノート編集" data-testid="note-edit-dialog">
            <header className="wire-dialog-head">
              <div><span>{editingNote.kind === 'person' ? '人物ノート' : '場所ノート'}</span><h2>{editingNote.name}</h2><p>{editingNote.firstTurn} 初出 / 確定度: <b>{editingNote.certainty}</b></p></div>
              <button type="button" aria-label="ノート編集を閉じる" onClick={closeNote}>×</button>
            </header>
            <div className="lorebook-fields">
              <label>表示名<input aria-label="表示名" value={editingNote.name} onChange={(event) => updateNote(editingNote.id, { name: event.target.value })} /></label>
              <label>別名<input aria-label="別名" value={editingNote.aliases} onChange={(event) => updateNote(editingNote.id, { aliases: event.target.value })} /></label>
              <label>外見・種別・詳細<textarea aria-label="外見・種別・詳細" value={editingNote.details} onChange={(event) => updateNote(editingNote.id, { details: event.target.value })} /></label>
              <label>口調または雰囲気<textarea aria-label="口調または雰囲気" value={editingNote.speechOrAtmosphere} onChange={(event) => updateNote(editingNote.id, { speechOrAtmosphere: event.target.value })} /></label>
              <label>関係性または施設<textarea aria-label="関係性または施設" value={editingNote.relationsOrFacilities} onChange={(event) => updateNote(editingNote.id, { relationsOrFacilities: event.target.value })} /></label>
              <label>現在状態または禁則<textarea aria-label="現在状態または禁則" value={editingNote.stateOrRules} onChange={(event) => updateNote(editingNote.id, { stateOrRules: event.target.value })} /></label>
            </div>
            <div className="button-row"><button className="primary" onClick={() => markCertainty(editingNote.id, 'Canon')}>Canonにする</button><button onClick={() => markCertainty(editingNote.id, '未確定')}>未確定にする</button><button onClick={() => markCertainty(editingNote.id, '噂')}>噂にする</button><button onClick={closeNote}>閉じる</button></div>
          </section>
        </div>
      )}
    </section>
  );
}
