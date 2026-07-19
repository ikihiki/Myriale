import { createFileRoute } from '@tanstack/react-router';
import { UserManagementPage } from '../../../features/user-management/UserManagementPage';
export const Route = createFileRoute('/account/admin/ai-keys')({ component: () => <UserManagementPage initialView="admin-ai-keys" /> });
