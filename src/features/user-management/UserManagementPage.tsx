import { AccountPage, type AccountView } from '../account/AccountPage';
import type { AccountApi } from '../../account/api/accountApi';

export type UMView = AccountView;

export function UserManagementPage({
  initialView = 'register',
  api,
  onAuthenticated,
}: {
  initialView?: UMView;
  api?: AccountApi;
  onAuthenticated?: () => void;
}) {
  return <AccountPage initialView={initialView} api={api} onAuthenticated={onAuthenticated} />;
}
