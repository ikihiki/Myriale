import { useState } from 'react';
import { Button, Input, Notice, Panel, Textarea } from '../../../components/ui';
import type { CreateEvaluationSessionInput, EvaluationSession } from '../api/evaluationsApi';
import { EvaluationPageFrame } from '../shared/EvaluationPageFrame';
import type { EvaluationAccount, EvaluationCommand } from '../shared/evaluationPageModel';
export function EvaluationCreatePresentation({ account, initialScenarioId = '', creating, onCreate, onNavigate, onLogout }: { account: EvaluationAccount; initialScenarioId?: string; creating: boolean; onCreate: (input: CreateEvaluationSessionInput) => Promise<EvaluationCommand<EvaluationSession>>; onNavigate: Parameters<typeof EvaluationPageFrame>[0]['onNavigate']; onLogout: () => void | Promise<void> }) {
  const [name, setName] = useState(initialScenarioId ? 'シナリオからの評価' : ''); const [description, setDescription] = useState(''); const [notice, setNotice] = useState('Draftとして保存されます。作成後に状況・候補・rubricを設定できます。');
  const submit = async () => { if (!name.trim()) { setNotice('評価名を入力してください。'); return; } const result = await onCreate({ name: name.trim(), description: description.trim() || undefined, sourceScenarioId: initialScenarioId || undefined }); setNotice(result.message); };
  return <EvaluationPageFrame account={account} title="評価を新規作成" kicker="Create a durable draft" description="Scenarioから独立した評価セッションを作成します。" onNavigate={onNavigate} onLogout={onLogout}>
    <Panel as="section" className="grid max-w-3xl gap-5"><Notice tone={notice.includes('入力') || notice.includes('できません') ? 'danger' : 'info'} data-testid="evaluation-create-notice">{notice}</Notice>
      <label>評価名<Input aria-label="評価名" value={name} onChange={(event) => setName(event.target.value)} placeholder="例: Narrative候補 2026-08" /></label>
      <label>目的と判断メモ<Textarea aria-label="評価の説明" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="何を比較し、どの判断に使うか" /></label>
      {initialScenarioId && <Notice tone="info">Scenario {initialScenarioId} を引用pickerの初期候補にします。評価自体はScenarioに所属しません。</Notice>}
      <div className="flex gap-3"><Button disabled={creating || !name.trim()} onClick={() => void submit()}>{creating ? '作成中…' : 'Draftを作成してセットアップへ'}</Button><Button variant="secondary" onClick={() => onNavigate('evaluationList')}>キャンセル</Button></div>
    </Panel>
  </EvaluationPageFrame>;
}
