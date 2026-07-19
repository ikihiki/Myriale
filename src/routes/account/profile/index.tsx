import { createFileRoute } from '@tanstack/react-router';
import { UserManagementPage } from '../../../features/user-management/UserManagementPage';
export const Route = createFileRoute('/account/profile/')({ component: () => <UserManagementPage initialView="profile" /> });
