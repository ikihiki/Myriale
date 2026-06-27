import { useState } from 'react';
import { AppChrome } from './shared/AppChrome';
import { SessionTurn } from './shared/SessionTurn';

type NoteKind = 'person' | 'location';
type Certainty = 'Canon' | '未確定' | '噂';
type IssueAction = 'updateNote' | 'reviseOutput' | 'keepRumor' | null;

type LoreNote = {
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

const initialNotes: LoreNote[] = [
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

const account = { name: '霧野しおり', email: 'reader@myriale.example', initials: '霧野', role: 'プレイヤー' };

export function SessionNotesLorebookWireframe() {
  const [notes, setNotes] = useState<LoreNote[]>(initialNotes);
  const [selectedId, setSelectedId] = useState(initialNotes[0].id);
  const [notice, setNotice] = useState('Lorebookは自由メモではなく、Canon/未確定/噂を分けた構造化ノートとしてAIが参照します。');
  const [search, setSearch] = useState('');
  const [referenced, setReferenced] = useState<string[]>(['person-minato', 'location-library']);
  const [contextStack, setContextStack] = useState('1) Scenario Lore\n2) Lorebook Canon: 月読ミナト / 水没した地下図書館\n3) Session State\n4) ChapterSummary\n5) Recent Turns: 直近6件');
  const [chapterSummary, setChapterSummary] = useState('Chapter 1: 水没した地下図書館で銀の鍵を得て、月読ミナトから名前の危険を聞いた。');
  const [issue, setIssue] = useState('Canon「王都地下」と新出情報「海底都市」が矛盾する可能性があります。');
  const [issueAction, setIssueAction] = useState<IssueAction>(null);

  const selected = notes.find((note) => note.id === selectedId) ?? notes[0];
  const filteredNotes = notes.filter((note) => `${note.name} ${note.aliases}`.includes(search));
  const canonNotes = notes.filter((note) => note.certainty === 'Canon');

  const updateSelected = (patch: Partial<LoreNote>) => {
    setNotes((current) => current.map((note) => note.id === selected.id ? { ...note, ...patch } : note));
  };

  const createPerson = () => {
    const note: LoreNote = {
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
    };
    setNotes((current) => [...current, note]);
    setSelectedId(note.id);
    setNotice('人物ノートを作成しました。構造化項目と初出TurnIdを保存し、検索・参照できます。');
  };

  const createLocation = () => {
    const note: LoreNote = {
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
    setNotice('場所ノートを作成しました。以後の描写で位置関係・雰囲気・禁則を参照できます。');
  };

  const proposeNote = () => {
    createLocation();
    setNotice('AIが新規地点を検出し、ノート作成候補として提示しました。自動確定はせず、採用/編集/破棄を選べます。');
  };

  const markCertainty = (certainty: Certainty) => {
    updateSelected({ certainty });
    setNotice(`${selected.name}の確定度を「${certainty}」にしました。Canonは強く参照され、噂は可能性として扱われます。`);
  };

  const generateContext = () => {
    setReferenced(canonNotes.map((note) => note.id));
    setContextStack(`1) Scenario Lore\n2) Lorebook Canon: ${canonNotes.map((note) => note.name).join(' / ')}\n3) Session State: 現在地・所持品・関係性\n4) ChapterSummary: ${chapterSummary}\n5) Recent Turns: 直近6件`);
    setNotice('次ターンContextをLorebook Canon、Session State、ChapterSummary、Recent Turnsで再構築しました。');
  };

  const generateChapterSummary = () => {
    setChapterSummary('Chapter 2: 螺旋階段から地下天文台へ移動。銀の鍵は閉じた星座と関係し、ミナトは名前の危険を避けるよう促した。');
    setNotice('章境界を場所移動として扱い、ChapterSummaryを生成・更新しました。次の生成で優先参照されます。');
  };

  const checkConsistency = () => {
    setIssue('矛盾候補: 水没した地下図書館の所在地 Canon「王都地下」と、新出発言「海底都市」が競合しています。');
    setNotice('整合性チェックで矛盾候補を検出しました。修正の確定はユーザーが行います。');
  };

  const resolveIssue = (action: Exclude<IssueAction, null>) => {
    setIssueAction(action);
    const messages: Record<Exclude<IssueAction, null>, string> = {
      updateNote: 'ノートを更新する判断を記録しました。Canon変更はユーザー確定として扱います。',
      reviseOutput: 'AI出力を修正する判断を記録しました。Canonは変更しません。',
      keepRumor: '今回の情報を噂として未確定保持しました。AIには断定させません。',
    };
    setNotice(messages[action]);
  };

  return (
    <AppChrome
      section="sessions"
      breadcrumbs={[{ label: 'Myriale', to: 'scenarioRegister' }, { label: 'セッション', to: 'startSession' }, { label: 'Lorebook' }]}
      account={account}
    >
      <div className="scenario-forge scenario-forge-wizard session-lorebook-wireframe">
        <aside className="contract-spine" aria-label="Lorebook操作">
          <strong>Lorebook</strong>
          <p className="toc-help">人物・場所をCanon辞書として整備し、長編の参照と圧縮Contextに使います。</p>
          <div className="wizard-step-list" role="list" aria-label="Lorebookアクション">
            <button className="spine-row spine-step" onClick={createPerson} aria-label="人物ノートを新規作成"><span>人物を作成</span><small>プロフィール構造化</small></button>
            <button className="spine-row spine-step" onClick={createLocation} aria-label="場所ノートを新規作成"><span>場所を作成</span><small>地理と雰囲気</small></button>
            <button className="spine-row spine-step" onClick={proposeNote} aria-label="AIに追加候補を提案させる"><span>AI候補提案</span><small>採用前の候補</small></button>
            <button className="spine-row spine-step" onClick={generateContext} aria-label="次ターンContextを再構築"><span>Context再構築</span><small>Canon + Summary</small></button>
            <button className="spine-row spine-step" onClick={checkConsistency} aria-label="整合性チェック"><span>整合性チェック</span><small>矛盾候補を提示</small></button>
          </div>
          <div className="scenario-id"><span>Canon Notes</span><b data-testid="canon-count">{canonNotes.length}件</b></div>
        </aside>

        <main className="forge-paper wizard-paper program-driven-main" aria-label="Lorebookノート管理">
          <p className="kicker">Session notes / Structured Lorebook</p>
          <div className="notice" role="status" data-testid="lorebook-notice">{notice}</div>

          <section className="lorebook-reference-turn" aria-label="Lorebook参照つきターン">
            <SessionTurn
              ariaLabel="Lorebook参照ターン"
              lead={{ tone: 'player', tag: 'YOU', text: 'ミナトに銀の鍵と閉じた星座の関係を尋ねる' }}
              narrative="ミナトはいつもの静かな敬語で答える。『その鍵は出口だけでなく、あなたが忘れた過去も開きます』。AIはCanonの口調・関係性・場所ルールを優先して描写した。"
              narrativeTag="AI"
              narrativeTestId="lorebook-turn-narrative"
            />
            <div className="referenced-notes" aria-label="このターンで参照されたノート" data-testid="referenced-notes">
              {referenced.map((id) => {
                const note = notes.find((item) => item.id === id);
                return note ? <button key={id} onClick={() => setSelectedId(id)}>{note.name}</button> : null;
              })}
            </div>
          </section>

          <section className="lorebook-layout" aria-label="ノート一覧と編集">
            <div className="lorebook-list" aria-label="ノート一覧">
              <label>ノート検索<input aria-label="ノート検索" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="人物・場所名で検索" /></label>
              {filteredNotes.map((note) => (
                <button key={note.id} className={`note-notification ${selected.id === note.id ? 'active' : ''}`} onClick={() => setSelectedId(note.id)} aria-label={`${note.name}を開く`}>
                  <span>{note.kind === 'person' ? '人物' : '場所'} / {note.certainty}</span>
                  <strong>{note.name}</strong>
                  <small>{note.aliases} · {note.firstTurn}</small>
                </button>
              ))}
            </div>

            <article className="lorebook-editor" aria-label="ノート編集" data-testid="note-editor">
              <header><span>{selected.kind === 'person' ? '人物ノート' : '場所ノート'}</span><h2>{selected.name}</h2><p>{selected.firstTurn} 初出 / 確定度: <b>{selected.certainty}</b></p></header>
              <div className="lorebook-fields">
                <label>表示名<input aria-label="表示名" value={selected.name} onChange={(event) => updateSelected({ name: event.target.value })} /></label>
                <label>別名<input aria-label="別名" value={selected.aliases} onChange={(event) => updateSelected({ aliases: event.target.value })} /></label>
                <label>外見・種別・詳細<textarea aria-label="外見・種別・詳細" value={selected.details} onChange={(event) => updateSelected({ details: event.target.value })} /></label>
                <label>口調または雰囲気<textarea aria-label="口調または雰囲気" value={selected.speechOrAtmosphere} onChange={(event) => updateSelected({ speechOrAtmosphere: event.target.value })} /></label>
                <label>関係性または施設<textarea aria-label="関係性または施設" value={selected.relationsOrFacilities} onChange={(event) => updateSelected({ relationsOrFacilities: event.target.value })} /></label>
                <label>現在状態または禁則<textarea aria-label="現在状態または禁則" value={selected.stateOrRules} onChange={(event) => updateSelected({ stateOrRules: event.target.value })} /></label>
              </div>
              <div className="button-row"><button className="primary" onClick={() => markCertainty('Canon')}>Canonにする</button><button onClick={() => markCertainty('未確定')}>未確定にする</button><button onClick={() => markCertainty('噂')}>噂にする</button></div>
            </article>
          </section>
        </main>

        <aside className="ai-bookmark wizard-summary" aria-label="Lorebook Context">
          <h2>Context</h2>
          <article><h3>Context Stack</h3><pre className="context-stack" data-testid="context-stack">{contextStack}</pre></article>
          <article><h3>ChapterSummary</h3><p data-testid="chapter-summary">{chapterSummary}</p><button onClick={generateChapterSummary}>章要約を生成</button></article>
          <article><h3>矛盾チェック</h3><p data-testid="consistency-issue">{issue}</p><div className="button-row exception-actions"><button onClick={() => resolveIssue('updateNote')}>ノートを更新</button><button onClick={() => resolveIssue('reviseOutput')}>AI出力を修正</button><button onClick={() => resolveIssue('keepRumor')}>噂として保持</button></div><p data-testid="issue-action">判断: {issueAction ?? '未選択'}</p></article>
        </aside>
      </div>
    </AppChrome>
  );
}
