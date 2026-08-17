import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/ai-playground')({ component: AiPlaygroundRoute });

function AiPlaygroundRoute() {
  const { aiPlaygroundContainer: AiPlaygroundContainer } = Route.useRouteContext();
  return <AiPlaygroundContainer />;
}
