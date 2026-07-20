import { createFileRoute } from '@tanstack/react-router';
import { ModuleExecutionPage } from '../../features/module-execution/ModuleExecutionPage';

export const Route = createFileRoute('/module-executions/$executionId')({
  component: ExecutionRoute,
});

function ExecutionRoute() {
  const { executionId } = Route.useParams();
  return <ModuleExecutionPage executionId={executionId} />;
}
