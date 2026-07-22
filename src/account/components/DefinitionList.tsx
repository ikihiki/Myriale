import type { DefItem } from '../types';

export function DefinitionList({ items, testId }: { items: DefItem[]; testId?: string }) {
  return (
    <dl className="m-0 grid gap-0" data-testid={testId}>
      {items.map((item) => (
        <div className="grid grid-cols-[130px_1fr] gap-2.5 border-t border-myr-line py-2.75 first:border-t-0" key={item.term}>
          <dt className="m-0 text-xs font-extrabold tracking-myr-label text-myr-account-ink-soft">{item.term}</dt>
          <dd className="m-0 text-sm">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
