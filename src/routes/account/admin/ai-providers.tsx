import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/account/admin/ai-providers')({
  beforeLoad: () => { throw redirect({ to: '/admin' }); },
});
