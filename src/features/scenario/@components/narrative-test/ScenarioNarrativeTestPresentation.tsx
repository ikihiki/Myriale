import { useState } from 'react';
import type { CompareScenarioDraftNarrativeResponse, ScenarioNarrativeRecentTurn, ScenarioNarrativeTestCase } from '../../../../app/scenarioApi';
import { Button, Input, Notice, Textarea } from '../../../../components/ui';
import { NarrativeBody } from '../../../../shared/NarrativeBody';
import type { ScenarioFormActions, ScenarioFormValues } from '../scenarioFormModel';

function initialTestCase(values: ScenarioFormValues): ScenarioNarrativeTestCase {
  const location = values.ruleData.locations[0] ?? { code: 'start', name: '開始地点', description: '' };
  const object = values.ruleData.objects[0];
  return {
    recentTurns: [], playerInput: '',
    selectedObject: { id: object?.code ?? 'system', code: object?.code ?? 'system', name: object?.name ?? 'システム', locationId: location.code, isGlobal: object?.global ?? true, revision: 0, state: {} },
    selectedAction: { objectId: object?.code ?? 'system', actionId: 'test', code: 'test', label: 'テスト行動', description: '', argumentSchema: {}, enabled: true },
    postState: { schemaVersion: 'rule-post-state.v1', currentLocation: { id: location.code, code: location.code, name: location.name, description: location.description }, objects: [], sessionFlags: {}, sessionStateRevision: 0 },
    facts: [], events: [], narrativeHints: [], forbiddenNarrativeFacts: [],
    entities: values.ruleData.objects.map((item) => ({ code: item.code, name: item.name, profileMarkdown: item.profileMarkdown })),
  };
}

const withoutTurns = (testCase: ScenarioNarrativeTestCase) => {
  const { recentTurns: _recentTurns, playerInput: _playerInput, ...context } = testCase;
  return JSON.stringify(context, null, 2);
};

export function ScenarioNarrativeTestPresentation({ values, actions }: { values: ScenarioFormValues; actions: ScenarioFormActions }) {
  const [seed] = useState(() => initialTestCase(values)); // Keep the authored test fixture stable while the draft changes.
  const [sessionId, setSessionId] = useState('');
  const [turnId, setTurnId] = useState('');
  const [recentTurns, setRecentTurns] = useState<ScenarioNarrativeRecentTurn[]>(seed.recentTurns);
  const [playerInput, setPlayerInput] = useState(seed.playerInput);
  const [contextJson, setContextJson] = useState(withoutTurns(seed));
  const [result, setResult] = useState<CompareScenarioDraftNarrativeResponse | null>(null);
  const [notice, setNotice] = useState('状態と過去Turnを固定し、公開版と画面上の未保存ドラフトを同じAIで比較します。');
  const [profileIds, setProfileIds] = useState('runpod-economy\nrunpod-recommended');
  const [repetitions, setRepetitions] = useState(3);
  const [evaluation, setEvaluation] = useState<import('../../../../app/scenarioApi').ScenarioAiEvaluationRun | null>(null);
  const [working, setWorking] = useState(false);

  const importTurn = async () => {
    if (!actions.importNarrativeTest || !sessionId.trim() || !turnId.trim()) return;
    setWorking(true);
    try {
      const response = await actions.importNarrativeTest(sessionId.trim(), turnId.trim());
      setNotice(response.message);
      if (response.value) {
        setRecentTurns(response.value.testCase.recentTurns);
        setPlayerInput(response.value.testCase.playerInput);
        setContextJson(withoutTurns(response.value.testCase));
        setResult(null);
      }
    } finally { setWorking(false); }
  };

  const compare = async () => {
    if (!actions.compareNarrativeDraft) return;
    setWorking(true);
    try {
      const context = JSON.parse(contextJson) as Omit<ScenarioNarrativeTestCase, 'recentTurns' | 'playerInput'>;
      const response = await actions.compareNarrativeDraft(values, { ...context, recentTurns, playerInput });
      setNotice(response.message);
      setResult(response.value ?? null);
    } catch (error) {
      setNotice(error instanceof SyntaxError ? '状態・Narrative材料はJSONオブジェクトで入力してください。' : '比較生成に失敗しました。');
    } finally { setWorking(false); }
  };

  const runEvaluation = async () => {
    if (!actions.runAiEvaluation) return;
    setWorking(true);
    try {
      const context = JSON.parse(contextJson) as Omit<ScenarioNarrativeTestCase, 'recentTurns' | 'playerInput'>;
      const ids = profileIds.split(/\s|,/).map((item) => item.trim()).filter(Boolean);
      const response = await actions.runAiEvaluation(ids, repetitions, { ...context, recentTurns, playerInput }, {
        temperature: 0.8, topP: 0.95, repetitionPenalty: 1.05, seed: 42, maxOutputTokens: 1200, thinkingEnabled: false, retryAttempts: 0,
      });
      setNotice(response.message); setEvaluation(response.value ?? null);
    } catch (error) {
      setNotice(error instanceof SyntaxError ? '状態・Narrative材料はJSONオブジェクトで入力してください。' : 'モデル比較に失敗しました。');
    } finally { setWorking(false); }
  };

  const exportEvaluation = async (format: 'json' | 'csv') => {
    if (!evaluation || !actions.exportAiEvaluation) return;
    const response = await actions.exportAiEvaluation(evaluation.summary.id, format); setNotice(response.message);
  };

  const updateTurn = (index: number, patch: ScenarioNarrativeRecentTurn) => setRecentTurns((current) => current.map((turn, turnIndex) => turnIndex === index ? { ...turn, ...patch } : turn));

  return <section className="grid gap-5" aria-label="Narrativeドラフトテスト">
    <header className="grid gap-2 border-b border-[#17151f]/15 pb-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#5c4f8f]">Draft improvement laboratory</p>
      <h2>公開版より改善できたか、同じ条件で確かめる</h2>
      <p>この画面の基本情報・世界観・トーン・AI裁量・主人公・開始シーンを未保存のまま使用します。比較はSessionやDraftへ書き戻しません。</p>
      <Notice tone={notice.includes('失敗') || notice.includes('入力してください') ? 'danger' : 'info'} data-testid="narrative-test-notice">{notice}</Notice>
    </header>

    <section className="grid gap-3 rounded-2xl border border-[#17151f]/15 bg-white/60 p-4" aria-label="Session Turnインポート">
      <h3>Session / Turnからテスト条件を取り込む</h3>
      <p className="text-sm text-myr-ink-subtle">そのTurnで実際に使用した確定後状態、Narrative材料、過去Turn、Player Inputを編集可能なテストケースとして読み込みます。</p>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label>Session ID<Input aria-label="インポートするSession ID" value={sessionId} onChange={(event) => setSessionId(event.target.value)} placeholder="SES-..." /></label>
        <label>Turn ID<Input aria-label="インポートするTurn ID" value={turnId} onChange={(event) => setTurnId(event.target.value)} placeholder="TRN-..." /></label>
        <Button variant="secondary" size="sm" disabled={working || !sessionId.trim() || !turnId.trim()} onClick={() => void importTurn()}>インポート</Button>
      </div>
    </section>

    <section className="grid gap-4 rounded-2xl border border-[#17151f]/15 bg-white/60 p-4" aria-label="過去Turn編集">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3>それまでのTurn</h3><Button variant="secondary" size="sm" onClick={() => setRecentTurns((current) => [...current, { playerInput: '', narrative: '' }])}>Turnを追加</Button></div>
      {recentTurns.length === 0 && <p className="text-sm text-myr-ink-subtle">過去Turnなし。追加またはインポートできます。</p>}
      {recentTurns.map((turn, index) => <article key={index} className="grid gap-2 border-t border-[#17151f]/10 pt-3">
        <div className="flex items-center justify-between"><strong>Turn {index + 1}</strong><Button variant="text" size="sm" onClick={() => setRecentTurns((current) => current.filter((_, turnIndex) => turnIndex !== index))}>削除</Button></div>
        <label>Player Input<Textarea aria-label={`Turn ${index + 1} Player Input`} value={turn.playerInput ?? ''} onChange={(event) => updateTurn(index, { playerInput: event.target.value })} /></label>
        <label>Narrative<Textarea aria-label={`Turn ${index + 1} Narrative`} value={turn.narrative ?? ''} onChange={(event) => updateTurn(index, { narrative: event.target.value })} /></label>
      </article>)}
      <label>今回のPlayer Input<Textarea aria-label="NarrativeテストのPlayer Input" value={playerInput} onChange={(event) => setPlayerInput(event.target.value)} /></label>
    </section>

    <section className="grid gap-3 rounded-2xl border border-[#17151f]/15 bg-white/60 p-4" aria-label="状態とNarrative材料">
      <h3>状態とNarrative材料</h3>
      <p className="text-sm text-myr-ink-subtle">確定後の場所・Entity state・flags、選択Action、facts、events、hints、禁止情報を自由に編集できます。</p>
      <Textarea className="!min-h-[28rem] font-mono text-xs" aria-label="Narrativeテスト状態JSON" value={contextJson} onChange={(event) => setContextJson(event.target.value)} />
      <Button variant="primary" disabled={working || !playerInput.trim()} onClick={() => void compare()}>{working ? '比較生成中…' : '公開版と未保存ドラフトを比較'}</Button>
    </section>

    {actions.runAiEvaluation && <section className="grid gap-4 rounded-2xl border border-[#5c4f8f]/30 bg-[#f8f5ff] p-5" aria-label="AIモデルブラインド比較">
      <div><p className="text-xs font-black uppercase tracking-[0.14em] text-[#5c4f8f]">Model evaluation</p><h3>同じケースを複数AIで反復比較</h3><p className="text-sm text-myr-ink-subtle">Profile IDを改行区切りで指定します。モデル名は結果本文ではBlind codeとして扱い、厳格なルール判定・latency・tokenを保存します。</p></div>
      <div className="grid gap-3 md:grid-cols-[1fr_10rem_auto] md:items-end">
        <label>AI Profile IDs<Textarea aria-label="比較するAI Profile IDs" className="!min-h-28 font-mono text-xs" value={profileIds} onChange={(event) => setProfileIds(event.target.value)} /></label>
        <label>反復回数<Input aria-label="AI比較の反復回数" type="number" min={1} max={10} value={repetitions} onChange={(event) => setRepetitions(Math.max(1, Math.min(10, Number(event.target.value))))} /></label>
        <Button variant="primary" disabled={working || !playerInput.trim() || !profileIds.trim()} onClick={() => void runEvaluation()}>{working ? '比較実行中…' : 'ブラインド比較を実行'}</Button>
      </div>
      <p className="text-xs text-myr-ink-subtle">固定条件: temperature 0.8 / top_p 0.95 / repetition penalty 1.05 / seed 42 / 1200 tokens / thinking off / retry 0</p>
      {evaluation && <div className="grid gap-3" data-testid="ai-evaluation-result">
        <div className="flex flex-wrap items-center justify-between gap-3"><strong>{evaluation.summary.passedAttemptCount} / {evaluation.summary.attemptCount} attempts passed</strong><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => void exportEvaluation('json')}>JSON export</Button><Button size="sm" variant="secondary" onClick={() => void exportEvaluation('csv')}>CSV export</Button></div></div>
        <div className="grid gap-3 lg:grid-cols-2">{evaluation.cases.flatMap((item) => item.attempts).map((attempt) => <article key={attempt.id} className="rounded-xl border border-[#17151f]/15 bg-white p-4"><div className="flex items-center justify-between gap-2"><strong>{attempt.blindCode}</strong><span className={attempt.passed ? 'text-emerald-700' : 'text-red-700'}>{attempt.passed ? 'PASS' : 'FAIL'}</span></div><p className="text-xs text-myr-ink-subtle">{attempt.latencyMilliseconds ?? '-'}ms / in {attempt.inputTokens ?? '-'} / out {attempt.outputTokens ?? '-'}</p><p className="mt-2 text-xs">{attempt.labels.join(' · ')}</p></article>)}</div>
      </div>}
    </section>}

    {result && <section className="grid gap-4 xl:grid-cols-2" aria-label="Narrative比較結果" data-testid="narrative-comparison">
      {([['公開版', result.published], ['未保存ドラフト', result.draft]] as const).map(([label, narrative]) => <article key={label} className="grid content-start gap-3 rounded-2xl border border-[#17151f]/15 bg-white/75 p-5">
        <div><p className="text-xs font-black uppercase tracking-[0.14em] text-[#5c4f8f]">{label}</p><h3>{narrative.heading}</h3><p className="text-xs text-myr-ink-subtle">同一AI: {narrative.model} / {narrative.latencyMilliseconds}ms</p></div>
        <NarrativeBody body={narrative.body} />
      </article>)}
    </section>}
  </section>;
}
