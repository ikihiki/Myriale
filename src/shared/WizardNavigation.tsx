import { useEffect, useState, type ReactNode } from 'react';

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
  const [isCompact, setIsCompact] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const activeItem = items.find((item) => item.id === activeId) ?? items[0];

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (!window.matchMedia) return undefined;
    const query = window.matchMedia('(max-width: 1120px)');
    const sync = () => setIsCompact(query.matches);
    sync();
    query.addEventListener?.('change', sync);
    return () => query.removeEventListener?.('change', sync);
  }, []);

  const open = isCompact ? expanded : true;

  return (
    <aside
      className="contract-spine wizard-navigation"
      aria-label={typeof title === 'string' ? title : ariaLabel}
      data-compact={isCompact ? 'true' : undefined}
    >
      <details open={open} onToggle={(event) => setExpanded(event.currentTarget.open)}>
        <summary className="wizard-navigation-summary">
          <span className="wizard-navigation-title">{title}</span>
          {activeItem && (
            <span className="wizard-navigation-current">
              <span>{activeItem.label}</span>
              {activeItem.meta && <small>{activeItem.meta}</small>}
            </span>
          )}
        </summary>

        <div className="wizard-navigation-body">
          {help && <p className="toc-help">{help}</p>}
          <div className="wizard-step-list" role="list" aria-label={ariaLabel}>
            {items.map((item) => {
              const active = activeId === item.id;
              return (
                <button
                  className={`spine-row spine-step ${active ? 'active' : ''}`.trim()}
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
            <div className="scenario-id">
              {markerLabel && <span>{markerLabel}</span>}
              {markerValue && <b>{markerValue}</b>}
            </div>
          )}
          {action}
        </div>
      </details>
    </aside>
  );
}
