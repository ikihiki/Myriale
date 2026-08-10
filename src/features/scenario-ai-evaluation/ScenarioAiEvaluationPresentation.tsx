import { useEffect, useState } from 'react';
import type { AppChromeAccount } from '../../account/accountPresentation';
import type { ScenarioAiEvaluationRun } from '../../app/scenarioApi';
import { Badge, Button, Input, Label, Notice, PageCanvas, PageShell, Panel, Textarea } from '../../components/ui';
import { AppChrome, type Crumb } from '../../shared/AppChrome';
import type { ScenarioAiEvaluationActions, ScenarioAiEvaluationState } from './scenarioAiEvaluationModel';

type Props = {
  account: AppChromeAccount | null;
  scenarioId: string;
  state: ScenarioAiEvaluationState;
  actions: ScenarioAiEvaluationActions;
};

const capabilityName = (metadata: Record<string, unknown>) => {
  const label = metadata.capabilityLabel;
  if (label === 'adult_consensual_erotic_expression') return '成人同士の合意ある官能表現';
  if (label === 'graphic_violence') return 'グロ・身体損壊表現';
  return typeof label === 'string' ? label : 'Narrative評価';
};

function RunResult({ run, onExport }: { run: ScenarioAiEvaluationRun; onExport: (format: 'json' | 'csv') => void }) {
  return <Panel as="section" className="grid gap-4" aria-label="Corpus評価結果" data-testid="corpus-evaluation-result">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="m-0 text-xs font-black uppercase tracking-widest text-[#5c4f8f]">Completed run</p><Label as="h2" textRole="sectionEditorial" className="m-0 !text-3xl">{run.summary.passedAttemptCount} / {run.summary.attemptCount} passed</Label><p className="m-0 text-sm text-myr-ink-subtle">Corpus {run.summary.corpusVersion} · {run.summary.caseCount} cases · {run.summary.repetitions} repetitions</p></div>
      <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => onExport('json')}>JSON export</Button><Button variant="secondary" size="sm" onClick={() => onExport('csv')}>CSV export</Button></div>
    </div>
    <div className="grid gap-3 lg:grid-cols-2">{run.cases.flatMap((testCase) => testCase.attempts.map((attempt) => <article key={attempt.id} className="grid gap-2 rounded-xl border border-[#17151f]/15 bg-white p-4"><div className="flex items-center justify-between gap-3"><div><strong>{attempt.blindCode}</strong><p className="m-0 font-mono text-xs text-myr-ink-subtle">{testCase.caseId}</p></div><Badge tone={attempt.passed ? 'success' : 'danger'}>{attempt.passed ? 'PASS' : 'FAIL'}</Badge></div><p className="m-0 text-xs text-myr-ink-subtle">{attempt.latencyMilliseconds ?? '-'}ms · in {attempt.inputTokens ?? '-'} · out {attempt.outputTokens ?? '-'}</p><p className="m-0 break-words text-xs">{attempt.labels.join(' · ')}</p></article>))}</div>
  </Panel>;
}

export function ScenarioAiEvaluationPresentation({ account, scenarioId, state, actions }: Props) {
  const manifest = state.status === 'ready' ? state.manifest : null;
  const recentRuns = state.status === 'ready' ? state.recentRuns : [];
  const [profileIds, setProfileIds] = useState('runpod-eval-skyfall-v42\nrunpod-eval-deckard-40b\nrunpod-eval-goetia-v12\nrunpod-eval-deckard-27b\nrunpod-eval-skyfall-heretic');
  const [repetitions, setRepetitions] = useState(1);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState('Versioned Corpusをサーバー正本のまま実行します。最初は各ケース1回の小規模評価を推奨します。');
  const [run, setRun] = useState<ScenarioAiEvaluationRun | null>(null);

  useEffect(() => {
    if (manifest) setSelectedCaseIds(manifest.cases.map((item) => item.caseId));
  }, [manifest]);

  const execute = async () => {
    const ids = profileIds.split(/\s|,/).map((item) => item.trim()).filter(Boolean);
    if (!ids.length || !selectedCaseIds.length) return;
    setWorking(true);
    try {
      const result = await actions.runCorpus(ids, repetitions, selectedCaseIds);
      setNotice(result.message);
      if (result.value) setRun(result.value);
    } finally { setWorking(false); }
  };
  const exportRun = async (format: 'json' | 'csv') => {
    if (!run) return;
    const result = await actions.exportRun(run.summary.id, format); setNotice(result.message);
  };
  const crumbs: Crumb[] = [{ label: 'Myriale', to: 'home' }, { label: 'ライブラリ', to: 'scenarioList' }, { label: state.status === 'ready' ? state.scenarioTitle : scenarioId }, { label: 'AI Corpus評価' }];

  return <AppChrome section="library" breadcrumbs={crumbs} account={account} onLogout={actions.logout}><PageCanvas data-myriale-theme="archive"><PageShell width="chrome" className="gap-7" aria-label="AI Corpus評価">
    <header className="grid gap-4 border-b border-[#17151f]/15 pb-6"><Button variant="secondary" className="w-fit" onClick={actions.backToScenario}>← シナリオ編集へ戻る</Button><div><p className="kicker m-0 text-[#5c4f8f]">Server-authoritative model evaluation</p><Label as="h1" textRole="sectionEditorial" className="m-0">AI Corpus評価</Label><p className="m-0 max-w-3xl leading-7 text-myr-ink-subtle">ケース本文、Corpus ID、version、生成条件は専用APIが埋め込みmanifestから確定します。クライアントはProfile、反復回数、実行ケースだけを選択します。</p></div><Notice tone={notice.includes('できません') || notice.includes('invalid') ? 'danger' : 'info'} data-testid="corpus-evaluation-notice">{notice}</Notice></header>
    {state.status === 'loading' && <Notice tone="info">評価Corpusを読み込んでいます。</Notice>}
    {state.status === 'error' && <div className="grid gap-3"><Notice tone="danger" role="alert">{state.message}</Notice><Button variant="secondary" className="w-fit" onClick={actions.retry}>もう一度読み込む</Button></div>}
    {manifest && <>
      <Panel as="section" className="grid gap-4" aria-label="Corpus概要"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="m-0 text-xs font-black uppercase tracking-widest text-[#5c4f8f]">{manifest.corpusId}</p><Label as="h2" textRole="sectionEditorial" className="m-0 !text-3xl">Version {manifest.version}</Label></div><Badge tone="info">{manifest.cases.length} executable cases</Badge></div><p className="m-0 text-sm leading-6 text-myr-ink-subtle">{manifest.description}</p><div className="grid gap-2 sm:grid-cols-3">{manifest.stages.map((stage) => <div key={stage.stage} className="rounded-xl border border-[#17151f]/15 bg-white/70 p-3"><strong>{stage.stage}</strong><p className="m-0 text-sm text-myr-ink-subtle">計画 {stage.plannedCaseCount} cases × {stage.plannedRepetitions}</p></div>)}</div></Panel>
      <Panel as="section" className="grid gap-5" aria-label="Corpus実行設定">
        <div><Label as="h2" textRole="sectionEditorial" className="m-0 !text-3xl">実行するケースとモデル</Label><p className="m-0 text-sm text-myr-ink-subtle">Endpointを起動してから実行してください。完了後はworkersMaxを0へ戻します。</p></div>
        <fieldset className="grid gap-3"><legend className="font-black">Corpus cases</legend>{manifest.cases.map((testCase) => { const checked = selectedCaseIds.includes(testCase.caseId); return <label key={testCase.caseId} className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#17151f]/15 bg-white/70 p-4"><input type="checkbox" checked={checked} onChange={() => setSelectedCaseIds((current) => checked ? current.filter((id) => id !== testCase.caseId) : [...current, testCase.caseId])} /><span><strong>{capabilityName(testCase.metadata)}</strong><span className="block font-mono text-xs text-myr-ink-subtle">{testCase.caseId}</span></span></label>; })}</fieldset>
        <div className="grid gap-4 md:grid-cols-[1fr_10rem]"><label>AI Profile IDs<Textarea aria-label="Corpus評価するAI Profile IDs" className="!min-h-40 font-mono text-xs" value={profileIds} onChange={(event) => setProfileIds(event.target.value)} /></label><label>反復回数<Input aria-label="Corpus評価の反復回数" type="number" min={1} max={10} value={repetitions} onChange={(event) => setRepetitions(Math.max(1, Math.min(10, Number(event.target.value))))} /></label></div>
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="m-0 text-sm text-myr-ink-subtle">予定 attempts: {profileIds.split(/\s|,/).filter(Boolean).length * selectedCaseIds.length * repetitions}</p><Button variant="primary" disabled={working || !profileIds.trim() || selectedCaseIds.length === 0} onClick={() => void execute()}>{working ? 'Corpus評価実行中…' : '選択したCorpusを実行'}</Button></div>
      </Panel>
      {run && <RunResult run={run} onExport={(format) => void exportRun(format)} />}
      {recentRuns.length > 0 && <Panel as="section" className="grid gap-3" aria-label="最近のCorpus評価"><Label as="h2" textRole="sectionEditorial" className="m-0 !text-3xl">最近の評価run</Label>{recentRuns.slice(0, 5).map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-[#17151f]/10 pt-3"><div><strong>{item.id}</strong><p className="m-0 text-xs text-myr-ink-subtle">Corpus {item.corpusVersion} · {item.caseCount} cases · {item.attemptCount} attempts</p></div><Badge tone={item.passedAttemptCount === item.attemptCount ? 'success' : 'warning'}>{item.passedAttemptCount}/{item.attemptCount}</Badge></div>)}</Panel>}
    </>}
  </PageShell></PageCanvas></AppChrome>;
}
