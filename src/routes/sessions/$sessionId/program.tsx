import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sessions/$sessionId/program')({ component: SessionAliasRoute });

function SessionAliasRoute() {
  const { sessionPageContainer: SessionPageContainer } = Route.useRouteContext();
  return <SessionPageContainer sessionId={Route.useParams().sessionId} />;
}
