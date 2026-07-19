import { AccountPage, type AccountView } from '../account/AccountPage';
import type { AccountApi } from '../../account/api/accountApi';

export type UMView = AccountView;

export function UserManagementPage({ initialView = 'register', api }: { initialView?: UMView; api?: AccountApi }) {
  return <AccountPage initialView={initialView} api={api} />;
}
