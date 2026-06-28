import type { DefItem } from '../types';

export function DefinitionList({ items, testId }: { items: DefItem[]; testId?: string }) {
  return (
    <dl className="def-list" data-testid={testId}>
      {items.map((item) => (
        <div key={item.term}>
          <dt>{item.term}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
