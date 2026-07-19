import { createFileRoute } from '@tanstack/react-router';
import { SessionPage } from '../../../features/session-play/SessionPage';

export const Route = createFileRoute('/sessions/$sessionId/')({ component: SessionRoute });

function SessionRoute() {
  return <SessionPage sessionId={Route.useParams().sessionId} />;
}
