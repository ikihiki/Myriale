import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sessions/$sessionId/')({ component: SessionRoute });

function SessionRoute() {
  const { sessionPageContainer: SessionPageContainer } = Route.useRouteContext();
  return <SessionPageContainer sessionId={Route.useParams().sessionId} />;
}
