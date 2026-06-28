import * as Tabs from '@radix-ui/react-tabs';

export const MyrialeTabsRoot = Tabs.Root;
export const MyrialeTabsContent = Tabs.Content;

export function MyrialeTabsList({ items, ariaLabel }: { items: Array<{ value: string; label: string }>; ariaLabel: string }) {
  return (
    <Tabs.List className="myr-ui-tabs-list" aria-label={ariaLabel}>
      {items.map((item) => (
        <Tabs.Trigger key={item.value} value={item.value} className="myr-ui-tabs-trigger">
          {item.label}
        </Tabs.Trigger>
      ))}
    </Tabs.List>
  );
}
