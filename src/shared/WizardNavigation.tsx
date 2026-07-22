import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '../components/ui';
import './WizardNavigation.css';

export type WizardNavigationItem = {
  id: string;
  label: ReactNode;
  meta?: ReactNode;
  ariaLabel?: string;
  testId?: string;
  disabled?: boolean;
};

export function WizardNavigation({
  title,
  ariaLabel,
  help,
  items,
  activeId,
  onSelect,
  markerLabel,
  markerValue,
  action,
  children,
}: {
  title: ReactNode;
  ariaLabel: string;
  help?: ReactNode;
  items: WizardNavigationItem[];
  activeId?: string;
  onSelect: (id: string) => void;
  markerLabel?: ReactNode;
  markerValue?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  const [isCompact, setIsCompact] = useState(
    () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(max-width: 1120px)').matches),
  );
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const activeItem = items.find((item) => item.id === activeId) ?? items[0];

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (!window.matchMedia) {
      if (detailsRef.current) detailsRef.current.open = true;
      return undefined;
    }
    const query = window.matchMedia('(max-width: 1120px)');
    const sync = () => {
      setIsCompact(query.matches);
      if (detailsRef.current) detailsRef.current.open = !query.matches;
    };
    sync();
    query.addEventListener?.('change', sync);
    return () => query.removeEventListener?.('change', sync);
  }, []);

  return (
    <aside
      className="wizard-navigation sticky top-3.5 min-h-[calc(100vh-28px)] self-start rounded-[14px_6px_6px_14px] border border-[rgba(220,231,242,0.42)] bg-[linear-gradient(180deg,#201b2d,#17151f)] p-3 text-[#f4eedf] shadow-[0_24px_80px_rgba(23,21,31,0.22)] max-myr-workspace:top-2 max-myr-workspace:z-30 max-myr-workspace:h-fit max-myr-workspace:min-h-0 max-myr-workspace:max-h-[min(62vh,420px)] max-myr-workspace:overflow-auto max-myr-workspace:rounded-myr-card"
      aria-label={typeof title === 'string' ? title : ariaLabel}
      data-compact={isCompact ? 'true' : undefined}
    >
      <details ref={detailsRef} className="group grid gap-3">
        <summary className="wizard-navigation-summary grid cursor-default gap-2 max-myr-workspace:sticky max-myr-workspace:top-0 max-myr-workspace:z-[1] max-myr-workspace:-mx-3 max-myr-workspace:-mt-3 max-myr-workspace:mb-2 max-myr-workspace:grid-cols-[auto_1fr_auto] max-myr-workspace:items-center max-myr-workspace:rounded-[16px_16px_10px_10px] max-myr-workspace:bg-[linear-gradient(180deg,#201b2d,#17151f)] max-myr-workspace:p-3 max-myr-workspace:shadow-[0_10px_18px_rgba(23,21,31,0.28)] max-myr-workspace:cursor-pointer max-myr-workspace:after:rounded-full max-myr-workspace:after:border max-myr-workspace:after:border-[rgba(255,250,240,0.28)] max-myr-workspace:after:px-[9px] max-myr-workspace:after:py-[5px] max-myr-workspace:after:text-myr-caption max-myr-workspace:after:font-black max-myr-workspace:after:text-myr-gold">
          <span className="font-serif text-[18px] font-black">{title}</span>
          {activeItem && (
            <span className="hidden min-w-0 text-xs leading-tight text-[#f4eedf] max-myr-workspace:grid [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[10px] [&_small]:text-[rgba(244,238,223,0.72)] [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap">
              <span>{activeItem.label}</span>
              {activeItem.meta && <small>{activeItem.meta}</small>}
            </span>
          )}
        </summary>

        <div className="grid gap-2.5 group-open:grid max-myr-workspace:group-not-open:hidden">
          {help && <p className="mb-3 mt-0 text-myr-caption leading-[1.45] text-[#c9bdd8]">{help}</p>}
          <div className="grid gap-1" role="list" aria-label={ariaLabel}>
            {items.map((item) => {
              const active = activeId === item.id;
              return (
                <Button
                  className={`grid w-full cursor-pointer gap-px rounded-myr-control border-0 bg-transparent px-[9px] py-2 text-left text-[#f4eedf] ${active ? 'bg-[rgba(217,164,65,0.14)] shadow-[inset_3px_0_0_#d9a441] [&_small]:text-[#dce7f2]' : ''} [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[10px] [&_small]:leading-[1.2] [&_small]:text-[#bfc8d5] [&_span]:text-xs [&_span]:font-black [&_span]:leading-[1.2] [&_span]:text-myr-gold disabled:cursor-not-allowed disabled:opacity-40`.trim()}
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  aria-label={item.ariaLabel}
                  aria-current={active ? 'step' : undefined}
                  data-testid={item.testId}
                  disabled={item.disabled}
                >
                  <span>{item.label}</span>
                  {item.meta && <small>{item.meta}</small>}
                </Button>
              );
            })}
          </div>
          {children}
          {(markerLabel || markerValue) && (
            <div className="mt-2.5 rounded-myr-control bg-[rgba(220,231,242,0.08)] p-2">
              {markerLabel && <span className="block text-[10px] uppercase tracking-[0.14em] text-[#bfc8d5]">{markerLabel}</span>}
              {markerValue && <b className="font-mono text-myr-caption text-myr-gold">{markerValue}</b>}
            </div>
          )}
          {action && <div className="[&_button]:mt-2.5 [&_button]:bg-transparent [&_button]:py-2.5 [&_button]:font-black [&_button]:text-myr-gold">{action}</div>}
        </div>
      </details>
    </aside>
  );
}
