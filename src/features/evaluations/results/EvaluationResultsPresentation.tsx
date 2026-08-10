import { useState } from "react";
import { Badge, Button, Notice, Panel } from "../../../components/ui";
import type {
  EvaluationExport,
  EvaluationResponseDetail,
  EvaluationResults,
  EvaluationSession,
} from "../api/evaluationsApi";
import { EvaluationPageFrame } from "../shared/EvaluationPageFrame";
import { EvaluationLoadState } from "../shared/EvaluationLoadState";
import type {
  EvaluationAccount,
  EvaluationCommand,
  LoadState,
} from "../shared/evaluationPageModel";
type Data = {
  session: EvaluationSession;
  results: EvaluationResults;
  exports: EvaluationExport[];
};
export function EvaluationResultsPresentation({
  account,
  evaluationId,
  state,
  response,
  busy,
  onOpenResponse,
  onExport,
  onRetry,
  onNavigate,
  onLogout,
}: {
  account: EvaluationAccount;
  evaluationId: string;
  state: LoadState<Data>;
  response: LoadState<EvaluationResponseDetail> | null;
  busy: boolean;
  onOpenResponse: (id: string) => void;
  onExport: (
    format: EvaluationExport["format"],
  ) => Promise<EvaluationCommand<EvaluationExport>>;
  onRetry: () => void;
  onNavigate: Parameters<typeof EvaluationPageFrame>[0]["onNavigate"];
  onLogout: () => void | Promise<void>;
}) {
  const [notice, setNotice] = useState(
    "Aggregate revisionはsource judgmentsのwatermarkとalgorithm versionから再生成されます。",
  );
  return (
    <EvaluationPageFrame
      account={account}
      evaluationId={evaluationId}
      activeTab="results"
      title={
        state.status === "ready"
          ? `${state.data.session.name} — 結果`
          : "評価結果"
      }
      kicker="Aggregates and audit drill-down"
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <EvaluationLoadState state={state} onRetry={onRetry}>
        {({ results, exports }) => (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Notice tone="info">{notice}</Notice>
              <div className="flex gap-2">
                {(["json", "csv"] as const).map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      void onExport(f).then((r) => setNotice(r.message))
                    }
                  >
                    {f.toUpperCase()} export
                  </Button>
                ))}
              </div>
            </div>
            <Panel as="section" className="overflow-x-auto">
              <div className="flex justify-between">
                <h2>Candidate × rubric matrix</h2>
                <Badge
                  tone={results.identitiesRevealed ? "success" : "warning"}
                >
                  {results.identitiesRevealed
                    ? "identity revealed"
                    : "identity hidden"}
                </Badge>
              </div>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="p-2">Candidate</th>
                    {Object.keys(
                      results.candidateMatrix[0]?.rubricScores ?? {},
                    ).map((k) => (
                      <th className="p-2" key={k}>
                        {k}
                      </th>
                    ))}
                    <th className="p-2">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {results.candidateMatrix.map((row) => (
                    <tr
                      key={row.candidateId}
                      className="border-t border-myr-ink/10"
                    >
                      <td className="p-2 font-bold">
                        {results.identitiesRevealed
                          ? row.candidateLabel
                          : row.candidateCode}
                      </td>
                      {Object.values(row.rubricScores).map((v, i) => (
                        <td className="p-2" key={i}>
                          {v.toFixed(2)}
                        </td>
                      ))}
                      <td className="p-2 font-black">
                        {row.overall.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel as="section">
                <h2>Machine / human / agreement</h2>
                {results.distributions.map((x) => (
                  <p key={x.label}>
                    <strong>{x.label}</strong>
                    <br />
                    <small>
                      machine {x.machineAverage.toFixed(2)} / human{" "}
                      {x.humanAverage?.toFixed(2) ?? "—"} / agreement{" "}
                      {x.agreement?.toFixed(2) ?? "—"}
                    </small>
                  </p>
                ))}
              </Panel>
              <Panel as="section">
                <h2>Failure clusters</h2>
                {results.failureClusters.map((x) => (
                  <p key={x.label} className="flex justify-between">
                    <span>{x.label}</span>
                    <strong>{x.count}</strong>
                  </p>
                ))}
              </Panel>
              <Panel as="section">
                <h2>Cost / latency</h2>
                {results.operations.map((x) => (
                  <p key={x.candidateLabel}>
                    <strong>{x.candidateLabel}</strong>
                    <br />
                    <small>
                      {x.averageLatencyMilliseconds}ms avg / $
                      {x.totalCostUsd.toFixed(4)}
                    </small>
                  </p>
                ))}
              </Panel>
              <Panel as="section">
                <h2>Situation matrix</h2>
                {results.situationMatrix.map((x) => (
                  <p key={x.situationId}>
                    <strong>{x.situationLabel}</strong>
                    <br />
                    <small>
                      {Object.entries(x.scores)
                        .map(([k, v]) => `${k}: ${v.toFixed(2)}`)
                        .join(" · ")}
                    </small>
                  </p>
                ))}
              </Panel>
            </div>
            <Panel as="section" className="grid gap-3">
              <h2 className="m-0">Response drill-down</h2>
              {results.responses.map((x) => (
                <button
                  type="button"
                  key={x.id}
                  className="flex cursor-pointer justify-between gap-3 rounded-xl border border-myr-ink/10 bg-white p-3 text-left"
                  onClick={() => onOpenResponse(x.id)}
                >
                  <span>
                    <strong>{x.situationLabel}</strong>
                    <small className="block">
                      {results.identitiesRevealed
                        ? x.candidateLabel
                        : x.candidateCode}
                    </small>
                  </span>
                  <span>{x.humanScore ?? x.machineScore ?? "—"}</span>
                </button>
              ))}
              {response?.status === "loading" && (
                <Notice tone="info">Responseを読み込んでいます。</Notice>
              )}
              {response?.status === "error" && (
                <Notice tone="danger">{response.message}</Notice>
              )}
              {response?.status === "ready" && (
                <article
                  className="grid gap-3 rounded-xl bg-myr-ink p-5 text-myr-paper"
                  data-testid="response-drilldown"
                >
                  <div className="flex justify-between">
                    <strong>{response.data.situationLabel}</strong>
                    <Badge tone="neutral">{response.data.candidateCode}</Badge>
                  </div>
                  <p className="whitespace-pre-wrap leading-7">
                    {response.data.output}
                  </p>
                  <small>
                    {response.data.latencyMilliseconds ?? "—"}ms · in{" "}
                    {response.data.inputTokens ?? "—"} / out{" "}
                    {response.data.outputTokens ?? "—"} · $
                    {response.data.costUsd?.toFixed(4) ?? "—"}
                  </small>
                </article>
              )}
            </Panel>
            {exports.length > 0 && (
              <Panel as="section">
                <h2>Exports</h2>
                {exports.map((x) => (
                  <p key={x.id}>
                    {x.format.toUpperCase()} · {x.status}
                    {x.downloadUrl && (
                      <>
                        {" "}
                        · <a href={x.downloadUrl}>download</a>
                      </>
                    )}
                  </p>
                ))}
              </Panel>
            )}
          </div>
        )}
      </EvaluationLoadState>
    </EvaluationPageFrame>
  );
}
