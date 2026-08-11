import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/evaluations/')({ component: Page });
function Page() { const { evaluationListContainer: Container } = Route.useRouteContext(); return <Container/>; }
