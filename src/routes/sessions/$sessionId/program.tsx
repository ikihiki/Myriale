import { createFileRoute } from '@tanstack/react-router';
import { SessionPage } from '../../../features/session-play/SessionPage';

export const Route = createFileRoute('/sessions/$sessionId/program')({ component: SessionAliasRoute });

function SessionAliasRoute() {
  return <SessionPage sessionId={Route.useParams().sessionId} />;
}
