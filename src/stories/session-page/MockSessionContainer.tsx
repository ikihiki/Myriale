import { useState } from 'react';
import type { AppChromeAccount } from '../../account/accountPresentation';
import { useOptionalAppStore, type TurnDisplayFlags } from '../../app/store';
import { SessionPresentation } from '../../features/session-play/SessionPresentation';
import type {
  BattleAction,
  DialogueTurn,
  RecoveryPoint,
  SessionMode,
  SessionModeFlavor,
  SessionProgramController,
} from '../../features/session-play/sessionModel';
import { clampInitialTurnCount, headingLinks, initialTurns, resultForInput } from './sessionFixtures';

const demoPlayerAccount: AppChromeAccount = {
  name: '霧野しおり',
  email: 'reader@myriale.example',
  initials: '霧野',
  role: 'プレイヤー',
};

const programTurnDisplay: TurnDisplayFlags = { allowRewind: false, showInterpretation: false, leadTone: 'program', leadTag: 'PROGRAM' };

export function MockSessionContainer({ sessionId }: { sessionId: string }) {
  const appStore = useOptionalAppStore();
  const dbSession = appStore?.db.playSessions[sessionId];
  const initialTurnCount = clampInitialTurnCount(dbSession?.turn);
  const [turns, setTurns] = useState<DialogueTurn[]>(initialTurns.slice(0, initialTurnCount));
  const [sessionMode, setSessionMode] = useState<SessionMode>('dialogue');
  const [sessionModeFlavor] = useState<SessionModeFlavor>(appStore?.db.ui.sessionView ?? 'dialogue');
  const [battle, setBattle] = useState({ enemy: '錆びついた書架番', playerHp: 30, enemyHp: 24, turn: 1 });
  const [rollResult, setRollResult] = useState<{ value: number; success: boolean } | null>(null);
  const [fixedRoll, setFixedRoll] = useState('ランダム');
  const [eventAdvanced, setEventAdvanced] = useState(false);
  const [pendingAction, setPendingAction] = useState('未完了処理なし');
  const [lastConfirmed, setLastConfirmed] = useState('Turn 18: AI対話モードで自由入力待ち');
  const [recoveryPoint, setRecoveryPoint] = useState<RecoveryPoint | null>(null);
  const [notice, setNotice] = useState(initialTurnCount === 1 ? '' : `Session状態はActiveです。DB設定により、複数ターン経過後（Turn ${String(initialTurnCount).padStart(2, '0')}まで）のログを表示しています。AIが現在地、周囲、直近の出来事をNarrativeとして提示しました。`);
  const [transitionRows, setTransitionRows] = useState<Array<{ id: number; from: string; to: string; reason: string; at: string }>>([
    { id: 1, from: '—', to: 'AI対話モード', reason: 'セッション開始', at: '21:04:12' },
  ]);

  const modeLabel = (mode: SessionMode) => ({ dialogue: 'AI対話モード', battle: 'バトル', roll: '判定', event: '強制イベント', recovering: '復旧確認' })[mode];
  const appendGeneratedTurn = (title: string, narrative: string, playerInput?: string, interpretation?: string, display?: TurnDisplayFlags) => {
    setTurns((current) => [...current, { id: current.length + 1, turnTitle: title, playerInput, interpretation, narrative, kind: 'action', display }]);
  };
  const addTransitionRow = (from: SessionMode, to: SessionMode, reason: string) => {
    setTransitionRows((current) => [...current, { id: current.length + 1, from: modeLabel(from), to: modeLabel(to), reason, at: `21:${String(5 + current.length).padStart(2, '0')}:${String(10 + current.length).padStart(2, '0')}` }]);
  };
  const switchSessionMode = (next: SessionMode, reason: string) => {
    addTransitionRow(sessionMode, next, reason);
    setSessionMode(next);
    setPendingAction(next === 'dialogue' ? '未完了処理なし' : `${modeLabel(next)}の処理が未完了`);
    setNotice(`${reason}: modeTransitionを経て${modeLabel(next)}へ接続しました。変化するのは入力部分だけで、Turn表示は共通の対話ログに追加されます。`);
    appendGeneratedTurn(`${modeLabel(next)}へ遷移`, next === 'dialogue' ? 'プログラム処理が終わり、同じ対話ログの続きとして自由入力へ戻る。' : `${reason}。条件を満たしたため、Sessionは${modeLabel(next)}の入力UIへ切り替わる。`, undefined, `MODE: ${modeLabel(sessionMode)} → ${modeLabel(next)}`, programTurnDisplay);
  };
  const startBattle = (label: 'バトルを開始' | 'バトル開始') => {
    setBattle({ enemy: '錆びついた書架番', playerHp: 30, enemyHp: 24, turn: 1 });
    switchSessionMode('battle', label);
  };
  const startRoll = (label: '判定を開始' | '判定開始') => { setRollResult(null); switchSessionMode('roll', label); };
  const startEvent = (label: '強制イベントを発生' | '強制イベント開始') => { setEventAdvanced(false); switchSessionMode('event', label); };
  const resolveBattleAction = (action: BattleAction) => {
    const damageTable = { 攻撃: 8, 防御: 2, スキル: 12, 逃走: 0 };
    const counterTable = { 攻撃: 4, 防御: 1, スキル: 5, 逃走: 0 };
    const dealt = damageTable[action];
    const counter = counterTable[action];
    const enemyHp = Math.max(0, battle.enemyHp - dealt);
    const playerHp = Math.max(0, battle.playerHp - counter);
    appendGeneratedTurn(`BATTLE TURN ${battle.turn}`, `BATTLE TURN ${battle.turn}: 行動「${action}」確定 / 与ダメージ${dealt} / 被ダメージ${counter} / 敵HP ${enemyHp} / 自HP ${playerHp}。この結果も通常ターンと同じ対話ログに表示される。`, action, 'プログラムモードのボタン入力として解釈しました。', programTurnDisplay);
    setBattle({ ...battle, enemyHp, playerHp, turn: battle.turn + 1 });
    setLastConfirmed(`Turn ${turns.length + 1}: バトル行動「${action}」を確定`);
    setPendingAction(enemyHp === 0 ? 'バトル結果確定。AI対話へ復帰可能' : `Battle Turn ${battle.turn + 1} の行動選択待ち`);
    setNotice('行動ログは通常ターンと同じ形式で追加されます。');
  };
  const rollDie = () => {
    const value = fixedRoll === 'ランダム' ? 5 : Number(fixedRoll);
    const success = value >= 4;
    setRollResult({ value, success });
    appendGeneratedTurn('判定結果', success ? `ROLL: d6=${value}（成功）。成功ルートのNarrativeを同じ対話ログへ追加しました。` : `ROLL: d6=${value}（失敗）。失敗ルートへ自動で進めました。プレイヤー操作なしで結果を確定します。`, '判定を実行', 'プログラムが乱数結果を確定しました。', programTurnDisplay);
    setNotice(success ? '判定に成功しました。' : '失敗ルートへ自動で進めました。');
  };
  const advanceEvent = () => {
    setEventAdvanced(true);
    appendGeneratedTurn('強制イベント確定', 'イベント確定: 落下ダメージ5。AIが描写・心情・演出を生成し、結果は共通の対話ログに残る。', '強制イベントを進める', 'イベント中の分岐不可処理として解釈しました。', programTurnDisplay);
    setNotice('AIが描写・心情・演出を生成しました。');
  };
  const complete = () => {
    setLastConfirmed(`Turn ${turns.length}: ${modeLabel(sessionMode)}の結果を確定`);
    switchSessionMode('dialogue', 'プログラム主導シーン正常終了');
    setPendingAction('未完了処理なし');
    setNotice('正常終了しました。AI対話モードに戻り、自由入力と巻き戻しが再度有効になりました。');
  };
  const processingError = () => {
    addTransitionRow(sessionMode, 'recovering', 'プログラム処理エラー');
    setSessionMode('recovering');
    setPendingAction('未確定: ダメージ計算の後半は反映しない');
    appendGeneratedTurn('復旧確認', 'ERROR: ダメージ計算の途中で失敗。確定済み=行動選択まで / 未確定=ダメージ反映。', undefined, '未確定の処理結果はSession Stateへ反映しません。', programTurnDisplay);
    setNotice('エラーが発生しました。確定済み地点を表示し、未確定の処理結果はSession Stateへ反映しません。');
  };
  const recover = (point: RecoveryPoint) => {
    setRecoveryPoint(point);
    addTransitionRow('recovering', 'dialogue', point === 'lastConfirmed' ? '最後に確定した地点から復帰' : '安全なセーフポイントへ復帰');
    setSessionMode('dialogue');
    setPendingAction('未完了処理なし');
    setNotice(point === 'lastConfirmed' ? '最後に確定した地点から復帰しました。' : '安全なセーフポイントへ戻りました。');
  };
  const reconnect = () => { setPendingAction(`${modeLabel(sessionMode)}の未完了UIを再提示`); setNotice('通信断から再接続しました。最後に確定した進行地点からモード状態を復元し、未完了UIを再提示します。'); };

  const program: SessionProgramController = {
    mode: sessionMode, flavor: sessionModeFlavor, battle, rollResult, fixedRoll, eventAdvanced, pendingAction, lastConfirmed, recoveryPoint, transitions: transitionRows, notice,
    onFixedRollChange: setFixedRoll, onStartBattle: startBattle, onStartRoll: startRoll, onStartEvent: startEvent,
    onBattleAction: resolveBattleAction, onRoll: rollDie, onAdvanceEvent: advanceEvent, onComplete: complete,
    onProcessingError: processingError, onRecover: recover, onReconnect: reconnect,
  };

  return <SessionPresentation
    sessionId={sessionId}
    account={demoPlayerAccount}
    turns={turns}
    headingLinks={headingLinks}
    sessionStateLabel={dbSession?.state ?? 'Active'}
    initialNotice={notice}
    turnDisplay={dbSession?.turnDisplay}
    program={program}
    onSubmit={async (input) => {
      const nextTurn = resultForInput(input, turns.length + 1);
      setTurns((current) => [...current, nextTurn]);
      return { ok: true, notice: 'Player Inputを行動として解釈し、結果をNarrativeとして生成しました。次の重要な進行は入力待ちです。' };
    }}
    onRecommend={async () => ({ ok: true, value: turns.at(-1)?.narrative.includes('扉') ? '銀の鍵を扉にかざし、刻まれた星座との対応を確かめる' : '周囲の安全を確かめながら、目につく手掛かりを詳しく調べる', notice: 'AIの提案を入力欄へ設定しました。内容を編集してから送信できます。' })}
    onClarification={() => {
      setTurns((current) => [...current, { id: current.length + 1, turnTitle: '状況の再説明', playerInput: '今の状況を簡単にまとめて', narrative: '補足説明: あなたは水没した閲覧室にいて、銀の鍵を持っています。書架の奥には会話できそうな人物がいます。この返答は理解補助であり、物語進行や世界状態は変化しません。', kind: 'clarification' }]);
      return { ok: true, notice: '補足要求として扱いました。行動ではないため、セッション状態と物語進行は変化しません。' };
    }}
    onRewind={(turnId) => {
      setTurns((current) => current.filter((turn) => turn.id <= turnId).map((turn) => turn.id === turnId ? { ...turn, turnTitle: `${turn.turnTitle}（巻き戻し地点）` } : turn));
      return { ok: true, notice: 'ここまで戻る: 指定ターン以降のログを無効化し、AIコンテキストを再構築しました。巻き戻し地点から再入力できます。' };
    }}
  />;
}
