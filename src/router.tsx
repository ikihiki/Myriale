import type { ComponentType } from 'react';
import { createBrowserHistory, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { createFetchAccountApi, type AccountApi } from './account/api/accountApi';
import { ScenarioRegistrationContainer } from './features/scenario-registration/ScenarioRegistrationContainer';
import { EditScenarioContainer } from './features/scenario-editor/EditScenarioContainer';
import { ScenarioListContainer } from './features/session-start/ScenarioListContainer';
import { SessionContainer } from './features/session-play/SessionContainer';
import { TurnInspectionContainer } from './features/turn-inspection/TurnInspectionContainer';
import { StartSessionContainer } from './features/session-start/StartSessionContainer';
import { EvaluationListContainer } from './features/evaluations/list/EvaluationListContainer';
import { EvaluationCreateContainer } from './features/evaluations/create/EvaluationCreateContainer';
import { EvaluationOverviewContainer } from './features/evaluations/overview/EvaluationOverviewContainer';
import { EvaluationSetupContainer } from './features/evaluations/setup/EvaluationSetupContainer';
import { EvaluationExecutionContainer } from './features/evaluations/execution/EvaluationExecutionContainer';
import { EvaluationReviewAdminContainer } from './features/evaluations/review-admin/EvaluationReviewAdminContainer';
import { EvaluationBlindReviewContainer } from './features/evaluations/blind-review/EvaluationBlindReviewContainer';
import { EvaluationResultsContainer } from './features/evaluations/results/EvaluationResultsContainer';
import { routeTree } from './routeTree.gen';

export type AppRouterContext = {
  showDebugPanel: boolean; accountApi: AccountApi;
  scenarioListContainer: ComponentType; scenarioRegistrationContainer: ComponentType; editScenarioContainer: ComponentType<{ scenarioId: string }>;
  sessionContainer: ComponentType<{ sessionId: string }>; turnInspectionContainer: ComponentType<{ sessionId: string; turnId: string }>; startSessionContainer: ComponentType<{ scenarioId: string }>;
  evaluationListContainer: ComponentType; evaluationCreateContainer: ComponentType<{ sourceScenarioId?: string }>;
  evaluationOverviewContainer: ComponentType<{ evaluationId: string }>; evaluationSetupContainer: ComponentType<{ evaluationId: string }>;
  evaluationExecutionContainer: ComponentType<{ evaluationId: string }>; evaluationReviewAdminContainer: ComponentType<{ evaluationId: string }>;
  evaluationBlindReviewContainer: ComponentType<{ assignmentId: string }>; evaluationResultsContainer: ComponentType<{ evaluationId: string }>;
};
export type AppHistoryMode = 'browser' | 'memory';
export type AppContainerOverrides = Partial<Pick<AppRouterContext, 'scenarioListContainer' | 'scenarioRegistrationContainer' | 'editScenarioContainer' | 'sessionContainer' | 'turnInspectionContainer' | 'startSessionContainer' | 'evaluationListContainer' | 'evaluationCreateContainer' | 'evaluationOverviewContainer' | 'evaluationSetupContainer' | 'evaluationExecutionContainer' | 'evaluationReviewAdminContainer' | 'evaluationBlindReviewContainer' | 'evaluationResultsContainer'>>;
export function createAppRouter({ initialUrl = '/', historyMode = 'memory', showDebugPanel = true, accountApi = createFetchAccountApi(), ...overrides }:{ initialUrl?: string; historyMode?: AppHistoryMode; showDebugPanel?: boolean; accountApi?: AccountApi } & AppContainerOverrides = {}) {
  const history = historyMode === 'browser' ? createBrowserHistory() : createMemoryHistory({ initialEntries: [initialUrl] });
  const context:AppRouterContext = { showDebugPanel, accountApi, scenarioListContainer: overrides.scenarioListContainer ?? ScenarioListContainer, scenarioRegistrationContainer: overrides.scenarioRegistrationContainer ?? ScenarioRegistrationContainer, editScenarioContainer: overrides.editScenarioContainer ?? EditScenarioContainer, sessionContainer: overrides.sessionContainer ?? SessionContainer, turnInspectionContainer: overrides.turnInspectionContainer ?? TurnInspectionContainer, startSessionContainer: overrides.startSessionContainer ?? StartSessionContainer, evaluationListContainer: overrides.evaluationListContainer ?? EvaluationListContainer, evaluationCreateContainer: overrides.evaluationCreateContainer ?? EvaluationCreateContainer, evaluationOverviewContainer: overrides.evaluationOverviewContainer ?? EvaluationOverviewContainer, evaluationSetupContainer: overrides.evaluationSetupContainer ?? EvaluationSetupContainer, evaluationExecutionContainer: overrides.evaluationExecutionContainer ?? EvaluationExecutionContainer, evaluationReviewAdminContainer: overrides.evaluationReviewAdminContainer ?? EvaluationReviewAdminContainer, evaluationBlindReviewContainer: overrides.evaluationBlindReviewContainer ?? EvaluationBlindReviewContainer, evaluationResultsContainer: overrides.evaluationResultsContainer ?? EvaluationResultsContainer };
  return createRouter({ routeTree, history, context, defaultPreload: 'intent' });
}
export type AppRouter = ReturnType<typeof createAppRouter>; declare module '@tanstack/react-router' {interface Register { router: AppRouter; }}
