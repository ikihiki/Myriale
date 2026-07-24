import { createFileRoute, useRouter } from '@tanstack/react-router';
import { authenticatedRedirectTarget, safeRedirectTarget } from '../../auth/requireAuthenticated';
import { UserManagementPage } from '../../features/user-management/UserManagementPage';

export type LoginSearch = {
  redirect?: string;
};

export const Route = createFileRoute('/account/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: safeRedirectTarget(search.redirect),
  }),
  component: LoginRoute,
});

function LoginRoute() {
  const router = useRouter();
  const search = Route.useSearch();
  return (
    <UserManagementPage
      initialView="login"
      onAuthenticated={() => router.history.replace(authenticatedRedirectTarget(search.redirect))}
    />
  );
}
