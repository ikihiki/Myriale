import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/scenarios/')({ component: ScenarioListRoute });

function ScenarioListRoute() {
  const { scenarioListContainer: ScenarioListContainer } = Route.useRouteContext();
  return <ScenarioListContainer />;
}
