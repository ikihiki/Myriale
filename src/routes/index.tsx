import { createFileRoute } from '@tanstack/react-router';
import { requireAuthenticated } from '../auth/requireAuthenticated';
import { HomePage } from '../features/home/HomePage';

export const Route = createFileRoute('/')({
  beforeLoad: ({ context, location }) => requireAuthenticated(context.accountApi, location),
  component: HomePage,
});
