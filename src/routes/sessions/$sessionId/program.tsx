import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sessions/$sessionId/program')({ component: SessionAliasRoute });

function SessionAliasRoute() {
  const { sessionContainer: SessionContainer } = Route.useRouteContext();
  return <SessionContainer sessionId={Route.useParams().sessionId} />;
}
