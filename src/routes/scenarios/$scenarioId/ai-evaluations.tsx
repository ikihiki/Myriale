import { createFileRoute } from '@tanstack/react-router';
import { requireAuthenticated } from '../../../auth/requireAuthenticated';

export const Route = createFileRoute('/scenarios/$scenarioId/ai-evaluations')({
  beforeLoad: ({ context, location }) => requireAuthenticated(context.accountApi, location),
  component: ScenarioAiEvaluationRoute,
});

function ScenarioAiEvaluationRoute() {
  const { scenarioId } = Route.useParams();
  const { scenarioAiEvaluationContainer: ScenarioAiEvaluationContainer } = Route.useRouteContext();
  return <ScenarioAiEvaluationContainer scenarioId={scenarioId} />;
}
