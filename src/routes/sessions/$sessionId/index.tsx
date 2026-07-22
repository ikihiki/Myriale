import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sessions/$sessionId/')({ component: SessionRoute });

function SessionRoute() {
  const { sessionContainer: SessionContainer } = Route.useRouteContext();
  return <SessionContainer sessionId={Route.useParams().sessionId} />;
}
