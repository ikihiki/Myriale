import { createFileRoute } from '@tanstack/react-router';
import { StartSessionPage, type StartSessionSearch } from '../../features/session-start/StartSessionPage';

export const Route = createFileRoute('/sessions/start')({
  validateSearch: (search: Record<string, unknown>): StartSessionSearch => ({
    scenarioId: typeof search.scenarioId === 'string' ? search.scenarioId : undefined,
    title: typeof search.title === 'string' ? search.title : undefined,
    genre: typeof search.genre === 'string' ? search.genre : undefined,
    status: typeof search.status === 'string' ? search.status : undefined,
    opening: typeof search.opening === 'string' ? search.opening : undefined,
  }),
  component: StartSessionRoute,
});

function StartSessionRoute() {
  return <StartSessionPage search={Route.useSearch()} />;
}
