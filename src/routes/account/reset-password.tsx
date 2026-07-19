import { createFileRoute } from '@tanstack/react-router';
import { UserManagementPage } from '../../features/user-management/UserManagementPage';
export const Route = createFileRoute('/account/reset-password')({ component: () => <UserManagementPage initialView="reset" /> });
