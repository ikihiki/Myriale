import { createFileRoute } from '@tanstack/react-router';
import { requireAuthenticated } from '../../../auth/requireAuthenticated';

export const Route = createFileRoute('/scenarios/$scenarioId/edit')({
  beforeLoad: ({ context, location }) => requireAuthenticated(context.accountApi, location),
  component: EditScenarioRoute,
});

function EditScenarioRoute() {
  const { scenarioId } = Route.useParams();
  const { editScenarioContainer: EditScenarioContainer } = Route.useRouteContext();
  return <EditScenarioContainer scenarioId={scenarioId} />;
}
