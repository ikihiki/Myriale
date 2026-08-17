import { createFileRoute } from '@tanstack/react-router';
import { AdminAiProvidersPage } from '../../features/admin/AdminAiProvidersPage';

export const Route = createFileRoute('/admin/')({ component: AdminAiProvidersPage });
