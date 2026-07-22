import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sessions/$sessionId/notes')({ component: SessionAliasRoute });

function SessionAliasRoute() {
  const { sessionContainer: SessionContainer } = Route.useRouteContext();
  return <SessionContainer sessionId={Route.useParams().sessionId} />;
}
