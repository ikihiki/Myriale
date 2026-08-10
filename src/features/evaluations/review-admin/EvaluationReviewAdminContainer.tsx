import { useEffect, useState } from "react";
import type {
  EvaluationsApi,
  EvaluationReviewBatch,
  EvaluationSession,
} from "../api/evaluationsApi";
import type { LoadState } from "../shared/evaluationPageModel";
import { useEvaluationContainer } from "../shared/useEvaluationContainer";
import { EvaluationReviewAdminPresentation } from "./EvaluationReviewAdminPresentation";
type Data = { session: EvaluationSession; batches: EvaluationReviewBatch[] };
export function EvaluationReviewAdminContainer({
  evaluationId,
  api,
}: {
  evaluationId: string;
  api?: EvaluationsApi;
}) {
  const context = useEvaluationContainer(api);
  const [state, setState] = useState<LoadState<Data>>({ status: "loading" });
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    Promise.all([
      context.api.getSession(evaluationId, c.signal),
      context.api.listReviewBatches(evaluationId, c.signal),
    ])
      .then(([session, batches]) =>
        setState({ status: "ready", data: { session, batches } }),
      )
      .catch((e: unknown) => {
        if (!c.signal.aborted)
          setState({
            status: "error",
            message:
              e instanceof Error
                ? e.message
                : "レビューを取得できませんでした。",
          });
      });
    return () => c.abort();
  }, [context.api, evaluationId, reload]);
  const run = async (work: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await work();
      setReload((v) => v + 1);
      return { ok: true, message };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "操作できませんでした。",
      };
    } finally {
      setBusy(false);
    }
  };
  const nav = (
    key: Parameters<NonNullable<typeof context.navigate>>[0],
    options?: Parameters<NonNullable<typeof context.navigate>>[1],
  ) => context.navigate?.(key, options);
  return (
    <EvaluationReviewAdminPresentation
      account={context.account}
      evaluationId={evaluationId}
      state={state}
      busy={busy}
      onCreateBatch={(label) =>
        run(
          () =>
            context.api.createReviewBatch(
              evaluationId,
              label
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean),
            ),
          "Review batchを作成しました。",
        )
      }
      onClose={() =>
        run(
          () => context.api.closeReview(evaluationId),
          "レビューを締め切りました。",
        )
      }
      onReveal={() =>
        run(
          () => context.api.revealIdentities(evaluationId),
          "候補identityを公開しました。",
        )
      }
      onRetry={() => setReload((v) => v + 1)}
      onNavigate={nav}
      onLogout={context.logout}
    />
  );
}
