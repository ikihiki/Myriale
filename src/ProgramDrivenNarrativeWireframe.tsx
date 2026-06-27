import { useState } from 'react';
import { AppChrome } from './shared/AppChrome';
import { SessionTurn } from './shared/SessionTurn';

type Mode = 'dialogue' | 'battle' | 'roll' | 'event';

type LogEntry = {
  id: number;
  /** どのモードで生成されたか。 */
  mode: Mode;
  /** プログラムが確定した事実（命中・ダメージ・ダイス目など）。任意。 */
  fact?: string;
  /** AIが演出として語るNarrative。 */
  narrative: string;
};

type BattleState = {
  enemy: string;
  playerHp: number;
  enemyHp: number;
  finished: boolean;
};

const modeMeta: Record<Mode, { label: string; badge: string; forced: boolean; reason: string }> = {
  dialogue: {
    label: 'AI対話',
    badge: '対話中',
    forced: false,
    reason: '自由入力で行動や会話を送れます。',
  },
  battle: {
    label: 'バトル',
    badge: 'バトル中',
    forced: true,
    reason: 'バトル中はルール検証のため自由入力は無効です。行動ボタンで選びます。',
  },
  roll: {
    label: '判定',
    badge: '判定中',
    forced: true,
    reason: '判定中は自由入力は無効です。ダイスはプログラムが生成し、AIは結果を変更できません。',
  },
  event: {
    label: 'イベント',
    badge: 'イベント進行中',
    forced: true,
    reason: '強制イベント中は自由入力も分岐選択も表示されません。制御不能な状況として最後まで自動再生されます。',
  },
};

const initialLog: LogEntry[] = [
  {
    id: 1,
    mode: 'dialogue',
    narrative:
      'あなたは星図灯を手に、崩れかけた書架の回廊を進む。前方の闇から、濡れた金属の擦れる音が近づいてくる。',
  },
];

const account = { name: '霧野しおり', email: 'reader@myriale.example', initials: '霧野', role: 'プレイヤー' };

export function ProgramDrivenNarrativeWireframe() {
  const [mode, setMode] = useState<Mode>('dialogue');
  const [log, setLog] = useState<LogEntry[]>(initialLog);
  const [freeInput, setFreeInput] = useState('');
  const [battle, setBattle] = useState<BattleState>({ enemy: '錆びついた書架番', playerHp: 30, enemyHp: 24, finished: false });
  const [rollResult, setRollResult] = useState<{ value: number; success: boolean } | null>(null);
  const [notice, setNotice] = useState('現在はAI対話モードです。自由入力で物語を進められます。');
  // US-PG10: 作者向けテストハーネス。判定値を固定/再現できる。
  const [fixedRoll, setFixedRoll] = useState('ランダム');

  const meta = modeMeta[mode];
  const forced = meta.forced;

  const append = (entry: Omit<LogEntry, 'id'>) => {
    setLog((current) => [...current, { ...entry, id: current.length + 1 }]);
  };

  // US-PG01: バトル/判定/イベント開始 → Forced Mode に切り替え、自由入力を無効化。
  const startBattle = () => {
    setMode('battle');
    setBattle({ enemy: '錆びついた書架番', playerHp: 30, enemyHp: 24, finished: false });
    append({
      mode: 'battle',
      fact: 'モード遷移: AI対話 → バトル（自由入力を無効化）',
      narrative: '書架の影から錆びついた書架番が現れ、戦闘が始まった。行動を選べ。',
    });
    setNotice('バトルを開始しました。Forced Modeです。行動はボタンで選び、結果はプログラムが判定します。');
  };

  const startRoll = () => {
    setMode('roll');
    setRollResult(null);
    append({
      mode: 'roll',
      fact: 'モード遷移: 判定開始（自由入力を無効化）',
      narrative: '錆びついた扉が行く手を阻む。こじ開けられるか――技能判定が必要だ。',
    });
    setNotice('判定モードに入りました。「ダイスを振る」で判定します。結果はプログラムが生成します。');
  };

  const startEvent = () => {
    setMode('event');
    append({
      mode: 'event',
      fact: '強制イベント: 天井崩落（中断不可）',
      narrative: '轟音とともに天井が抜ける。あなたの意思とは無関係に、足場が崩れ落ちていく。',
    });
    setNotice('強制イベントが発生しました。中断・分岐はできません。最後まで自動再生されます。');
  };

  // US-PG02/PG03: 行動ボタン → プログラムが命中・ダメージ・状態を確定し、Session Stateへ反映。
  const battleAction = (action: '攻撃' | '防御' | 'スキル' | '逃走') => {
    if (battle.finished) return;
    const damageTable: Record<typeof action, number> = { 攻撃: 8, 防御: 2, スキル: 12, 逃走: 0 } as Record<typeof action, number>;
    const dealt = damageTable[action];
    const enemyHp = Math.max(0, battle.enemyHp - dealt);
    const counter = action === '防御' ? 1 : action === '逃走' ? 0 : 4;
    const playerHp = Math.max(0, battle.playerHp - counter);
    const finished = enemyHp === 0;
    setBattle({ ...battle, enemyHp, playerHp, finished });
    append({
      mode: 'battle',
      fact: `行動「${action}」確定: 与ダメージ${dealt} / 被ダメージ${counter} → 敵HP ${enemyHp} / 自HP ${playerHp}`,
      narrative:
        action === '逃走'
          ? 'あなたは身を翻し、回廊の暗がりへ転がり込む。書架番の指先が空を切った。'
          : `あなたの${action}が決まり、書架番の装甲がきしむ。冷たい火花が散った。`,
    });
    setNotice(`バトル: 「${action}」をプログラムが判定し、結果をSession Stateに反映しました。`);
    if (finished) {
      setNotice('敵を撃破しました。プログラムが決着を確定。AI対話モードへ戻れます。');
    }
  };

  // US-PG04/PG05: ダイスをプログラムが生成し、成功/失敗で自動分岐。
  const rollDice = () => {
    const value = fixedRoll === 'ランダム' ? 1 + Math.floor(Math.random() * 6) : Number(fixedRoll);
    const success = value >= 4;
    setRollResult({ value, success });
    append({
      mode: 'roll',
      fact: `ダイス: d6 = ${value}（${success ? '成功' : '失敗'}・しきい値4）`,
      narrative: success
        ? '錆を噛んだ閂が砕け、扉が軋みながら開く。先へ進める。'
        : '掌に錆が食い込むだけで、扉はびくともしない。別の手を探すしかない。',
    });
    append({
      mode: 'roll',
      fact: `自動分岐: ${success ? '成功ルート → 次のシーンへ' : '失敗ルート → 迂回路を提示'}（プレイヤー操作なし）`,
      narrative: success
        ? '扉の先、星図灯が次の回廊をぼんやりと照らし出した。'
        : '扉は諦めろと言わんばかりに沈黙する。脇の通気口がかすかに風を吐いていた。',
    });
    setNotice(`判定結果（d6=${value}）に基づき、プログラムが${success ? '成功' : '失敗'}ルートへ自動で進めました。`);
  };

  // US-PG06/PG07: 強制イベントを最後まで自動再生（事実はプログラム、演出はAI）。
  const advanceEvent = () => {
    append({
      mode: 'event',
      fact: 'イベント確定: 落下ダメージ5 / 下層フロアへ移動',
      narrative: '崩れた床とともに下層へ叩きつけられる。土埃の向こう、見知らぬ書庫が広がっていた。痛みの描写も、安堵も、AIが語る。',
    });
    setNotice('強制イベントの確定結果をもとに、AIが描写・心情・演出を生成しました。結果は変更されません。');
  };

  // US-PG08: シーン終了 → Forced Mode 解除、自由入力を再表示。
  const returnToDialogue = () => {
    setMode('dialogue');
    append({
      mode: 'dialogue',
      fact: 'モード遷移: Forced Mode 解除 → AI対話（自由入力を再表示）',
      narrative: '緊張が解け、あなたは再び自分の足で立っている。次に何をするかは、あなた次第だ。',
    });
    setNotice('プログラム主導シーンが終了しました。AI対話モードに戻り、自由入力が再び有効です。');
  };

  const sendFreeInput = () => {
    const text = freeInput.trim();
    if (!text || forced) return;
    append({ mode: 'dialogue', narrative: `（あなたの行動）${text} ……物語はあなたの選択を受けて続いていく。` });
    setFreeInput('');
    setNotice('自由入力を行動として解釈し、AIが物語を続けました。');
  };

  return (
    <AppChrome
      section="sessions"
      breadcrumbs={[
        { label: 'Myriale', to: 'scenarioRegister' },
        { label: 'セッション', to: 'startSession' },
        { label: 'プログラム主導の進行' },
      ]}
      account={account}
    >
      <div className="scenario-forge scenario-forge-wizard program-driven-wireframe">
        <aside className="contract-spine" aria-label="進行モードのトリガー">
          <strong>Program-driven Scenes</strong>
          <p className="toc-help">AIの自由対話では処理しない場面（バトル・判定・強制イベント）を、プログラム主導で安全に実行します。</p>
          <div className="wizard-step-list" role="list" aria-label="モード遷移トリガー">
            <button className="spine-row spine-step" onClick={startBattle} aria-label="バトルを開始">
              <span>バトル開始</span><small>行動ボタンで戦う</small>
            </button>
            <button className="spine-row spine-step" onClick={startRoll} aria-label="判定を開始">
              <span>判定開始</span><small>ダイスロール</small>
            </button>
            <button className="spine-row spine-step" onClick={startEvent} aria-label="強制イベントを発生">
              <span>強制イベント</span><small>中断不可の自動進行</small>
            </button>
            <button className="spine-row spine-step" onClick={returnToDialogue} aria-label="AI対話へ戻る">
              <span>AI対話へ戻る</span><small>Forced Mode解除</small>
            </button>
          </div>
          {/* US-PG10: 作者向けテストハーネス。 */}
          <div className="program-test-harness" aria-label="作者向けテストハーネス">
            <h3>テストハーネス</h3>
            <label>ダイス固定値（再現用）
              <select aria-label="ダイス固定値" value={fixedRoll} onChange={(event) => setFixedRoll(event.target.value)}>
                <option>ランダム</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
                <option>6</option>
              </select>
            </label>
            <small>特定イベントやバトルから単体で実行し、判定値を固定・再現できます。</small>
          </div>
          <div className="scenario-id"><span>Current mode</span><b data-testid="mode-state">{meta.label}</b></div>
        </aside>

        <main className="forge-paper wizard-paper program-driven-main" aria-label="プログラム主導ナラティブ">
          <p className="kicker">Session play / Program-driven mode</p>

          {/* US-PG09: 現在モードを常に明示。 */}
          <div className={`mode-banner mode-${mode}`} role="status" data-testid="mode-banner">
            <span className="mode-badge" data-testid="mode-badge">{meta.badge}</span>
            <span className="mode-reason" data-testid="mode-reason">{meta.reason}</span>
          </div>

          <div className="notice" role="status" data-testid="program-notice">{notice}</div>

          <section className="dialogue-log program-log" aria-label="進行ログ" data-testid="program-log">
            {log.map((entry) => (
              <SessionTurn
                key={entry.id}
                ariaLabel={`ログ ${entry.id}`}
                variantClassName={`turn-${entry.mode}`}
                lead={
                  entry.fact
                    ? {
                        tone: 'program',
                        tag: 'PROGRAM',
                        text: entry.fact,
                        testId: `fact-${entry.id}`,
                      }
                    : undefined
                }
                narrative={entry.narrative}
                narrativeTag="AI"
                narrativeTestId={`narrative-${entry.id}`}
              />
            ))}
          </section>

          {/* US-PG02/PG03: バトルの行動ボタン（Forced Mode、自由入力不可）。 */}
          {mode === 'battle' && (
            <section className="program-controls battle-controls" aria-label="バトル操作">
              <div className="battle-hp" data-testid="battle-hp">
                <span>敵「{battle.enemy}」HP: {battle.enemyHp}</span>
                <span>あなたのHP: {battle.playerHp}</span>
              </div>
              {!battle.finished ? (
                <div className="button-row" role="group" aria-label="バトル行動">
                  {(['攻撃', '防御', 'スキル', '逃走'] as const).map((action) => (
                    <button key={action} onClick={() => battleAction(action)}>{action}</button>
                  ))}
                </div>
              ) : (
                <div className="button-row">
                  <button className="primary" onClick={returnToDialogue} data-testid="battle-return">AI対話へ戻る</button>
                </div>
              )}
              <p className="program-hint">行動はルールで検証され、結果はプログラムが確定します。自由入力はできません。</p>
            </section>
          )}

          {/* US-PG04/PG05: ダイスロールと自動分岐。 */}
          {mode === 'roll' && (
            <section className="program-controls roll-controls" aria-label="判定操作">
              <div className="button-row">
                <button className="primary" onClick={rollDice} data-testid="roll-button">ダイスを振る</button>
                {rollResult && (
                  <button onClick={returnToDialogue} data-testid="roll-return">AI対話へ戻る</button>
                )}
              </div>
              {rollResult && (
                <p className={`roll-result ${rollResult.success ? 'success' : 'fail'}`} data-testid="roll-result">
                  d6 = {rollResult.value} → {rollResult.success ? '成功' : '失敗'}
                </p>
              )}
              <p className="program-hint">ダイスはプログラムが生成し、AIは結果を変更できません。成功/失敗で自動的に分岐します。</p>
            </section>
          )}

          {/* US-PG06/PG07: 強制イベント（中断不可・自動再生）。 */}
          {mode === 'event' && (
            <section className="program-controls event-controls" aria-label="強制イベント">
              <p className="event-lock" data-testid="event-lock">制御不能な状況です。中断・分岐はできません。</p>
              <div className="button-row">
                <button className="primary" onClick={advanceEvent} data-testid="event-advance">イベントを進める（自動再生）</button>
                <button onClick={returnToDialogue} data-testid="event-return">イベント終了後、AI対話へ</button>
              </div>
              <p className="program-hint">プログラムが事実を確定し、描写・心情・演出はAIが生成します。結果は変更されません。</p>
            </section>
          )}

          {/* US-PG01/PG08: 自由入力欄はForced Mode中は無効、対話モードで再表示。 */}
          <section className="program-controls dialogue-controls" aria-label="自由入力">
            <label className="sr-only" htmlFor="program-free-input">自由に行動や会話を入力</label>
            <div className="free-input-row">
              <input
                id="program-free-input"
                aria-label="自由に行動や会話を入力"
                value={freeInput}
                disabled={forced}
                placeholder={forced ? 'Forced Mode中は自由入力できません' : '例: 星図灯を掲げて周囲を照らす'}
                onChange={(event) => setFreeInput(event.target.value)}
              />
              <button onClick={sendFreeInput} disabled={forced} data-testid="send-free-input">行動を送る</button>
            </div>
            {forced && (
              <p className="program-hint input-disabled-reason" data-testid="input-disabled-reason">
                自由入力が無効な理由: {meta.reason}
              </p>
            )}
          </section>
        </main>

        <aside className="ai-bookmark wizard-summary" aria-label="Session State">
          <h2>Session State</h2>
          <article>
            <h3>進行モード</h3>
            <p data-testid="summary-mode">{meta.label}（{forced ? 'Forced Mode' : '自由入力可'}）</p>
          </article>
          <article>
            <h3>バトル状態</h3>
            <p data-testid="summary-battle">敵HP {battle.enemyHp} / 自HP {battle.playerHp}{battle.finished ? ' / 決着' : ''}</p>
          </article>
          <article>
            <h3>直近の判定</h3>
            <p data-testid="summary-roll">{rollResult ? `d6=${rollResult.value}（${rollResult.success ? '成功' : '失敗'}）` : '判定なし'}</p>
          </article>
          <article>
            <h3>役割分担</h3>
            <p>事実の確定: プログラム</p>
            <p>描写・演出: AI Narrative</p>
          </article>
        </aside>
      </div>
    </AppChrome>
  );
}
