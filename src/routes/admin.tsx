import { createFileRoute } from '@tanstack/react-router';
import { AdminAiKeysPage } from '../features/admin/AdminAiKeysPage';

export const Route = createFileRoute('/admin')({ component: AdminAiKeysPage });
