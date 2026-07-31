import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sessions/$sessionId/turns/$turnId/inspection')({ component: TurnInspectionRoute });

function TurnInspectionRoute() {
  const { turnInspectionContainer: TurnInspectionContainer } = Route.useRouteContext();
  const { sessionId, turnId } = Route.useParams();
  return <TurnInspectionContainer sessionId={sessionId} turnId={turnId} />;
}
