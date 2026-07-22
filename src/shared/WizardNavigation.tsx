import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
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
      className="wizard-navigation sticky top-3.5 min-h-[calc(100vh-28px)] self-start rounded-[14px_6px_6px_14px] border border-[rgba(220,231,242,0.42)] bg-[linear-gradient(180deg,#201b2d,#17151f)] p-3 text-[#f4eedf] shadow-[0_24px_80px_rgba(23,21,31,0.22)] max-[1120px]:top-2 max-[1120px]:z-30 max-[1120px]:h-fit max-[1120px]:min-h-0 max-[1120px]:max-h-[min(62vh,420px)] max-[1120px]:overflow-auto max-[1120px]:rounded-[18px]"
      aria-label={typeof title === 'string' ? title : ariaLabel}
      data-compact={isCompact ? 'true' : undefined}
    >
      <details ref={detailsRef} className="group grid gap-3">
        <summary className="wizard-navigation-summary grid cursor-default gap-2 max-[1120px]:sticky max-[1120px]:top-0 max-[1120px]:z-[1] max-[1120px]:-mx-3 max-[1120px]:-mt-3 max-[1120px]:mb-2 max-[1120px]:grid-cols-[auto_1fr_auto] max-[1120px]:items-center max-[1120px]:rounded-[16px_16px_10px_10px] max-[1120px]:bg-[linear-gradient(180deg,#201b2d,#17151f)] max-[1120px]:p-3 max-[1120px]:shadow-[0_10px_18px_rgba(23,21,31,0.28)] max-[1120px]:cursor-pointer max-[1120px]:after:rounded-full max-[1120px]:after:border max-[1120px]:after:border-[rgba(255,250,240,0.28)] max-[1120px]:after:px-[9px] max-[1120px]:after:py-[5px] max-[1120px]:after:text-[11px] max-[1120px]:after:font-black max-[1120px]:after:text-[#d9a441]">
          <span className="font-serif text-[18px] font-black">{title}</span>
          {activeItem && (
            <span className="hidden min-w-0 text-xs leading-tight text-[#f4eedf] max-[1120px]:grid [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[10px] [&_small]:text-[rgba(244,238,223,0.72)] [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap">
              <span>{activeItem.label}</span>
              {activeItem.meta && <small>{activeItem.meta}</small>}
            </span>
          )}
        </summary>

        <div className="grid gap-2.5 group-open:grid max-[1120px]:group-not-open:hidden">
          {help && <p className="mb-3 mt-0 text-[11px] leading-[1.45] text-[#c9bdd8]">{help}</p>}
          <div className="grid gap-1" role="list" aria-label={ariaLabel}>
            {items.map((item) => {
              const active = activeId === item.id;
              return (
                <button
                  className={`grid w-full cursor-pointer gap-px rounded-[10px] border-0 bg-transparent px-[9px] py-2 text-left text-[#f4eedf] ${active ? 'bg-[rgba(217,164,65,0.14)] shadow-[inset_3px_0_0_#d9a441] [&_small]:text-[#dce7f2]' : ''} [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[10px] [&_small]:leading-[1.2] [&_small]:text-[#bfc8d5] [&_span]:text-xs [&_span]:font-black [&_span]:leading-[1.2] [&_span]:text-[#d9a441] disabled:cursor-not-allowed disabled:opacity-40`.trim()}
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  aria-label={item.ariaLabel}
                  aria-current={active ? 'step' : undefined}
                  data-testid={item.testId}
                  disabled={item.disabled}
                >
                  <span>{item.label}</span>
                  {item.meta && <small>{item.meta}</small>}
                </button>
              );
            })}
          </div>
          {children}
          {(markerLabel || markerValue) && (
            <div className="mt-2.5 rounded-[10px] bg-[rgba(220,231,242,0.08)] p-2">
              {markerLabel && <span className="block text-[10px] uppercase tracking-[0.14em] text-[#bfc8d5]">{markerLabel}</span>}
              {markerValue && <b className="font-mono text-[11px] text-[#d9a441]">{markerValue}</b>}
            </div>
          )}
          {action && <div className="[&_button]:mt-2.5 [&_button]:bg-transparent [&_button]:py-2.5 [&_button]:font-black [&_button]:text-[#d9a441]">{action}</div>}
        </div>
      </details>
    </aside>
  );
}
