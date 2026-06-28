import type { AdminUser } from '../types';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';

export function UserTable({ users, selectedId, onSelect, caption }: { users: AdminUser[]; selectedId?: string; onSelect?: (user: AdminUser) => void; caption: string }) {
  return (
    <table className="user-table">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">ユーザー</th>
          <th scope="col">状態</th>
          <th scope="col">登録日</th>
          <th scope="col">最終ログイン</th>
          <th scope="col"><span className="sr-only">操作</span></th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className={selectedId === user.id ? 'selected' : ''} data-testid={`user-row-${user.id}`}>
            <td><strong>{user.name}</strong><small>{user.email}</small></td>
            <td><StatusBadge state={user.state} /></td>
            <td>{user.registered}</td>
            <td>{user.lastLogin}</td>
            <td>{onSelect && <Button variant="text" aria-label={`${user.name}を開く`} onClick={() => onSelect(user)}>開く</Button>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
