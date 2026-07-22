import { useEffect, useState } from 'react';
import { actionRowClassName, Button, Input, Textarea } from './components/ui';
import { getSessionMemory, saveSessionLorebookEntry, type SessionLorebookEntryApiResponse, type SessionSummaryApiResponse } from './features/session-play/sessionPlayApi';
import { useOptionalAppStore } from './app/store';
import { MyrialeDialogContent, MyrialeDialogRoot } from './ui/MyrialeRadix';

type NoteKind = 'person' | 'location' | 'item' | 'organization' | 'rule';
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
  revision?: number;
  referencedByTurnIds?: string[];
  persisted?: boolean;
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

const certaintyFromApi = (status: SessionLorebookEntryApiResponse['canonStatus']): Certainty =>
  status === 'canon' ? 'Canon' : status === 'rumor' ? '噂' : '未確定';
const certaintyToApi = (certainty: Certainty): SessionLorebookEntryApiResponse['canonStatus'] =>
  certainty === 'Canon' ? 'canon' : certainty === '噂' ? 'rumor' : 'unconfirmed';
const kindLabel = (kind: NoteKind) => ({ person: '人物', location: '場所', item: 'アイテム', organization: '組織', rule: 'ルール' })[kind];

const decodeContent = (content: string) => {
  try {
    const parsed = JSON.parse(content) as Partial<Pick<SessionNote, 'details' | 'speechOrAtmosphere' | 'relationsOrFacilities' | 'stateOrRules'>>;
    if (parsed && typeof parsed === 'object') return {
      details: parsed.details ?? '', speechOrAtmosphere: parsed.speechOrAtmosphere ?? '',
      relationsOrFacilities: parsed.relationsOrFacilities ?? '', stateOrRules: parsed.stateOrRules ?? '',
    };
  } catch { /* Legacy plain-text note. */ }
  return { details: content, speechOrAtmosphere: '', relationsOrFacilities: '', stateOrRules: '' };
};

const fromApi = (entry: SessionLorebookEntryApiResponse): SessionNote => ({
  id: entry.id, kind: entry.kind, name: entry.displayName, aliases: entry.aliases.join(' / '),
  ...decodeContent(entry.content), firstTurn: entry.firstTurnId ?? '未設定', certainty: certaintyFromApi(entry.canonStatus),
  revision: entry.revision, referencedByTurnIds: entry.referencedByTurnIds, persisted: true,
});

export function SessionNotesWorkspace({ mode = 'full', sessionId }: { mode?: NoteMode; sessionId?: string }) {
  const appStore = useOptionalAppStore();
  const [notes, setNotes] = useState(initialNotes);
  const [summaries, setSummaries] = useState<SessionSummaryApiResponse[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [localOpenNoteId, setLocalOpenNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('セッション中いつでもノートを参照・編集できます。編集はダイアログで開き、サイド確認でも全画面でも同じDB状態を使います。');
  const [contextSummary, setContextSummary] = useState('Lorebook Canon: 月読ミナト / 水没した地下図書館。Recent Turns: 直近6件。');
  const [issue, setIssue] = useState('矛盾候補はありません。必要に応じて整合性チェックできます。');

  useEffect(() => {
    if (!sessionId) return;
    const abort = new AbortController();
    void getSessionMemory(sessionId, undefined, abort.signal)
      .then((memory) => {
        setNotes(memory.lorebook.map(fromApi));
        setSummaries(memory.summaries);
        setNotice('Serverに保存されたLorebookとSummaryを読み込みました。');
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
        setNotice(reason instanceof Error ? reason.message : 'Session Memoryを読み込めませんでした。');
      });
    return () => abort.abort();
  }, [sessionId]);

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
    const examples: Record<NoteKind, { name: string; aliases: string; details: string }> = {
      person: { name: '灯守アキラ', aliases: '灯台の記録係', details: '外見、立場、知識、秘密、公開条件を記録します。' },
      location: { name: '地下天文台', aliases: '星図盤の間', details: '位置、雰囲気、施設、危険を記録します。' },
      item: { name: '新しいアイテム', aliases: '', details: '所有者、状態、効果、消費状況を記録します。' },
      organization: { name: '新しい組織', aliases: '', details: '目的、構成員、関係性を記録します。' },
      rule: { name: '新しいルール', aliases: '', details: '世界法則、禁則、例外を記録します。' },
    };
    const example = examples[kind];
    const note: SessionNote = {
      id: `draft-${kind}-${crypto.randomUUID?.() ?? Date.now()}`, kind, name: example.name, aliases: example.aliases,
      details: example.details, speechOrAtmosphere: '', relationsOrFacilities: '', stateOrRules: '',
      firstTurn: '未設定', certainty: '未確定', persisted: false,
    };
    setNotes((current) => [...current, note]);
    openNote(note.id);
    setNotice(`${kindLabel(kind)}ノートを作成し、編集ダイアログで開きました。保存するまでCanonにはなりません。`);
  };

  const markCertainty = (noteId: string, certainty: Certainty) => {
    updateNote(noteId, { certainty });
    setNotice(`ノートの確定度を「${certainty}」にしました。`);
  };

  const saveNote = async (note: SessionNote) => {
    if (!sessionId) {
      setNotice('Storybook fixtureとしてローカル状態を保存しました。');
      closeNote();
      return;
    }
    setIsSaving(true);
    try {
      const saved = await saveSessionLorebookEntry(sessionId, {
        kind: note.kind,
        displayName: note.name,
        aliases: note.aliases.split(/[／/]/).map((alias) => alias.trim()).filter(Boolean),
        content: JSON.stringify({
          details: note.details, speechOrAtmosphere: note.speechOrAtmosphere,
          relationsOrFacilities: note.relationsOrFacilities, stateOrRules: note.stateOrRules,
        }),
        canonStatus: certaintyToApi(note.certainty),
        firstTurnId: note.firstTurn && note.firstTurn !== '未設定' && !note.firstTurn.startsWith('Turn ') ? note.firstTurn : null,
        expectedRevision: note.persisted ? note.revision : undefined,
      }, note.persisted ? note.id : undefined);
      setNotes((current) => current.map((item) => item.id === note.id ? fromApi(saved) : item));
      setNotice('Lorebook entryをServerへ保存し、次のNarrative Context候補へ反映しました。');
      closeNote();
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : 'Lorebook entryを保存できませんでした。');
    } finally {
      setIsSaving(false);
    }
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
            <label className="grid gap-1.5 text-xs font-black text-myr-slate-muted">ノート検索<Input variant="compact" aria-label="ノート検索" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="人物・場所名で検索" /></label>
            <div className={`flex flex-wrap gap-1.25 ${mode === 'side' ? 'justify-start' : 'justify-end'} [&_button]:rounded-full [&_button]:px-2 [&_button]:py-1 [&_button]:text-myr-caption`} aria-label="ノート操作">
              <Button onClick={() => createNote('person')}>人物追加</Button>
              <Button onClick={() => createNote('location')}>場所追加</Button>
              <Button onClick={() => createNote('item')}>アイテム追加</Button>
              <Button onClick={() => createNote('organization')}>組織追加</Button>
              <Button onClick={() => createNote('rule')}>ルール追加</Button>
              <Button onClick={rebuildContext}>Context再構築</Button>
              <Button onClick={checkConsistency}>整合性チェック</Button>
            </div>
          </div>

          <div className={`${mode === 'side' ? 'hidden' : 'grid'} grid-cols-[92px_minmax(120px,.8fr)_minmax(140px,1fr)_minmax(180px,1.4fr)_54px] items-center gap-2 px-1.5 py-1 text-myr-micro font-black tracking-[.06em] text-myr-ink-subtle uppercase`} role="row">
            <span>種別</span><span>名前</span><span>別名・初出</span><span>要点</span><span>操作</span>
          </div>
          {filteredNotes.map((note) => (
            <article key={note.id} className={`grid items-center border-b border-myr-ink/8 px-1.5 py-1.25 text-left text-myr-ink ${mode === 'side' ? 'grid-cols-[74px_minmax(90px,1fr)_44px] gap-1.25' : 'grid-cols-[92px_minmax(120px,.8fr)_minmax(140px,1fr)_minmax(180px,1.4fr)_54px] gap-2'}`} aria-label={`${note.name}のノート概要`}>
              <span className="text-myr-micro font-black tracking-myr-label text-[#7054dd]">{kindLabel(note.kind)} / {note.certainty}</span>
              <strong>{note.name}</strong>
              <small className={`${mode === 'side' ? 'hidden' : 'block'} overflow-hidden text-ellipsis whitespace-nowrap text-myr-ink-subtle`}>{note.aliases} · {note.firstTurn}</small>
              <p className={`${mode === 'side' ? 'hidden' : 'block'} m-0 overflow-hidden text-ellipsis whitespace-nowrap text-myr-slate`}>{note.details}</p>
              <Button variant="ghost" size="sm" onClick={() => openNote(note.id)} aria-label={`${note.name}を編集`}>編集</Button>
            </article>
          ))}

          <section className={`${mode === 'side' ? 'hidden' : 'grid'} mt-2 gap-1 border-t border-myr-ink/16 pt-2`} aria-label="ノートContext">
            <div className="grid grid-cols-[112px_minmax(0,1fr)_auto] items-center gap-2 px-0.5 py-1 text-xs text-myr-slate-muted"><strong>Canon Notes</strong><span data-testid="canon-count">{canonNotes.length}件</span></div>
            <div className="grid grid-cols-[112px_minmax(0,1fr)_auto] items-center gap-2 px-0.5 py-1 text-xs text-myr-slate-muted"><strong>Context</strong><span data-testid="context-stack">{contextSummary}</span></div>
            <div className="grid grid-cols-[112px_minmax(0,1fr)_auto] items-center gap-2 px-0.5 py-1 text-xs text-myr-slate-muted"><strong>Latest Summary</strong><span data-testid="latest-session-summary">{summaries.at(-1) ? `v${summaries.at(-1)?.version} / Turn ${summaries.at(-1)?.fromPosition}-${summaries.at(-1)?.toPosition} / ${summaries.at(-1)?.currentLocation || '現在地未設定'}` : '未生成'}</span></div>
            <div className="grid grid-cols-[112px_minmax(0,1fr)_auto] items-center gap-2 px-0.5 py-1 text-xs text-myr-slate-muted"><strong>参照Canon</strong><span data-testid="lorebook-reference-debug">{notes.filter((note) => (note.referencedByTurnIds?.length ?? 0) > 0).map((note) => `${note.name}: ${note.referencedByTurnIds?.join(', ')}`).join(' / ') || '次のNarrative生成後に参照Turnを表示'}</span></div>
            <div className="grid grid-cols-[112px_minmax(0,1fr)_minmax(220px,auto)] items-center gap-2 border-t border-dashed border-myr-ink/14 px-0.5 pt-2 pb-1 text-xs text-myr-slate-muted"><strong>整合性</strong><span data-testid="consistency-issue">{issue}</span><div className={actionRowClassName}><Button variant="ghost" size="sm" onClick={() => setNotice('ノート更新として確定しました。')}>ノートを更新</Button><Button variant="ghost" size="sm" onClick={() => setNotice('AI出力側を修正し、Canonは変更しません。')}>AI出力を修正</Button><Button variant="ghost" size="sm" onClick={() => setNotice('噂として保持しました。AIには断定させません。')}>噂として保持</Button></div></div>
          </section>
        </div>
      </div>

      {editingNote && (
        <MyrialeDialogRoot open onOpenChange={(open) => { if (!open) closeNote(); }}>
          <MyrialeDialogContent
            title="ノート編集"
            size="editor"
            portal={false}
            data-testid="note-edit-dialog"
            footer={(
              <>
                <Button variant="primary" size="sm" disabled={isSaving} onClick={() => void saveNote(editingNote)}>{isSaving ? '保存中…' : 'Serverへ保存'}</Button>
                <Button variant="primary" size="sm" onClick={() => markCertainty(editingNote.id, 'Canon')}>Canonにする</Button>
                <Button variant="secondary" size="sm" onClick={() => markCertainty(editingNote.id, '未確定')}>未確定にする</Button>
                <Button variant="secondary" size="sm" onClick={() => markCertainty(editingNote.id, '噂')}>噂にする</Button>
                <Button variant="ghost" size="sm" onClick={closeNote}>閉じる</Button>
              </>
            )}
          >
            <header className="flex items-center justify-between gap-4">
              <div><span>{kindLabel(editingNote.kind)}ノート</span><h3 className="my-1 font-myr-display text-2xl tracking-myr-display">{editingNote.name}</h3><p className="m-0 text-sm text-myr-slate">{editingNote.firstTurn} 初出 / 確定度: <b>{editingNote.certainty}</b></p></div>
            </header>
            <div className="mt-4 grid grid-cols-2 gap-2.5 max-myr-workspace:grid-cols-1 [&_label]:grid [&_label]:gap-1.25 [&_label]:text-xs [&_label]:font-black [&_label]:text-myr-slate-muted [&_textarea]:min-h-24">
              <label>表示名<Input aria-label="表示名" value={editingNote.name} onChange={(event) => updateNote(editingNote.id, { name: event.target.value })} /></label>
              <label>別名<Input aria-label="別名" value={editingNote.aliases} onChange={(event) => updateNote(editingNote.id, { aliases: event.target.value })} /></label>
              <label>外見・種別・詳細<Textarea aria-label="外見・種別・詳細" value={editingNote.details} onChange={(event) => updateNote(editingNote.id, { details: event.target.value })} /></label>
              <label>口調または雰囲気<Textarea aria-label="口調または雰囲気" value={editingNote.speechOrAtmosphere} onChange={(event) => updateNote(editingNote.id, { speechOrAtmosphere: event.target.value })} /></label>
              <label>関係性または施設<Textarea aria-label="関係性または施設" value={editingNote.relationsOrFacilities} onChange={(event) => updateNote(editingNote.id, { relationsOrFacilities: event.target.value })} /></label>
              <label>現在状態または禁則<Textarea aria-label="現在状態または禁則" value={editingNote.stateOrRules} onChange={(event) => updateNote(editingNote.id, { stateOrRules: event.target.value })} /></label>
            </div>
          </MyrialeDialogContent>
        </MyrialeDialogRoot>
      )}
    </section>
  );
}
