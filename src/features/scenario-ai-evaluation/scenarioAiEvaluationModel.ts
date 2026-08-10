import type { ScenarioAiEvaluationCorpusManifest, ScenarioAiEvaluationRun } from '../../app/scenarioApi';

export type ScenarioAiEvaluationState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; scenarioTitle: string; manifest: ScenarioAiEvaluationCorpusManifest; recentRuns: ScenarioAiEvaluationRun['summary'][] };

export type ScenarioAiEvaluationCommandResult<T = undefined> = {
  ok: boolean;
  message: string;
  value?: T;
};

export type ScenarioAiEvaluationActions = {
  runCorpus: (profileIds: string[], repetitions: number, caseIds: string[]) => Promise<ScenarioAiEvaluationCommandResult<ScenarioAiEvaluationRun>>;
  exportRun: (runId: string, format: 'json' | 'csv') => Promise<ScenarioAiEvaluationCommandResult>;
  retry: () => void;
  backToScenario: () => void;
  logout: () => void | Promise<void>;
};
