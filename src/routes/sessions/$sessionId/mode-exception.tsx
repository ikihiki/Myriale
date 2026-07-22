import { createFileRoute } from '@tanstack/react-router';
import { SessionPage } from '../../../features/session-play/SessionPage';

export const Route = createFileRoute('/sessions/$sessionId/mode-exception')({ component: SessionAliasRoute });

function SessionAliasRoute() {
  const { sessionFixture } = Route.useRouteContext();
  return <SessionPage sessionId={Route.useParams().sessionId} fixture={sessionFixture} />;
}
