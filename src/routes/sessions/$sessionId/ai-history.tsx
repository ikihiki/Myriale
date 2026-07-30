import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sessions/$sessionId/ai-history')({ component: SessionAiHistoryRoute });

function SessionAiHistoryRoute() {
  const { sessionAiHistoryContainer: SessionAiHistoryContainer } = Route.useRouteContext();
  return <SessionAiHistoryContainer sessionId={Route.useParams().sessionId} />;
}
