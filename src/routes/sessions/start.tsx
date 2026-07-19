import { createFileRoute } from '@tanstack/react-router';
import { StartSessionPage, type StartSessionSearch } from '../../features/session-start/StartSessionPage';

export const Route = createFileRoute('/sessions/start')({
  validateSearch: (search: Record<string, unknown>): StartSessionSearch => ({
    scenarioId: typeof search.scenarioId === 'string' ? search.scenarioId : undefined,
  }),
  component: StartSessionRoute,
});

function StartSessionRoute() {
  return <StartSessionPage search={Route.useSearch()} />;
}
