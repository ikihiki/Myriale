import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sessions/$sessionId/notes')({ component: SessionAliasRoute });

function SessionAliasRoute() {
  const { sessionPageContainer: SessionPageContainer } = Route.useRouteContext();
  return <SessionPageContainer sessionId={Route.useParams().sessionId} />;
}
