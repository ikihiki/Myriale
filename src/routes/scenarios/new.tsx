import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/scenarios/new')({ component: ScenarioRegistrationRoute });

function ScenarioRegistrationRoute() {
  const { scenarioRegistrationContainer: ScenarioRegistrationContainer } = Route.useRouteContext();
  return <ScenarioRegistrationContainer />;
}
