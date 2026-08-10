import { createFileRoute } from '@tanstack/react-router';
import { requireAuthenticated } from '../auth/requireAuthenticated';
import { AdminAiProvidersPage } from '../features/admin/AdminAiProvidersPage';

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ context, location }) => requireAuthenticated(context.accountApi, location),
  component: AdminAiProvidersPage,
});
