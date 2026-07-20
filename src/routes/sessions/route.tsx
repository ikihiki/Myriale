import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireAuthenticated } from '../../auth/requireAuthenticated';

export const Route = createFileRoute('/sessions')({
  beforeLoad: ({ context, location }) => requireAuthenticated(context.accountApi, location),
  component: Outlet,
});
