import { useEffect, useState } from "react";
import type {
  EvaluationExport,
  EvaluationResponseDetail,
  EvaluationResults,
  EvaluationSession,
  EvaluationsApi,
} from "../api/evaluationsApi";
import type { LoadState } from "../shared/evaluationPageModel";
import { useEvaluationContainer } from "../shared/useEvaluationContainer";
import { EvaluationResultsPresentation } from "./EvaluationResultsPresentation";

type Data = {
  session: EvaluationSession;
  results: EvaluationResults;
  exports: EvaluationExport[];
};

export function EvaluationResultsContainer({
  evaluationId,
  api,
}: {
  evaluationId: string;
  api?: EvaluationsApi;
}) {
  const context = useEvaluationContainer(api);
  const [state, setState] = useState<LoadState<Data>>({ status: "loading" });
  const [response, setResponse] =
    useState<LoadState<EvaluationResponseDetail> | null>(null);
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      context.api.getSession(evaluationId, controller.signal),
      context.api.getResults(evaluationId, controller.signal),
    ])
      .then(([session, results]) =>
        setState({ status: "ready", data: { session, results, exports: [] } }),
      )
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "結果を取得できませんでした。",
          });
      });
    return () => controller.abort();
  }, [context.api, evaluationId, reload]);

  const nav = (
    key: Parameters<NonNullable<typeof context.navigate>>[0],
    options?: Parameters<NonNullable<typeof context.navigate>>[1],
  ) => context.navigate?.(key, options);
  return (
    <EvaluationResultsPresentation
      account={context.account}
      evaluationId={evaluationId}
      state={state}
      response={response}
      busy={busy}
      onOpenResponse={(id) => {
        setResponse({ status: "loading" });
        void context.api
          .getResponse(id)
          .then((data) => setResponse({ status: "ready", data }))
          .catch((error: unknown) =>
            setResponse({
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Responseを取得できませんでした。",
            }),
          );
      }}
      onExport={async (format) => {
        setBusy(true);
        try {
          const value = await context.api.createExport(evaluationId, format);
          setState((current) =>
            current.status === "ready"
              ? {
                  status: "ready",
                  data: {
                    ...current.data,
                    exports: [value, ...current.data.exports],
                  },
                }
              : current,
          );
          return {
            ok: true,
            message: `${format.toUpperCase()} exportを作成しました。Downloadリンクから保存してください。`,
            value,
          };
        } catch (error) {
          return {
            ok: false,
            message:
              error instanceof Error
                ? error.message
                : "Exportを作成できませんでした。",
          };
        } finally {
          setBusy(false);
        }
      }}
      onRetry={() => setReload((value) => value + 1)}
      onNavigate={nav}
      onLogout={context.logout}
    />
  );
}
