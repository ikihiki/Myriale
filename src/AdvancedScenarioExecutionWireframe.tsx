import { useState } from 'react';
import { AppChrome, type Crumb } from './shared/AppChrome';

type Panel = 'cast' | 'locations' | 'beats' | 'secrets' | 'events' | 'debug' | 'test';
type DialogKind = 'cast' | 'location' | 'beat' | 'secret' | 'event' | null;
type Correction = 'none' | 'reroute' | 'clue' | 'forced';

type Cast = { name: string; role: string; rule: string };
type Location = { name: string; rule: string };
type Beat = { chapter: string; beat: string; entry: string; exit: string; forbidden: string };
type Secret = { title: string; hiddenBrief: string; revealCondition: string };
type ForcedEvent = { title: string; trigger: string; body: string };

const panels: Array<{ id: Panel; label: string; help: string }> = [
  { id: 'cast', label: 'Cast候補', help: '複数の人物候補をテーブル管理' },
  { id: 'locations', label: 'Location候補', help: '場所候補とアクセス条件を一覧管理' },
  { id: 'beats', label: 'Chapter / Beat', help: '進行単位と出口条件を複数登録' },
  { id: 'secrets', label: 'HiddenBrief', help: '非公開情報と公開条件を項目別に管理' },
  { id: 'events', label: '強制イベント', help: '条件付きイベントを複数登録' },
  { id: 'debug', label: '進行デバッグ', help: '現在地・未達条件・参照情報' },
  { id: 'test', label: 'テスト実行', help: '任意ビートから検証' },
];

const account = { name: '霧野しおり', email: 'author@myriale.example', initials: '霧野', role: 'シナリオ作者' };

function FieldDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="wire-dialog-backdrop" role="presentation">
      <section className="wire-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <header className="wire-dialog-head">
          <h2>{title}</h2>
          <button type="button" aria-label="ダイアログを閉じる" onClick={onClose}>×</button>
        </header>
        {children}
      </section>
    </div>
  );
}

export function AdvancedScenarioExecutionWireframe() {
  const [panel, setPanel] = useState<Panel>('cast');
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [casts, setCasts] = useState<Cast[]>([
    { name: '月読ミナト', role: '嘘をつく案内人 / 真相を知る唯一のNPC', rule: '登場条件: Chapter 1で鐘楼に入った後。新規NPC生成は例外扱い。' },
  ]);
  const [locations, setLocations] = useState<Location[]>([
    { name: '沈黙の鐘楼', rule: '危険度: 高 / 関連人物: 月読ミナト / アクセス条件: 星図鍵を入手' },
  ]);
  const [beats, setBeats] = useState<Beat[]>([
    {
      chapter: 'Chapter 2: 星図鍵の欠片',
      beat: 'Beat 2-3: 鐘楼で欠片の由来を聞く',
      entry: '星図鍵を持っている / ミナトが同行している',
      exit: '欠片の由来を聞く / 次の目的地「地下天文台」をCanonへ追加',
      forbidden: '黒幕がミナト本人であることを明示しない',
    },
  ]);
  const [secrets, setSecrets] = useState<Secret[]>([
    {
      title: 'ミナトの正体',
      hiddenBrief: 'ミナトは黒幕の器。鐘楼の鐘が三度鳴るまで本人も自覚していない。',
      revealCondition: 'Chapter 4到達、かつ信頼値70以上で明示可能。それまでは示唆のみ。',
    },
  ]);
  const [events, setEvents] = useState<ForcedEvent[]>([
    { title: '鐘が三度鳴る', trigger: 'Chapter 4到達、星図鍵が揃う', body: '鐘楼の鐘が三度鳴り、秘匿された記憶が戻る。' },
  ]);

  const [castName, setCastName] = useState('灯守アキラ');
  const [castRole, setCastRole] = useState('灯台の記録係 / 失われた航路を知る');
  const [castRule, setCastRule] = useState('登場条件: 地下天文台の封印を調べた後。候補外NPCは提案止まり。');
  const [locationName, setLocationName] = useState('地下天文台');
  const [locationRule, setLocationRule] = useState('危険度: 中 / 関連人物: 灯守アキラ / アクセス条件: 星図鍵の欠片を2つ入手');
  const [chapter, setChapter] = useState('Chapter 3: 地下天文台');
  const [beat, setBeat] = useState('Beat 3-1: 星図盤を起動する');
  const [entry, setEntry] = useState('星図鍵の欠片を2つ持っている');
  const [exit, setExit] = useState('星図盤の起動に成功し、地下水路への入口をCanonへ追加');
  const [forbidden, setForbidden] = useState('黒幕の名前をまだ出さない');
  const [secretTitle, setSecretTitle] = useState('鐘楼の主の正体');
  const [hiddenBrief, setHiddenBrief] = useState('鐘楼の主は主人公の未来の姿。');
  const [revealCondition, setRevealCondition] = useState('信頼値80以上、かつChapter 5到達');
  const [eventTitle, setEventTitle] = useState('地下天文台の崩落');
  const [eventTrigger, setEventTrigger] = useState('星図盤の起動に失敗、または3ターン経過');
  const [eventBody, setEventBody] = useState('天井の星図が落下し、強制的に地下水路へ移動する。');

  const [correction, setCorrection] = useState<Correction>('none');
  const [testStart, setTestStart] = useState('Chapter 2 / Beat 2-3');
  const [notice, setNotice] = useState('複数登録できる設計項目を、テーブル一覧と追加ダイアログで管理します。');
  const [sessionState, setSessionState] = useState('現在: Chapter 2 / Beat 2-3。未達条件: 欠片の由来を聞く。');
  const [debugRefs, setDebugRefs] = useState('参照中: Canon（星図鍵を入手済み） / HiddenBrief（ミナトの秘密） / Beat禁止事項');

  const activeIndex = panels.findIndex((item) => item.id === panel);
  const activePanel = panels[activeIndex];
  const currentBeat = beats[beats.length - 1];
  const currentSecret = secrets[secrets.length - 1];

  const saveCast = () => {
    setCasts((current) => [...current, { name: castName, role: castRole, rule: castRule }]);
    setNotice(`Cast「${castName}」を候補プールに登録しました。AIは原則として候補からNPCを選びます。`);
    setDialog(null);
  };

  const saveLocation = () => {
    setLocations((current) => [...current, { name: locationName, rule: locationRule }]);
    setNotice(`Location「${locationName}」を候補プールに登録しました。未定義場所は仮扱いまたは生成提案になります。`);
    setDialog(null);
  };

  const lockBeat = () => {
    const next = { chapter, beat, entry, exit, forbidden };
    setBeats((current) => [...current, next]);
    setSessionState(`現在: ${chapter} / ${beat}。未達条件: ${exit}。`);
    setNotice('Chapter / Beatを追加しました。Exit条件を満たすまでAIは次のビートへ進みません。');
    setDialog(null);
  };

  const saveSecret = () => {
    setSecrets((current) => [...current, { title: secretTitle, hiddenBrief, revealCondition }]);
    setNotice('HiddenBriefと公開条件を保存しました。条件未達の秘密は示唆止まりになります。');
    setDebugRefs('参照中: HiddenBrief（公開条件つき） / Canon / 現在Beatの禁止事項');
    setDialog(null);
  };

  const saveEvent = () => {
    setEvents((current) => [...current, { title: eventTitle, trigger: eventTrigger, body: eventBody }]);
    setNotice(`条件付き強制イベント「${eventTitle}」を登録しました。条件達成時にAIが必ず発火させます。`);
    setDialog(null);
  };

  const runCorrection = (kind: Correction) => {
    setCorrection(kind);
    const messages: Record<Correction, string> = {
      none: '補正なし。現在のBeat条件を監視しています。',
      reroute: '誘導イベントを生成して、プレイヤーを鐘楼へ戻します。',
      clue: 'NPCの助言で不足した手がかりを補完します。既存Castを優先使用します。',
      forced: `条件達成を検知したため、強制イベント「${events[events.length - 1]?.title ?? '未登録イベント'}」を必ず発火させます。`,
    };
    setNotice(messages[kind]);
  };

  const startTest = () => {
    setSessionState(`テスト開始地点: ${testStart}。Entry条件は満たした扱いで検証中。`);
    setNotice('指定したビートからテストセッションを開始しました。条件は満たした扱いにできます。');
  };

  const refreshDebug = () => {
    setDebugRefs(`AI参照状況: HiddenBrief ${secrets.length}件 / Canon: 星図鍵 / Beat禁止事項: ${currentBeat?.forbidden ?? '未設定'}`);
    setNotice('作者向けデバッグ情報を更新しました。プレイヤー向けUIでは表示されません。');
  };

  const crumbs: Crumb[] = [
    { label: 'Myriale', to: 'scenarioRegister' },
    { label: 'ライブラリ', to: 'scenarioRegister' },
    { label: '高度なシナリオ実行' },
  ];

  return (
    <AppChrome section="library" breadcrumbs={crumbs} account={account}>
      <div className="scenario-forge scenario-forge-wizard advanced-scenario-wireframe">
        <aside className="contract-spine" aria-label="高度なシナリオ実行の設計項目">
          <strong>Scenario Director</strong>
          <p className="toc-help">複数の候補・条件・Canon・HiddenBriefをテーブルで管理し、追加はダイアログで行います。</p>
          <div className="wizard-step-list" role="list" aria-label="設計項目">
            {panels.map((item, index) => (
              <button
                key={item.id}
                className={`spine-row spine-step ${panel === item.id ? 'active' : ''}`}
                onClick={() => setPanel(item.id)}
                aria-label={`${item.label}へ`}
                aria-current={panel === item.id ? 'step' : undefined}
              >
                <span>{String(index + 1).padStart(2, '0')} / {item.label}</span>
                <small>{item.help}</small>
              </button>
            ))}
          </div>
          <div className="scenario-id"><span>Registered</span><b>{casts.length + locations.length + beats.length + secrets.length + events.length} items</b></div>
        </aside>

        <main className="forge-paper wizard-paper program-driven-main" aria-label="高度なシナリオ実行エディタ">
          <p className="kicker">Advanced scenario execution / Controlled AI</p>
          <div className="wizard-progress" aria-label="設計進捗">
            <span>{String(activeIndex + 1).padStart(2, '0')}</span>
            <strong>{activePanel.label}</strong>
            <small>{activePanel.help}</small>
          </div>
          <div className="notice" role="status" data-testid="advanced-notice">{notice}</div>

          {panel === 'cast' && (
            <section className="wizard-panel" aria-label="Cast候補">
              <p>US-AS01: 人物候補をテーブルに複数登録し、役割・秘密・登場条件をダイアログで追加します。</p>
              <button className="primary" onClick={() => setDialog('cast')}>新規Cast</button>
              <table className="wire-table" aria-label="Cast候補テーブル">
                <thead><tr><th>人物名</th><th>役割・秘密</th><th>登場条件・生成ルール</th></tr></thead>
                <tbody>{casts.map((item) => <tr key={item.name}><td>{item.name}</td><td>{item.role}</td><td>{item.rule}</td></tr>)}</tbody>
              </table>
            </section>
          )}

          {panel === 'locations' && (
            <section className="wizard-panel" aria-label="Location候補">
              <p>US-AS02: 場所候補を一覧化し、雰囲気・危険度・関連人物・アクセス条件を行単位で管理します。</p>
              <button className="primary" onClick={() => setDialog('location')}>新規Location</button>
              <table className="wire-table" aria-label="Location候補テーブル">
                <thead><tr><th>場所名</th><th>条件</th></tr></thead>
                <tbody>{locations.map((item) => <tr key={item.name}><td>{item.name}</td><td>{item.rule}</td></tr>)}</tbody>
              </table>
            </section>
          )}

          {panel === 'beats' && (
            <section className="wizard-panel" aria-label="ChapterとBeat">
              <p>US-AS03/04: 章・ビート・Entry/Exit条件・禁止事項を複数行で管理し、重要展開のスキップや早すぎる真相開示を防ぎます。</p>
              <button className="primary" onClick={() => setDialog('beat')}>新規Beat</button>
              <table className="wire-table" aria-label="Beatテーブル">
                <thead><tr><th>Chapter</th><th>Beat</th><th>Entry / Exit</th><th>禁止事項</th></tr></thead>
                <tbody>{beats.map((item) => <tr key={`${item.chapter}-${item.beat}`}><td>{item.chapter}</td><td>{item.beat}</td><td>Entry: {item.entry}<br />Exit: {item.exit}</td><td>{item.forbidden}</td></tr>)}</tbody>
              </table>
            </section>
          )}

          {panel === 'secrets' && (
            <section className="wizard-panel" aria-label="HiddenBrief">
              <p>US-AS05/06: HiddenBriefを秘密ごとに複数登録し、それぞれの公開条件をテーブルで確認します。</p>
              <button className="primary" onClick={() => setDialog('secret')}>新規HiddenBrief</button>
              <table className="wire-table" aria-label="HiddenBriefテーブル">
                <thead><tr><th>秘密</th><th>HiddenBrief</th><th>公開条件</th></tr></thead>
                <tbody>{secrets.map((item) => <tr key={item.title}><td>{item.title}</td><td>{item.hiddenBrief}</td><td>{item.revealCondition}</td></tr>)}</tbody>
              </table>
            </section>
          )}

          {panel === 'events' && (
            <section className="wizard-panel" aria-label="強制イベント">
              <p>US-AS10: 特定条件で必ず発生するイベントを複数登録し、山場を逃さないようにします。</p>
              <button className="primary" onClick={() => setDialog('event')}>新規強制イベント</button>
              <table className="wire-table" aria-label="強制イベントテーブル">
                <thead><tr><th>イベント名</th><th>トリガー条件</th><th>内容</th></tr></thead>
                <tbody>{events.map((item) => <tr key={item.title}><td>{item.title}</td><td>{item.trigger}</td><td>{item.body}</td></tr>)}</tbody>
              </table>
            </section>
          )}

          {panel === 'debug' && (
            <section className="wizard-panel" aria-label="進行デバッグ">
              <p>US-AS07/08/09/12: テーブル登録済みの候補を使って、脱線補正、手がかり補完、現在地、AI参照情報を作者だけが確認・操作できます。</p>
              <div className="program-controls" aria-label="補正操作">
                <div className="button-row">
                  <button onClick={() => runCorrection('reroute')}>誘導イベントを生成</button>
                  <button onClick={() => runCorrection('clue')}>補完イベントを生成</button>
                  <button className="primary" onClick={() => runCorrection('forced')}>条件付き強制イベントを発火</button>
                  <button onClick={refreshDebug}>参照情報を更新</button>
                </div>
                <p className="program-hint" data-testid="correction-state">補正状態: {correction}</p>
              </div>
              <p data-testid="debug-refs">{debugRefs}</p>
            </section>
          )}

          {panel === 'test' && (
            <section className="wizard-panel" aria-label="テスト実行">
              <p>US-AS11: 登録済みの任意Chapter / Beatを開始地点としてテストセッションを開始し、条件を満たした扱いにして検証します。</p>
              <label>テスト開始地点<input aria-label="テスト開始地点" value={testStart} onChange={(event) => setTestStart(event.target.value)} /></label>
              <div className="button-row"><button className="primary" onClick={startTest}>この地点からテスト開始</button></div>
            </section>
          )}
        </main>

        <aside className="ai-bookmark wizard-summary" aria-label="実行監督サマリー">
          <h2>Director State</h2>
          <article><h3>登録件数</h3><p data-testid="summary-counts">Cast {casts.length}件 / Location {locations.length}件 / Beat {beats.length}件 / Secret {secrets.length}件 / Event {events.length}件</p></article>
          <article><h3>候補プール</h3><p data-testid="summary-cast">Cast: {casts.map((item) => item.name).join('、')}</p><p data-testid="summary-location">Location: {locations.map((item) => item.name).join('、')}</p></article>
          <article><h3>進行制御</h3><p data-testid="summary-beat">{currentBeat?.chapter} / {currentBeat?.beat}</p><p>Exit: {currentBeat?.exit}</p></article>
          <article><h3>Secret Gate</h3><p data-testid="summary-secret">{currentSecret?.title}: {currentSecret?.hiddenBrief}</p><p>公開条件: {currentSecret?.revealCondition}</p></article>
          <article><h3>Debug</h3><p data-testid="session-state">{sessionState}</p><p>{debugRefs}</p></article>
        </aside>

        {dialog === 'cast' && (
          <FieldDialog title="Castを追加" onClose={() => setDialog(null)}>
            <label>人物名<input aria-label="人物名" value={castName} onChange={(event) => setCastName(event.target.value)} /></label>
            <label>役割・性格・秘密<textarea aria-label="人物の役割と秘密" value={castRole} onChange={(event) => setCastRole(event.target.value)} /></label>
            <label>登場条件・生成ルール<textarea aria-label="人物の登場条件" value={castRule} onChange={(event) => setCastRule(event.target.value)} /></label>
            <div className="button-row"><button onClick={() => setDialog(null)}>キャンセル</button><button className="primary" onClick={saveCast}>Castを登録</button></div>
          </FieldDialog>
        )}

        {dialog === 'location' && (
          <FieldDialog title="Locationを追加" onClose={() => setDialog(null)}>
            <label>場所名<input aria-label="場所名" value={locationName} onChange={(event) => setLocationName(event.target.value)} /></label>
            <label>場所の条件<textarea aria-label="場所の条件" value={locationRule} onChange={(event) => setLocationRule(event.target.value)} /></label>
            <div className="button-row"><button onClick={() => setDialog(null)}>キャンセル</button><button className="primary" onClick={saveLocation}>Locationを登録</button></div>
          </FieldDialog>
        )}

        {dialog === 'beat' && (
          <FieldDialog title="Beatを追加" onClose={() => setDialog(null)}>
            <label>Chapter<input aria-label="Chapter" value={chapter} onChange={(event) => setChapter(event.target.value)} /></label>
            <label>Beat<input aria-label="Beat" value={beat} onChange={(event) => setBeat(event.target.value)} /></label>
            <label>Entry条件<textarea aria-label="Entry条件" value={entry} onChange={(event) => setEntry(event.target.value)} /></label>
            <label>Exit条件<textarea aria-label="Exit条件" value={exit} onChange={(event) => setExit(event.target.value)} /></label>
            <label>このBeatの禁止事項<textarea aria-label="禁止事項" value={forbidden} onChange={(event) => setForbidden(event.target.value)} /></label>
            <div className="button-row"><button onClick={() => setDialog(null)}>キャンセル</button><button className="primary" onClick={lockBeat}>Beatを固定</button></div>
          </FieldDialog>
        )}

        {dialog === 'secret' && (
          <FieldDialog title="HiddenBriefを追加" onClose={() => setDialog(null)}>
            <label>秘密の名前<input aria-label="秘密の名前" value={secretTitle} onChange={(event) => setSecretTitle(event.target.value)} /></label>
            <label>HiddenBrief<textarea aria-label="HiddenBrief" value={hiddenBrief} onChange={(event) => setHiddenBrief(event.target.value)} /></label>
            <label>公開条件<textarea aria-label="公開条件" value={revealCondition} onChange={(event) => setRevealCondition(event.target.value)} /></label>
            <div className="button-row"><button onClick={() => setDialog(null)}>キャンセル</button><button className="primary" onClick={saveSecret}>非公開情報を保存</button></div>
          </FieldDialog>
        )}

        {dialog === 'event' && (
          <FieldDialog title="強制イベントを追加" onClose={() => setDialog(null)}>
            <label>イベント名<input aria-label="イベント名" value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} /></label>
            <label>トリガー条件<textarea aria-label="トリガー条件" value={eventTrigger} onChange={(event) => setEventTrigger(event.target.value)} /></label>
            <label>イベント内容<textarea aria-label="イベント内容" value={eventBody} onChange={(event) => setEventBody(event.target.value)} /></label>
            <div className="button-row"><button onClick={() => setDialog(null)}>キャンセル</button><button className="primary" onClick={saveEvent}>強制イベントを登録</button></div>
          </FieldDialog>
        )}
      </div>
    </AppChrome>
  );
}
