import { createFileRoute } from '@tanstack/react-router';
import { requireAuthenticated } from '../../auth/requireAuthenticated';

export const Route = createFileRoute('/scenarios/new')({
  beforeLoad: ({ context, location }) => requireAuthenticated(context.accountApi, location),
  component: ScenarioRegistrationRoute,
});

function ScenarioRegistrationRoute() {
  const { scenarioRegistrationContainer: ScenarioRegistrationContainer } = Route.useRouteContext();
  return <ScenarioRegistrationContainer />;
}
