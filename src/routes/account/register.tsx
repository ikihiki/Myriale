import { createFileRoute } from '@tanstack/react-router';
import { UserManagementPage, type UMView } from '../../features/user-management/UserManagementPage';

type RegisterSearch = { view?: UMView };

export const Route = createFileRoute('/account/register')({
  validateSearch: (search: Record<string, unknown>): RegisterSearch => ({
    view: search.view === 'verify-email' ? 'verify-email' : undefined,
  }),
  component: RegisterRoute,
});

function RegisterRoute() {
  return <UserManagementPage initialView={Route.useSearch().view ?? 'register'} />;
}
