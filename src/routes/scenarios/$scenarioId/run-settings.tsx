import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/scenarios/$scenarioId/run-settings')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/scenarios/$scenarioId/edit', params: { scenarioId: params.scenarioId } });
  },
});
