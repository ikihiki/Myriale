import { createFileRoute } from '@tanstack/react-router';
import { UserManagementPage } from '../../features/user-management/UserManagementPage';
export const Route = createFileRoute('/account/login')({ component: () => <UserManagementPage initialView="login" /> });
