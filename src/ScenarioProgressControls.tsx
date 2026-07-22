import { useState } from 'react';
import { Button, Input, Textarea } from './components/ui';
import { MyrialeDialogContent, MyrialeDialogRoot } from './ui/MyrialeRadix';

type Panel = 'cast' | 'locations' | 'beats' | 'secrets' | 'events' | 'debug' | 'test';
type DialogKind = 'cast' | 'location' | 'beat' | 'secret' | 'event' | null;
type Correction = 'none' | 'reroute' | 'clue' | 'forced';

type Cast = { name: string; role: string; rule: string };
type Location = { name: string; rule: string };
type Beat = { chapter: string; beat: string; entry: string; exit: string; forbidden: string };
type Secret = { title: string; hiddenBrief: string; revealCondition: string };
type ForcedEvent = { title: string; trigger: string; body: string };

const initialAdvancedNotice = 'ready';

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
    <MyrialeDialogRoot open onOpenChange={(open) => { if (!open) onClose(); }}>
      <MyrialeDialogContent title={title} className="wire-dialog" portal={false}>
        {children}
      </MyrialeDialogContent>
    </MyrialeDialogRoot>
  );
}

export type ScenarioProgressControlsProps = {
  /** The US-AS panel to show inside the parent registration/edit wizard. */
  initialPanel?: Panel;
};

export function ScenarioProgressControls({ initialPanel = 'cast' }: ScenarioProgressControlsProps = {}) {
  const [panel, setPanel] = useState<Panel>(initialPanel);
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
  const [notice, setNotice] = useState(initialAdvancedNotice);
  const [sessionState, setSessionState] = useState('現在: Chapter 2 / Beat 2-3。未達条件: 欠片の由来を聞く。');
  const [debugRefs, setDebugRefs] = useState('参照中: Canon（星図鍵を入手済み） / HiddenBrief（ミナトの秘密） / Beat禁止事項');

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


  const panelClassName = 'grid gap-3';
  const controlButtonClass = 'rounded-full bg-myr-plum px-4 py-2.5 font-extrabold text-myr-paper';
  const primaryControlButtonClass = `${controlButtonClass} !bg-myr-gold !text-[#17151f] !font-black`;
  const noticeNode = notice !== initialAdvancedNotice ? (
    <div className="my-[18px] rounded-2xl bg-[rgba(18,16,25,.86)] px-4 py-3 text-myr-cream" role="status" data-testid="advanced-notice">{notice}</div>
  ) : null;

  const panelContent = (
    <>
      {panel === 'cast' && (
        <section className={panelClassName} aria-label="Cast候補">
          <Button className="primary" onClick={() => setDialog('cast')}>新規Cast</Button>
          <table className="wire-table" aria-label="Cast候補テーブル">
            <thead><tr><th>人物名</th><th>役割・秘密</th><th>登場条件・生成ルール</th></tr></thead>
            <tbody>{casts.map((item) => <tr key={item.name}><td>{item.name}</td><td>{item.role}</td><td>{item.rule}</td></tr>)}</tbody>
          </table>
        </section>
      )}

      {panel === 'locations' && (
        <section className={panelClassName} aria-label="Location候補">
          <Button className="primary" onClick={() => setDialog('location')}>新規Location</Button>
          <table className="wire-table" aria-label="Location候補テーブル">
            <thead><tr><th>場所名</th><th>条件</th></tr></thead>
            <tbody>{locations.map((item) => <tr key={item.name}><td>{item.name}</td><td>{item.rule}</td></tr>)}</tbody>
          </table>
        </section>
      )}

      {panel === 'beats' && (
        <section className={panelClassName} aria-label="ChapterとBeat">
          <Button className="primary" onClick={() => setDialog('beat')}>新規Beat</Button>
          <table className="wire-table" aria-label="Beatテーブル">
            <thead><tr><th>Chapter</th><th>Beat</th><th>Entry / Exit</th><th>禁止事項</th></tr></thead>
            <tbody>{beats.map((item) => <tr key={`${item.chapter}-${item.beat}`}><td>{item.chapter}</td><td>{item.beat}</td><td>Entry: {item.entry}<br />Exit: {item.exit}</td><td>{item.forbidden}</td></tr>)}</tbody>
          </table>
        </section>
      )}

      {panel === 'secrets' && (
        <section className={panelClassName} aria-label="HiddenBrief">
          <Button className="primary" onClick={() => setDialog('secret')}>新規HiddenBrief</Button>
          <table className="wire-table" aria-label="HiddenBriefテーブル">
            <thead><tr><th>秘密</th><th>HiddenBrief</th><th>公開条件</th></tr></thead>
            <tbody>{secrets.map((item) => <tr key={item.title}><td>{item.title}</td><td>{item.hiddenBrief}</td><td>{item.revealCondition}</td></tr>)}</tbody>
          </table>
        </section>
      )}

      {panel === 'events' && (
        <section className={panelClassName} aria-label="強制イベント">
          <Button className="primary" onClick={() => setDialog('event')}>新規強制イベント</Button>
          <table className="wire-table" aria-label="強制イベントテーブル">
            <thead><tr><th>イベント名</th><th>トリガー条件</th><th>内容</th></tr></thead>
            <tbody>{events.map((item) => <tr key={item.title}><td>{item.title}</td><td>{item.trigger}</td><td>{item.body}</td></tr>)}</tbody>
          </table>
        </section>
      )}

      {panel === 'debug' && (
        <section className={panelClassName} aria-label="進行デバッグ">
          <div className="grid gap-2.5 rounded-2xl border border-myr-ink/14 bg-[rgba(250,249,255,.7)] p-3.5" aria-label="補正操作">
            <div className="button-row">
              <Button className={controlButtonClass} onClick={() => runCorrection('reroute')}>誘導イベントを生成</Button>
              <Button className={controlButtonClass} onClick={() => runCorrection('clue')}>補完イベントを生成</Button>
              <Button className={primaryControlButtonClass} onClick={() => runCorrection('forced')}>条件付き強制イベントを発火</Button>
              <Button className={controlButtonClass} onClick={refreshDebug}>参照情報を更新</Button>
            </div>
            <p className="m-0 text-xs text-myr-ink-subtle" data-testid="correction-state">補正状態: {correction}</p>
          </div>
          <p data-testid="debug-refs">{debugRefs}</p>
        </section>
      )}

      {panel === 'test' && (
        <section className={panelClassName} aria-label="テスト実行">
          <label>テスト開始地点<Input aria-label="テスト開始地点" value={testStart} onChange={(event) => setTestStart(event.target.value)} /></label>
          <div className="button-row"><Button className="primary" onClick={startTest}>この地点からテスト開始</Button></div>
        </section>
      )}
    </>
  );

  const dialogContent = (
    <>
      {dialog === 'cast' && (
        <FieldDialog title="Castを追加" onClose={() => setDialog(null)}>
          <label>人物名<Input aria-label="人物名" value={castName} onChange={(event) => setCastName(event.target.value)} /></label>
          <label>役割・性格・秘密<Textarea aria-label="人物の役割と秘密" value={castRole} onChange={(event) => setCastRole(event.target.value)} /></label>
          <label>登場条件・生成ルール<Textarea aria-label="人物の登場条件" value={castRule} onChange={(event) => setCastRule(event.target.value)} /></label>
          <div className="button-row"><Button onClick={() => setDialog(null)}>キャンセル</Button><Button className="primary" onClick={saveCast}>Castを登録</Button></div>
        </FieldDialog>
      )}

      {dialog === 'location' && (
        <FieldDialog title="Locationを追加" onClose={() => setDialog(null)}>
          <label>場所名<Input aria-label="場所名" value={locationName} onChange={(event) => setLocationName(event.target.value)} /></label>
          <label>場所の条件<Textarea aria-label="場所の条件" value={locationRule} onChange={(event) => setLocationRule(event.target.value)} /></label>
          <div className="button-row"><Button onClick={() => setDialog(null)}>キャンセル</Button><Button className="primary" onClick={saveLocation}>Locationを登録</Button></div>
        </FieldDialog>
      )}

      {dialog === 'beat' && (
        <FieldDialog title="Beatを追加" onClose={() => setDialog(null)}>
          <label>Chapter<Input aria-label="Chapter" value={chapter} onChange={(event) => setChapter(event.target.value)} /></label>
          <label>Beat<Input aria-label="Beat" value={beat} onChange={(event) => setBeat(event.target.value)} /></label>
          <label>Entry条件<Textarea aria-label="Entry条件" value={entry} onChange={(event) => setEntry(event.target.value)} /></label>
          <label>Exit条件<Textarea aria-label="Exit条件" value={exit} onChange={(event) => setExit(event.target.value)} /></label>
          <label>このBeatの禁止事項<Textarea aria-label="禁止事項" value={forbidden} onChange={(event) => setForbidden(event.target.value)} /></label>
          <div className="button-row"><Button onClick={() => setDialog(null)}>キャンセル</Button><Button className="primary" onClick={lockBeat}>Beatを固定</Button></div>
        </FieldDialog>
      )}

      {dialog === 'secret' && (
        <FieldDialog title="HiddenBriefを追加" onClose={() => setDialog(null)}>
          <label>秘密の名前<Input aria-label="秘密の名前" value={secretTitle} onChange={(event) => setSecretTitle(event.target.value)} /></label>
          <label>HiddenBrief<Textarea aria-label="HiddenBrief" value={hiddenBrief} onChange={(event) => setHiddenBrief(event.target.value)} /></label>
          <label>公開条件<Textarea aria-label="公開条件" value={revealCondition} onChange={(event) => setRevealCondition(event.target.value)} /></label>
          <div className="button-row"><Button onClick={() => setDialog(null)}>キャンセル</Button><Button className="primary" onClick={saveSecret}>非公開情報を保存</Button></div>
        </FieldDialog>
      )}

      {dialog === 'event' && (
        <FieldDialog title="強制イベントを追加" onClose={() => setDialog(null)}>
          <label>イベント名<Input aria-label="イベント名" value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} /></label>
          <label>トリガー条件<Textarea aria-label="トリガー条件" value={eventTrigger} onChange={(event) => setEventTrigger(event.target.value)} /></label>
          <label>イベント内容<Textarea aria-label="イベント内容" value={eventBody} onChange={(event) => setEventBody(event.target.value)} /></label>
          <div className="button-row"><Button onClick={() => setDialog(null)}>キャンセル</Button><Button className="primary" onClick={saveEvent}>強制イベントを登録</Button></div>
        </FieldDialog>
      )}
    </>
  );

  const body = (
    <>
      {noticeNode}
      {panelContent}
      {dialogContent}
    </>
  );

  return body;
}
