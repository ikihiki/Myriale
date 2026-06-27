import { useState } from 'react';
import { AppChrome } from './shared/AppChrome';
import { SessionTurn } from './shared/SessionTurn';

type Mode = 'dialogue' | 'battle' | 'roll' | 'event' | 'recovering';
type RecoveryPoint = 'lastConfirmed' | 'safePoint' | null;

type TransitionLog = {
  id: number;
  from: string;
  to: string;
  reason: string;
  startedAt: string;
  endedAt?: string;
};

type BattleState = {
  enemy: string;
  enemyHp: number;
  playerHp: number;
  turn: number;
};

type NarrativeLog = {
  id: number;
  mode: Mode;
  fact?: string;
  narrative: string;
};

const modeMeta: Record<Mode, { label: string; badge: string; forced: boolean; reason: string; objective: string; processing: string }> = {
  dialogue: {
    label: 'AI対話モード',
    badge: '対話中',
    forced: false,
    reason: '自由入力で行動や会話を送れます。',
    objective: '物語を自由に進める',
    processing: 'AIが入力を解釈し、次のNarrativeを生成します。',
  },
  battle: {
    label: 'プログラム主導: バトル',
    badge: 'バトル中',
    forced: true,
    reason: 'バトル中は状態不整合を避けるため、自由入力と巻き戻しを制限します。',
    objective: '書架番を撃退する',
    processing: '行動ボタンの結果をプログラムが確定し、AIは演出だけを語ります。',
  },
  roll: {
    label: 'プログラム主導: 判定',
    badge: '判定中',
    forced: true,
    reason: '判定中はダイス結果をプログラムが確定するため、自由入力は無効です。',
    objective: '錆びた扉を開けられるか判定する',
    processing: 'd6を生成し、成功/失敗ルートを確定します。',
  },
  event: {
    label: 'プログラム主導: 強制イベント',
    badge: 'イベント進行中',
    forced: true,
    reason: '強制イベント中は中断できない処理を安全に完了させるため、入力と巻き戻しを制限します。',
    objective: '崩落イベントを最後まで処理する',
    processing: '確定済みの出来事を順番に再生し、終了後にAI対話へ戻します。',
  },
  recovering: {
    label: '復旧確認',
    badge: '復旧中',
    forced: true,
    reason: '未確定結果を反映せず、どこまで確定したか確認しています。',
    objective: '安全な進行地点を選んで復帰する',
    processing: '最後に確定した地点またはセーフポイントから再開できます。',
  },
};

const account = { name: '霧野しおり', email: 'reader@myriale.example', initials: '霧野', role: 'プレイヤー' };

export function ModeTransitionExceptionWireframe() {
  const [mode, setMode] = useState<Mode>('dialogue');
  const [sessionMode, setSessionMode] = useState('AI対話モード');
  const [freeInput, setFreeInput] = useState('');
  const [notice, setNotice] = useState('現在はAI対話モードです。自由入力と巻き戻しが利用できます。');
  const [lastConfirmed, setLastConfirmed] = useState('Turn 18: 書架番が現れる直前まで確定');
  const [pendingAction, setPendingAction] = useState('未完了処理なし');
  const [recoveryPoint, setRecoveryPoint] = useState<RecoveryPoint>(null);
  const [battle, setBattle] = useState<BattleState>({ enemy: '錆びついた書架番', enemyHp: 24, playerHp: 30, turn: 1 });
  const [narratives, setNarratives] = useState<NarrativeLog[]>([
    {
      id: 1,
      mode: 'dialogue',
      narrative: 'あなたは星図灯を掲げ、軋む書架の間を進む。まだ自由に話しかけ、調べ、引き返すことができる。',
    },
  ]);
  const [transitions, setTransitions] = useState<TransitionLog[]>([
    { id: 1, from: '—', to: 'AI対話モード', reason: 'セッション再開', startedAt: '21:04:12', endedAt: '継続中' },
  ]);

  const meta = modeMeta[mode];
  const forced = meta.forced;

  const addNarrative = (entry: Omit<NarrativeLog, 'id'>) => {
    setNarratives((current) => [...current, { ...entry, id: current.length + 1 }]);
  };

  const addTransition = (from: Mode, to: Mode, reason: string, endedAt = '継続中') => {
    const time = `21:${String(5 + transitions.length).padStart(2, '0')}:${String(10 + transitions.length).padStart(2, '0')}`;
    setTransitions((current) => [
      ...current,
      {
        id: current.length + 1,
        from: modeMeta[from].label,
        to: modeMeta[to].label,
        reason,
        startedAt: time,
        endedAt,
      },
    ]);
  };

  const switchMode = (next: Mode, reason: string) => {
    addTransition(mode, next, reason);
    setMode(next);
    setSessionMode(modeMeta[next].label);
    setPendingAction(next === 'dialogue' ? '未完了処理なし' : `${modeMeta[next].label}の処理が未完了`);
    setNotice(`${reason}: Session Stateのmodeを「${modeMeta[next].label}」へ保存し、UIを切り替えました。`);
    if (next === 'battle') {
      setBattle({ enemy: '錆びついた書架番', enemyHp: 24, playerHp: 30, turn: 1 });
    }
    addNarrative({
      mode: next,
      fact: `MODE: ${modeMeta[mode].label} → ${modeMeta[next].label} / 理由: ${reason}`,
      narrative: next === 'dialogue'
        ? '緊張が解け、あなたは再び自分の言葉で物語を動かせる。'
        : next === 'battle'
          ? '通常のターン進行画面のまま、次のターン表示がバトル用に切り替わる。行動ボタンはターン内に現れ、結果も同じログ形式で積み上がる。'
          : `${modeMeta[next].badge}に入りました。画面は処理中内容と現在の目的を表示し、自由入力を一時的に閉じます。`,
    });
  };

  const battleAction = (action: '攻撃' | '防御' | 'スキル' | '逃走') => {
    if (mode !== 'battle') return;
    const damageTable: Record<typeof action, number> = { 攻撃: 8, 防御: 2, スキル: 12, 逃走: 0 } as Record<typeof action, number>;
    const counterTable: Record<typeof action, number> = { 攻撃: 4, 防御: 1, スキル: 5, 逃走: 0 } as Record<typeof action, number>;
    const dealt = damageTable[action];
    const counter = counterTable[action];
    const enemyHp = Math.max(0, battle.enemyHp - dealt);
    const playerHp = Math.max(0, battle.playerHp - counter);
    const nextTurn = battle.turn + 1;
    setBattle({ ...battle, enemyHp, playerHp, turn: nextTurn });
    setLastConfirmed(`Turn ${18 + narratives.length}: バトル行動「${action}」を確定 / 敵HP ${enemyHp} / 自HP ${playerHp}`);
    setPendingAction(enemyHp === 0 ? 'バトル結果確定。AI対話へ復帰可能' : `Battle Turn ${nextTurn} の行動選択待ち`);
    setNotice(`ターン内のバトル操作で「${action}」を確定しました。行動ログは通常ターンと同じ形式で追加されます。`);
    addNarrative({
      mode: 'battle',
      fact: `BATTLE TURN ${battle.turn}: 行動「${action}」確定 / 与ダメージ${dealt} / 被ダメージ${counter} / 敵HP ${enemyHp} / 自HP ${playerHp}`,
      narrative: action === '逃走'
        ? 'あなたは崩れた書架の陰へ飛び込み、敵との距離を取り直す。'
        : `あなたの${action}が書架番の装甲を打ち、通常のターンログとして結果が記録される。`,
    });
  };

  const completeProgramMode = () => {
    setLastConfirmed(`Turn ${18 + narratives.length}: ${meta.label}の結果を確定`);
    switchMode('dialogue', 'プログラム主導シーン正常終了');
    setPendingAction('未完了処理なし');
    setNotice('正常終了しました。AI対話モードに戻り、自由入力と巻き戻しが再度有効になりました。');
  };

  const simulateError = () => {
    addTransition(mode, 'recovering', 'プログラム処理エラー');
    setMode('recovering');
    setSessionMode('復旧確認');
    setPendingAction('未確定: ダメージ計算の後半は反映しない');
    setNotice('エラーが発生しました。確定済み地点を表示し、未確定の処理結果はSession Stateへ反映しません。');
    addNarrative({
      mode: 'recovering',
      fact: 'ERROR: ダメージ計算の途中で失敗。確定済み=行動選択まで / 未確定=ダメージ反映',
      narrative: '物語は一時停止した。あなたが失ったものはない。最後に確かな地点から、もう一度選び直せる。',
    });
  };

  const simulateDisconnect = () => {
    setPendingAction(`${meta.label}の未完了UIを再提示`);
    setNotice('通信断から再接続しました。最後に確定した進行地点からモード状態を復元し、未完了処理を再提示します。');
    addNarrative({
      mode,
      fact: `RECONNECT: ${sessionMode}を復元 / lastConfirmed=${lastConfirmed}`,
      narrative: '画面は中断前と同じ進行モードに戻り、まだ確定していない操作だけを再提示する。',
    });
  };

  const recover = (point: RecoveryPoint) => {
    setRecoveryPoint(point);
    setMode('dialogue');
    setSessionMode('AI対話モード');
    setPendingAction('未完了処理なし');
    addTransition('recovering', 'dialogue', point === 'lastConfirmed' ? '最後に確定した地点から復帰' : '安全なセーフポイントへ復帰', '21:12:02');
    setNotice(point === 'lastConfirmed' ? '最後に確定した地点から復帰しました。' : '安全なセーフポイントへ戻りました。');
  };

  const sendFreeInput = () => {
    const text = freeInput.trim();
    if (!text || forced) return;
    addNarrative({ mode: 'dialogue', fact: `PLAYER: ${text}`, narrative: 'AIは入力を受け取り、物語を自由に続ける。' });
    setFreeInput('');
    setNotice('自由入力を送信しました。');
  };

  return (
    <AppChrome
      section="sessions"
      breadcrumbs={[
        { label: 'Myriale', to: 'scenarioRegister' },
        { label: 'セッション', to: 'startSession' },
        { label: 'モード遷移と例外' },
      ]}
      account={account}
    >
      <div className="scenario-forge scenario-forge-wizard program-driven-wireframe mode-transition-wireframe">
        <aside className="contract-spine" aria-label="モード遷移トリガー">
          <strong>Mode Control</strong>
          <p className="toc-help">暗黙の切替ではなく、Session Stateのmodeとして保存し、例外時も確定地点から復帰します。</p>
          <div className="wizard-step-list" role="list" aria-label="モード切替">
            <button className="spine-row spine-step" onClick={() => switchMode('battle', 'バトル開始')} aria-label="バトル開始">
              <span>バトル開始</span><small>自由入力を無効化</small>
            </button>
            <button className="spine-row spine-step" onClick={() => switchMode('roll', 'ダイス判定開始')} aria-label="判定開始">
              <span>判定開始</span><small>ダイスUIを表示</small>
            </button>
            <button className="spine-row spine-step" onClick={() => switchMode('event', '強制イベント開始')} aria-label="強制イベント開始">
              <span>強制イベント開始</span><small>自動進行を表示</small>
            </button>
            <button className="spine-row spine-step" onClick={completeProgramMode} disabled={!forced || mode === 'recovering'} aria-label="正常終了してAI対話へ戻る">
              <span>正常終了</span><small>AI対話へ復帰</small>
            </button>
          </div>
          <div className="scenario-id"><span>Session mode</span><b data-testid="session-mode-state">{sessionMode}</b></div>
        </aside>

        <main className="forge-paper wizard-paper program-driven-main" aria-label="モード遷移と例外処理">
          <p className="kicker">Session foundation / Mode transitions and exceptions</p>
          <div className={`mode-banner mode-${mode === 'recovering' ? 'event' : mode}`} role="status" data-testid="mode-banner">
            <span className="mode-badge" data-testid="mode-badge">{meta.badge}</span>
            <span className="mode-reason" data-testid="mode-reason">{meta.reason}</span>
          </div>
          <div className="notice" role="status" data-testid="mode-notice">{notice}</div>

          <section className="dialogue-log program-log" aria-label="進行ログ" data-testid="narrative-log">
            {mode === 'battle' && (
              <SessionTurn
                ariaLabel={`バトルターン ${battle.turn}`}
                testId="active-battle-turn"
                selected
                variantClassName="turn-battle active-battle-turn"
                lead={{
                  tone: 'program',
                  tag: 'BATTLE',
                  text: `Battle Turn ${battle.turn}: ${battle.enemy} HP ${battle.enemyHp} / あなたのHP ${battle.playerHp}`,
                  testId: 'battle-turn-lead',
                  actions: (
                    <div className="button-row" role="group" aria-label="バトルターン行動">
                      {(['攻撃', '防御', 'スキル', '逃走'] as const).map((action) => (
                        <button key={action} onClick={() => battleAction(action)}>{action}</button>
                      ))}
                    </div>
                  ),
                  detail: <p className="program-hint">通常のターン表示コンポーネント内で、リード部分だけがバトル用操作に切り替わります。</p>,
                }}
                narrative="敵の動き、選択可能な行動、確定後の描写が同じターン進行ログの中で続きます。"
                narrativeTag="AI"
                narrativeTestId="battle-turn-narrative"
              />
            )}
            {narratives.map((entry) => (
              <SessionTurn
                key={entry.id}
                ariaLabel={`ログ ${entry.id}`}
                variantClassName={`turn-${entry.mode === 'recovering' ? 'event' : entry.mode}`}
                lead={entry.fact ? { tone: 'program', tag: 'STATE', text: entry.fact, testId: `fact-${entry.id}` } : undefined}
                narrative={entry.narrative}
                narrativeTag="AI"
                narrativeTestId={`narrative-${entry.id}`}
              />
            ))}
          </section>

          <section className="program-controls dialogue-controls" aria-label="自由入力と巻き戻し">
            <label className="sr-only" htmlFor="mode-free-input">自由に行動や会話を入力</label>
            <div className="free-input-row">
              <input
                id="mode-free-input"
                aria-label="自由に行動や会話を入力"
                value={freeInput}
                disabled={forced}
                placeholder={forced ? 'プログラム主導モード中は自由入力できません' : '例: 書架番に呼びかける'}
                onChange={(event) => setFreeInput(event.target.value)}
              />
              <button onClick={sendFreeInput} disabled={forced} data-testid="send-free-input">行動を送る</button>
              <button disabled={forced} data-testid="rewind-button">巻き戻し</button>
            </div>
            {forced && <p className="program-hint input-disabled-reason" data-testid="input-disabled-reason">自由入力と巻き戻しが無効な理由: {meta.reason} 終了後に可能です。</p>}
          </section>
        </main>

        <aside className="ai-bookmark wizard-summary" aria-label="Mode State">
          <h2>Mode State</h2>
          <article><h3>Session State</h3><p data-testid="summary-mode">mode: {sessionMode}</p><p>{forced ? 'programDriven=true' : 'programDriven=false'}</p></article>
          <article><h3>操作可否</h3><p data-testid="summary-input">自由入力: {forced ? '無効' : '有効'}</p><p data-testid="summary-rewind">巻き戻し: {forced ? '終了後に可能' : '可能'}</p></article>
          <article><h3>強制進行の確認情報</h3><p data-testid="current-objective">目的: {meta.objective}</p><p data-testid="processing-detail">処理: {meta.processing}</p><p data-testid="last-confirmed">確定地点: {lastConfirmed}</p><p data-testid="pending-action">未完了: {pendingAction}</p></article>
          <article><h3>例外時だけ使う操作</h3><div className="button-row exception-actions"><button onClick={simulateError} disabled={!forced || mode === 'recovering'}>処理エラーを発生</button><button onClick={simulateDisconnect} disabled={mode === 'dialogue'}>通信断から再接続</button><button onClick={() => recover('lastConfirmed')} disabled={mode !== 'recovering'}>最後に確定した地点から再開</button><button onClick={() => recover('safePoint')} disabled={mode !== 'recovering'}>安全な地点へ戻る</button></div><p className="program-hint" data-testid="recovery-point">復旧選択: {recoveryPoint ?? '未選択'}</p></article>
          <article><h3>遷移履歴</h3><table className="wire-table compact" aria-label="モード遷移ログ"><thead><tr><th>From</th><th>To</th><th>理由</th><th>時刻</th></tr></thead><tbody>{transitions.map((item) => <tr key={item.id}><td>{item.from}</td><td>{item.to}</td><td>{item.reason}</td><td>{item.startedAt} / {item.endedAt}</td></tr>)}</tbody></table></article>
        </aside>
      </div>
    </AppChrome>
  );
}
