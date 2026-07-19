import { createFileRoute } from '@tanstack/react-router';
import { SessionPage } from '../../../features/session-play/SessionPage';

export const Route = createFileRoute('/sessions/$sessionId/play')({ component: SessionAliasRoute });

function SessionAliasRoute() {
  return <SessionPage sessionId={Route.useParams().sessionId} />;
}
