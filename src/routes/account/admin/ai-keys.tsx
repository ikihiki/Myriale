import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/account/admin/ai-keys')({
  beforeLoad: () => { throw redirect({ to: '/admin' }); },
});
