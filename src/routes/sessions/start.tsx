import { createFileRoute, redirect } from '@tanstack/react-router';
import type { StartSessionSearch } from '../../features/session-start/startSessionModel';

export const Route = createFileRoute('/sessions/start')({
  validateSearch: (search: Record<string, unknown>): StartSessionSearch => ({
    scenarioId: typeof search.scenarioId === 'string' && search.scenarioId.length > 0 ? search.scenarioId : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (!search.scenarioId) throw redirect({ to: '/scenarios' });
  },
  component: StartSessionRoute,
});

function StartSessionRoute() {
  const { startSessionContainer: StartSessionContainer } = Route.useRouteContext();
  const { scenarioId } = Route.useSearch();
  return <StartSessionContainer scenarioId={scenarioId!} />;
}
