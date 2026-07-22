import type { AdminUser } from '../types';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';

const headCellClassName = 'border-b border-[var(--line-strong)] bg-[rgba(124,92,255,.06)] px-4 py-3 text-left text-[11px] font-extrabold tracking-[.1em] text-[var(--ink-soft)] uppercase';
const bodyCellClassName = 'border-b border-[var(--line)] px-4 py-[13px] align-middle';

export function UserTable({ users, selectedId, onSelect, caption }: { users: AdminUser[]; selectedId?: string; onSelect?: (user: AdminUser) => void; caption: string }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption className="sr-only text-left">{caption}</caption>
        <thead>
          <tr>
            <th className={headCellClassName} scope="col">ユーザー</th>
            <th className={headCellClassName} scope="col">状態</th>
            <th className={headCellClassName} scope="col">登録日</th>
            <th className={headCellClassName} scope="col">最終ログイン</th>
            <th className={headCellClassName} scope="col"><span className="sr-only">操作</span></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className={selectedId === user.id ? 'selected bg-[rgba(124,92,255,.1)]' : 'hover:bg-[rgba(36,27,47,.03)]'} data-testid={`user-row-${user.id}`}>
              <td className={bodyCellClassName}><strong className="block">{user.name}</strong><small className="font-mono text-xs text-[var(--ink-soft)]">{user.email}</small></td>
              <td className={bodyCellClassName}><StatusBadge state={user.state} /></td>
              <td className={bodyCellClassName}>{user.registered}</td>
              <td className={bodyCellClassName}>{user.lastLogin}</td>
              <td className={bodyCellClassName}>{onSelect && <Button variant="text" aria-label={`${user.name}を開く`} onClick={() => onSelect(user)}>開く</Button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
