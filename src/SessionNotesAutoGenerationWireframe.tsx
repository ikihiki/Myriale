import { useState } from 'react';
import { AppChrome } from './shared/AppChrome';
import { SessionTurn } from './shared/SessionTurn';

type ProposalKind = 'new' | 'update' | 'conflict' | 'summary';
type ProposalStatus = 'pending' | 'applied' | 'rejected' | 'snoozed';
type ReviewAction = 'apply' | 'edit' | 'reject' | 'snooze' | 'rumor';

type Proposal = {
  id: string;
  kind: ProposalKind;
  note: string;
  field: string;
  before: string;
  after: string;
  turnId: string;
  importance: 'low' | 'medium' | 'high';
  status: ProposalStatus;
  summary: string;
};

const initialProposals: Proposal[] = [
  {
    id: 'N-104',
    kind: 'new',
    note: '濡れた外套の人物',
    field: '新規人物Note',
    before: '未登録',
    after: '銀の鍵を知る人物。名前を答える危険を警告する。',
    turnId: 'Turn 04',
    importance: 'high',
    status: 'pending',
    summary: '新しい人物を検出しました',
  },
  {
    id: 'U-219',
    kind: 'update',
    note: '銀の鍵',
    field: '用途',
    before: '用途不明',
    after: '閉じた星座を開く可能性がある',
    turnId: 'Turn 07',
    importance: 'medium',
    status: 'pending',
    summary: '既存ノートに用途の更新案があります',
  },
  {
    id: 'C-018',
    kind: 'conflict',
    note: '地下図書館の位置',
    field: '所在地 Canon',
    before: '王都地下にある（Canon）',
    after: '海底に沈んだ都市にあるという発言',
    turnId: 'Turn 09',
    importance: 'high',
    status: 'pending',
    summary: 'Canonへの上書き候補を検出しました',
  },
];

const kindLabel: Record<ProposalKind, string> = {
  new: '新規Note案',
  update: '更新差分',
  conflict: '矛盾検出',
  summary: '要約更新',
};

const account = { name: '霧野しおり', email: 'reader@myriale.example', initials: '霧野', role: 'プレイヤー' };

export function SessionNotesAutoGenerationWireframe() {
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
  const [selectedId, setSelectedId] = useState(initialProposals[0].id);
  const [notice, setNotice] = useState('Turn確定後にAIがノート候補を抽出し、Pendingとして通知しています。自動Canon確定はしません。');
  const [timing, setTiming] = useState('一定ターンごと');
  const [target, setTarget] = useState('重要度高のみ');
  const [autoPolicy, setAutoPolicy] = useState('rumorのみ自動追加');
  const [chapterSummary, setChapterSummary] = useState('水没した閲覧室で銀の鍵を得た。濡れた外套の人物は名前を答える危険を警告した。');
  const [stateSummary, setStateSummary] = useState('現在地: 螺旋階段 / 所持品: 銀の鍵 / 関係性: 外套の人物=警戒しつつ協力的');

  const pending = proposals.filter((item) => item.status === 'pending');
  const selected = proposals.find((item) => item.id === selectedId) ?? proposals[0];

  const setStatus = (id: string, status: ProposalStatus, message: string) => {
    setProposals((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    setNotice(message);
  };

  const review = (action: ReviewAction) => {
    if (action === 'apply') {
      setStatus(selected.id, 'applied', `「${selected.note}」の差分を採用しました。必要な項目だけCanonへ反映しました。`);
      return;
    }
    if (action === 'edit') {
      setStatus(selected.id, 'applied', `「${selected.note}」を一部採用しました。編集後の内容だけNoteへ反映します。`);
      return;
    }
    if (action === 'reject') {
      setStatus(selected.id, 'rejected', `「${selected.note}」の提案を却下しました。任意の却下理由を残せます。`);
      return;
    }
    if (action === 'snooze') {
      setStatus(selected.id, 'snoozed', `「${selected.note}」を保留しました。通知は未処理として残ります。`);
      return;
    }
    setStatus(selected.id, 'applied', `矛盾情報をCanon上書きせず「噂/誤認」として未確定で保持しました。`);
  };

  const extractFromTurn = () => {
    const next: Proposal = {
      id: `N-${300 + proposals.length}`,
      kind: 'new',
      note: '螺旋階段',
      field: '新規場所Note',
      before: '未登録',
      after: '水面下へ続くが、足元は乾いている不自然な階段。',
      turnId: `Turn ${10 + proposals.length}`,
      importance: 'medium',
      status: 'pending',
      summary: '新しい場所を検出しました',
    };
    setProposals((current) => [...current, next]);
    setSelectedId(next.id);
    setNotice('Turn確定後の非同期抽出で、新規Note案をPending生成しました。出典TurnIdを紐づけています。');
  };

  const updateSummary = () => {
    setChapterSummary('章要約を更新: 銀の鍵、外套の人物、螺旋階段、閉じた星座が主要な文脈として圧縮されました。');
    setStateSummary('次ターンContext: Scenario Lore + Lorebook Canon + State + ChapterSummary + 直近Nターン。');
    setNotice('ノート更新と同時に、トークン削減用の章要約/状態要約を更新しました。必要なら編集できます。');
  };

  return (
    <AppChrome
      section="sessions"
      breadcrumbs={[{ label: 'Myriale', to: 'scenarioRegister' }, { label: 'セッション', to: 'startSession' }, { label: 'ノート自動生成' }]}
      account={account}
    >
      <div className="scenario-forge scenario-forge-wizard session-notes-auto-wireframe">
        <aside className="contract-spine" aria-label="ノート更新通知">
          <strong>Note Updates</strong>
          <p className="toc-help">AIの抽出結果はCanonへ自動確定せず、Pending通知としてレビューします。</p>
          <button className="spine-row spine-step active" onClick={extractFromTurn} aria-label="Turnからノート候補を抽出">
            <span>Turn確定後に抽出</span><small>ExtractEntitiesFromTurn</small>
          </button>
          <button className="spine-row spine-step" onClick={updateSummary} aria-label="要約を更新">
            <span>要約を更新</span><small>Context圧縮</small>
          </button>
          <div className="scenario-id"><span>通知バッジ</span><b data-testid="notification-badge">{pending.length}件</b></div>
        </aside>

        <main className="forge-paper wizard-paper program-driven-main" aria-label="セッションとノート差分レビュー">
          <p className="kicker">Session notes / AI semi-automatic generation</p>
          <div className="notice" role="status" data-testid="notes-notice">{notice}</div>

          <section className="dialogue-log program-log notes-turn-log" aria-label="セッションターン" data-testid="turn-log">
            <SessionTurn
              ariaLabel="Turn 04"
              lead={{ tone: 'player', tag: 'YOU', text: '書架の奥にいる人物に声をかける', testId: 'turn-04-input' }}
              narrative="濡れた外套の人物が姿を見せる。「鍵を持つ者がまた来たか」と言い、あなたの名前ではなく、あなたが失ったはずの記憶を尋ねてくる。"
              narrativeTag="AI"
              narrativeTestId="turn-04-narrative"
            />
            <SessionTurn
              ariaLabel="Turn 07"
              lead={{ tone: 'player', tag: 'YOU', text: '銀の鍵で何を開けられるのか聞く' }}
              narrative="「閉じた星座だ」と人物は答える。開けば出口も過去も見えるが、どちらを選ぶかで失うものが違う。"
              narrativeTag="AI"
            />
          </section>

          <section className="notes-review-layout" aria-label="通知一覧と差分ビュー">
            <div className="notes-notification-list" aria-label="通知一覧">
              <h2>通知一覧</h2>
              {proposals.map((item) => (
                <button
                  key={item.id}
                  className={`note-notification ${selected.id === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                  aria-label={`${item.note}の通知を開く`}
                >
                  <span>{kindLabel[item.kind]} / {item.importance}</span>
                  <strong>{item.note}</strong>
                  <small>{item.summary} · {item.turnId} · {item.status}</small>
                </button>
              ))}
            </div>

            <article className="note-diff-view" aria-label="ノート差分ビュー" data-testid="diff-view">
              <header><span>{kindLabel[selected.kind]}</span><h2>{selected.note}</h2><p>{selected.turnId} を根拠にしたPending差分です。</p></header>
              <table className="wire-table" aria-label="ノート差分テーブル">
                <thead><tr><th>Field</th><th>Before</th><th>After</th></tr></thead>
                <tbody><tr><td>{selected.field}</td><td data-testid="diff-before">{selected.before}</td><td data-testid="diff-after">{selected.after}</td></tr></tbody>
              </table>
              <div className="button-row">
                <button className="primary" onClick={() => review('apply')}>採用</button>
                <button onClick={() => review('edit')}>一部採用</button>
                <button onClick={() => review('reject')}>却下</button>
                <button onClick={() => review('snooze')}>保留</button>
                {selected.kind === 'conflict' && <button onClick={() => review('rumor')}>噂/誤認として保持</button>}
              </div>
            </article>
          </section>
        </main>

        <aside className="ai-bookmark wizard-summary" aria-label="ノート自動生成設定">
          <h2>Lorebook Inbox</h2>
          <article><h3>通知設定</h3><label>通知タイミング<select aria-label="通知タイミング" value={timing} onChange={(event) => setTiming(event.target.value)}><option>毎ターン</option><option>一定ターンごと</option><option>章の終わり</option><option>手動でまとめて確認</option></select></label><label>通知対象<select aria-label="通知対象" value={target} onChange={(event) => setTarget(event.target.value)}><option>人物のみ</option><option>場所のみ</option><option>重要度高のみ</option><option>すべて</option></select></label><label>自動採用ポリシー<select aria-label="自動採用ポリシー" value={autoPolicy} onChange={(event) => setAutoPolicy(event.target.value)}><option>rumorのみ自動追加</option><option>Canonは必ず確認</option><option>自動採用しない</option></select></label></article>
          <article><h3>Pending / Canon</h3><p data-testid="pending-count">Pending {pending.length}件</p><p>Canon上書き: 必ず確認</p></article>
          <article><h3>ChapterSummary</h3><p data-testid="chapter-summary">{chapterSummary}</p></article>
          <article><h3>State Summary</h3><p data-testid="state-summary">{stateSummary}</p></article>
        </aside>
      </div>
    </AppChrome>
  );
}
