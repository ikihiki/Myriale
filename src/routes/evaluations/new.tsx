import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/evaluations/new')({ validateSearch: (search:Record<string, unknown>) => ({ sourceScenarioId: typeof search.sourceScenarioId === 'string' ? search.sourceScenarioId : undefined }), component: Page });
function Page() { const { evaluationCreateContainer: Container } = Route.useRouteContext(); const { sourceScenarioId } = Route.useSearch(); return <Container sourceScenarioId={sourceScenarioId}/>; }
