import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Input,
  Notice,
  Panel,
  Textarea,
} from "../../../components/ui";
import { MyrialeSelect } from "../../../ui/MyrialeRadix";
import type {
  AddCandidateInput,
  AddQuotedSituationInput,
  EvaluationCorpus,
  EvaluationSession,
  QuoteBrowser,
} from "../api/evaluationsApi";
import { EvaluationPageFrame } from "../shared/EvaluationPageFrame";
import { EvaluationLoadState } from "../shared/EvaluationLoadState";
import type {
  EvaluationAccount,
  EvaluationCommand,
  LoadState,
} from "../shared/evaluationPageModel";
type SetupData = {
  session: EvaluationSession;
  corpora: EvaluationCorpus[];
  quotes: QuoteBrowser;
};
export type SetupActions = {
  addFixed: (
    corpusId: string,
    version: string,
    caseIds: string[],
  ) => Promise<EvaluationCommand<EvaluationSession>>;
  addQuoted: (
    input: AddQuotedSituationInput,
  ) => Promise<EvaluationCommand<EvaluationSession>>;
  removeSituation: (id: string) => Promise<EvaluationCommand>;
  addCandidate: (
    input: AddCandidateInput,
  ) => Promise<EvaluationCommand<EvaluationSession>>;
  saveDesign: (
    reviewPolicy: EvaluationSession["reviewPolicy"],
    rubric: EvaluationSession["rubric"],
  ) => Promise<EvaluationCommand<EvaluationSession>>;
};
export function EvaluationSetupPresentation({
  account,
  evaluationId,
  state,
  busy,
  actions,
  onRetry,
  onNavigate,
  onLogout,
}: {
  account: EvaluationAccount;
  evaluationId: string;
  state: LoadState<SetupData>;
  busy: boolean;
  actions: SetupActions;
  onRetry: () => void;
  onNavigate: Parameters<typeof EvaluationPageFrame>[0]["onNavigate"];
  onLogout: () => void | Promise<void>;
}) {
  const [notice, setNotice] = useState(
    "固定ケースまたはSessionのturn/stageを引用し、実行前にimmutable snapshotへ固定します。",
  );
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [profileId, setProfileId] = useState("");
  const [candidateLabel, setCandidateLabel] = useState("");
  const [repetitions, setRepetitions] = useState(1);
  const [scenarioId, setScenarioId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [turnId, setTurnId] = useState("");
  const [stage, setStage] =
    useState<AddQuotedSituationInput["stage"]>("narrative");
  const [quoteLabel, setQuoteLabel] = useState("");
  const [policy, setPolicy] =
    useState<EvaluationSession["reviewPolicy"]>("double-blind");
  const [rubricText, setRubricText] = useState(
    "Narrative quality|物語としての完成度\nInstruction fidelity|状況と指示への忠実さ\nSafety and continuity|安全性と連続性",
  );
  const quoteScenario = useMemo(
    () =>
      state.status === "ready"
        ? state.data.quotes.scenarios.find((x) => x.id === scenarioId)
        : undefined,
    [state, scenarioId],
  );
  const quoteSession = quoteScenario?.sessions.find((x) => x.id === sessionId);
  const quoteTurn = quoteSession?.turns.find((x) => x.id === turnId);
  const preview = quoteTurn?.stages.find((x) => x.stage === stage);
  return (
    <EvaluationPageFrame
      account={account}
      evaluationId={evaluationId}
      activeTab="setup"
      title={
        state.status === "ready"
          ? `${state.data.session.name} — セットアップ`
          : "評価セットアップ"
      }
      kicker="Freeze inputs before execution"
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <EvaluationLoadState state={state} onRetry={onRetry}>
        {(data) => (
          <div className="grid gap-6">
            <Notice
              tone={
                notice.includes("できません") || notice.includes("選択")
                  ? "danger"
                  : "info"
              }
              data-testid="evaluation-setup-notice"
            >
              {notice}
            </Notice>
            <Panel as="section" className="grid gap-4">
              <div>
                <p className="kicker m-0">Fixed corpus</p>
                <h2 className="m-0">固定ケースから追加</h2>
              </div>
              {data.corpora.map((corpus) => (
                <article
                  key={`${corpus.id}-${corpus.version}`}
                  className="grid gap-3 rounded-xl border border-myr-ink/15 p-4"
                >
                  <div>
                    <strong>{corpus.name}</strong>
                    <p className="m-0 text-sm text-myr-ink-subtle">
                      Version {corpus.version} · {corpus.description}
                    </p>
                  </div>
                  {corpus.cases.map((item) => (
                    <label key={item.id} className="flex gap-3">
                      <input
                        type="checkbox"
                        checked={selectedCases.includes(item.id)}
                        onChange={(e) =>
                          setSelectedCases((v) =>
                            e.target.checked
                              ? [...v, item.id]
                              : v.filter((id) => id !== item.id),
                          )
                        }
                      />
                      <span>
                        <strong>{item.label}</strong>
                        <small className="block text-myr-ink-subtle">
                          {item.stage} · {item.preview}
                        </small>
                      </span>
                    </label>
                  ))}
                  <Button
                    className="w-fit"
                    disabled={busy || selectedCases.length === 0}
                    onClick={() =>
                      void actions
                        .addFixed(corpus.id, corpus.version, selectedCases)
                        .then((r) => setNotice(r.message))
                    }
                  >
                    選択した固定ケースを追加
                  </Button>
                </article>
              ))}
            </Panel>
            <Panel as="section" className="grid gap-4">
              <div>
                <p className="kicker m-0">Quoted session snapshot</p>
                <h2 className="m-0">セッションから引用</h2>
                <p className="text-sm text-myr-ink-subtle">
                  Scenario → Session → Turn timeline → stage preview →
                  引用して固定
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <MyrialeSelect
                  label="Scenario"
                  value={scenarioId}
                  onValueChange={(v) => {
                    setScenarioId(v);
                    setSessionId("");
                    setTurnId("");
                  }}
                  options={data.quotes.scenarios.map((x) => ({
                    value: x.id,
                    label: x.title,
                  }))}
                />
                <MyrialeSelect
                  label="Session"
                  value={sessionId}
                  onValueChange={(v) => {
                    setSessionId(v);
                    setTurnId("");
                  }}
                  options={(quoteScenario?.sessions ?? []).map((x) => ({
                    value: x.id,
                    label: x.title,
                  }))}
                />
                <MyrialeSelect
                  label="Turn"
                  value={turnId}
                  onValueChange={setTurnId}
                  options={(quoteSession?.turns ?? []).map((x) => ({
                    value: x.id,
                    label: `Turn ${x.index}`,
                  }))}
                />
                <MyrialeSelect
                  label="Stage"
                  value={stage}
                  onValueChange={(v) => setStage(v as typeof stage)}
                  options={(quoteTurn?.stages ?? []).map((x) => ({
                    value: x.stage,
                    label: x.label,
                  }))}
                />
              </div>
              {preview && (
                <Notice tone="info">
                  <strong>{preview.label}</strong>
                  <br />
                  {preview.preview}
                </Notice>
              )}
              <label>
                引用ラベル
                <Input
                  aria-label="引用ラベル"
                  value={quoteLabel}
                  onChange={(e) => setQuoteLabel(e.target.value)}
                />
              </label>
              <Button
                className="w-fit"
                disabled={
                  busy || !scenarioId || !sessionId || !turnId || !preview
                }
                onClick={() =>
                  void actions
                    .addQuoted({
                      scenarioId,
                      sessionId,
                      turnId,
                      interactionId: preview!.interactionId,
                      stage,
                      label:
                        quoteLabel ||
                        `${quoteScenario?.title} Turn ${quoteTurn?.index}`,
                    })
                    .then((r) => setNotice(r.message))
                }
              >
                引用して固定
              </Button>
            </Panel>
            <Panel as="section" className="grid gap-4">
              <div>
                <p className="kicker m-0">Candidates</p>
                <h2 className="m-0">評価候補を追加</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_8rem_auto]">
                <label>
                  表示名
                  <Input
                    aria-label="候補の表示名"
                    value={candidateLabel}
                    onChange={(e) => setCandidateLabel(e.target.value)}
                  />
                </label>
                <label>
                  AI Profile ID
                  <Input
                    aria-label="候補のAI Profile ID"
                    value={profileId}
                    onChange={(e) => setProfileId(e.target.value)}
                  />
                </label>
                <label>
                  反復回数
                  <Input
                    aria-label="候補の反復回数"
                    type="number"
                    min={1}
                    max={20}
                    value={repetitions}
                    onChange={(e) => setRepetitions(Number(e.target.value))}
                  />
                </label>
                <Button
                  className="self-end"
                  disabled={busy || !profileId.trim()}
                  onClick={() =>
                    void actions
                      .addCandidate({
                        label: candidateLabel || profileId,
                        profileId,
                        profileRevision: 1,
                        repetitions,
                        generation: {
                          temperature: 0.8,
                          maxOutputTokens: 1200,
                          seed: 42,
                          thinkingEnabled: false,
                        },
                      })
                      .then((r) => setNotice(r.message))
                  }
                >
                  候補を追加
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.session.candidates.map((c) => (
                  <Badge key={c.id} tone="info">
                    {c.label} × {c.repetitions}
                  </Badge>
                ))}
              </div>
            </Panel>
            <Panel as="section" className="grid gap-4">
              <h2 className="m-0">Human rubricとreview policy</h2>
              <MyrialeSelect
                label="Review policy"
                value={policy}
                onValueChange={(v) => setPolicy(v as typeof policy)}
                options={[
                  { value: "none", label: "Machine only" },
                  { value: "single", label: "Single blind" },
                  { value: "double-blind", label: "Double blind" },
                ]}
              />
              <label>
                Rubric（1行: ラベル|説明）
                <Textarea
                  aria-label="Human rubric"
                  value={rubricText}
                  onChange={(e) => setRubricText(e.target.value)}
                />
              </label>
              <Button
                className="w-fit"
                disabled={busy}
                onClick={() => {
                  const rubric = rubricText
                    .split("\n")
                    .filter(Boolean)
                    .map((line, index) => {
                      const [label, description = ""] = line.split("|");
                      return {
                        id: `criterion-${index + 1}`,
                        label: label.trim(),
                        description: description.trim(),
                        scaleMin: 1,
                        scaleMax: 5,
                        weight: 1,
                        required: true,
                      };
                    });
                  void actions
                    .saveDesign(policy, rubric)
                    .then((r) => setNotice(r.message));
                }}
              >
                Rubricを保存
              </Button>
            </Panel>
            <Panel as="section">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2>現在のsnapshot</h2>
                  <p>
                    {data.session.situations.length} situations /{" "}
                    {data.session.candidates.length} candidates
                  </p>
                </div>
                <Button
                  onClick={() =>
                    onNavigate("evaluationOverview", { evaluationId })
                  }
                >
                  概要で開始条件を確認
                </Button>
              </div>
              {data.session.situations.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 border-t border-myr-ink/10 py-3"
                >
                  <span>
                    <strong>{s.label}</strong>
                    <small className="block text-myr-ink-subtle">
                      {s.sourceLabel} · {s.snapshotHash}
                    </small>
                  </span>
                  <Button
                    size="sm"
                    variant="text"
                    disabled={busy}
                    onClick={() =>
                      void actions
                        .removeSituation(s.id)
                        .then((r) => setNotice(r.message))
                    }
                  >
                    削除
                  </Button>
                </div>
              ))}
            </Panel>
          </div>
        )}
      </EvaluationLoadState>
    </EvaluationPageFrame>
  );
}
