import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentPropsWithRef,
  type ElementType,
  type ReactElement,
} from 'react';

type SurfaceOwnProps = {
  as?: ElementType;
};

export type SurfaceProps<Element extends ElementType = 'div'> = {
  as?: Element;
} & Omit<ComponentPropsWithoutRef<Element>, keyof SurfaceOwnProps>;

type SurfaceComponent = <Element extends ElementType = 'div'>(
  props: SurfaceProps<Element> & { ref?: ComponentPropsWithRef<Element>['ref'] },
) => ReactElement | null;

function cx(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

function createSurface(defaultClassName: string): SurfaceComponent {
  const Surface = forwardRef<HTMLElement, SurfaceProps<ElementType>>(
    function Surface({ as, className, ...props }, ref) {
      const Component = as ?? 'div';
      return <Component ref={ref} className={cx(defaultClassName, className)} {...props} />;
    },
  );
  return Surface as SurfaceComponent;
}

export const PageCanvas = createSurface(
  'min-h-[calc(100vh-118px)] bg-[image:var(--myr-screen-background)] p-3 font-myr-body text-myr-ink md:p-5',
);

const pageShellWidthClassNames = {
  content: 'max-w-myr-content',
  focused: 'max-w-myr-focused',
  chrome: 'w-full max-w-myr-chrome',
  reading: 'w-full max-w-myr-reading',
} as const;

type PageShellWidth = keyof typeof pageShellWidthClassNames;
type PageShellOwnProps = { width: PageShellWidth };
export type PageShellProps<Element extends ElementType = 'main'> = PageShellOwnProps & {
  as?: Element;
} & Omit<ComponentPropsWithoutRef<Element>, keyof PageShellOwnProps | 'as'>;

type PageShellComponent = <Element extends ElementType = 'main'>(
  props: PageShellProps<Element> & { ref?: ComponentPropsWithRef<Element>['ref'] },
) => ReactElement | null;

const PageShellImpl = forwardRef<HTMLElement, PageShellProps<ElementType>>(
  function PageShell({ as, width, className, ...props }, ref) {
    const Component = as ?? 'main';
    return (
      <Component
        ref={ref}
        className={cx(
          'mx-auto grid min-h-[calc(100vh-158px)] content-start rounded-myr-panel border border-white/40 bg-[image:var(--myr-paper-background)] [background-size:26px_100%,auto] p-5 shadow-myr-panel md:p-8',
          pageShellWidthClassNames[width as PageShellWidth],
          className,
        )}
        {...props}
      />
    );
  },
);

export const PageShell = PageShellImpl as PageShellComponent;

export const Panel = createSurface('rounded-myr-card border border-myr-ink/15 bg-myr-paper/75 p-5 shadow-myr-card');
export const HomePanel = createSurface('grid gap-4.5 rounded-myr-shell border border-[rgba(220,231,242,.54)] bg-[radial-gradient(circle_at_10%_0%,rgba(124,92,255,.10),transparent_30%),linear-gradient(135deg,rgba(255,250,240,.97),rgba(255,248,232,.90))] p-myr-surface-fluid shadow-[0_24px_80px_rgba(18,16,25,.18)] max-myr-home-compact:rounded-[20px] max-myr-home-compact:p-4.5');
export const AccountPanel = createSurface('rounded-myr-shell border border-myr-line bg-[rgba(255,250,240,.92)] p-7.5 shadow-myr-surface');

export const Card = createSurface('rounded-myr-card border border-myr-line-soft bg-myr-paper-glass p-4');
export const HomeCard = createSurface('home-card relative grid min-h-57.5 content-start gap-2.5 overflow-hidden rounded-myr-panel border border-[rgba(36,27,47,.12)] bg-[rgba(255,254,249,.82)] p-myr-card-inset');
export const ArchiveCard = createSurface('rounded-myr-card border border-myr-ink/15 bg-myr-paper/75 p-4 shadow-myr-card');
export const AccountCard = createSurface('rounded-myr-shell border border-myr-line bg-[rgba(255,250,240,.9)] p-myr-section-inset shadow-myr-surface');
export const AccountFlushCard = createSurface('overflow-hidden rounded-myr-shell border border-myr-line bg-[rgba(255,250,240,.9)] shadow-myr-surface');
export const SummaryCard = createSurface('rounded-xl border border-[rgba(23,21,31,0.14)] bg-[#fffef9] p-2.25');
export const TurnCard = createSurface('session-turn group grid gap-2 rounded-myr-card border border-myr-ink/14 bg-[rgba(255,254,249,.68)] p-3.5');

export const Inset = createSurface('rounded-myr-card border border-myr-ink/15 bg-myr-vellum/45 p-5');
export const SummaryInset = createSurface('sticky top-3.5 grid max-h-[calc(100vh-28px)] self-start gap-2 overflow-auto rounded-myr-card border border-[rgba(220,231,242,0.42)] bg-[rgba(255,250,240,0.9)] p-3 shadow-[0_24px_80px_rgba(23,21,31,0.22)] max-myr-workspace:static max-myr-workspace:max-h-none');
export const AccountInset = createSurface('rounded-myr-shell border border-myr-line bg-[linear-gradient(135deg,rgba(255,250,240,.92),rgba(214,231,224,.9))] p-6.5 shadow-myr-surface');

export const DarkPanel = createSurface('rounded-3xl border border-[rgba(36,27,47,.16)] bg-[linear-gradient(180deg,rgba(25,20,33,.94),rgba(36,27,47,.88)),#191421] p-5 text-myr-paper');
export const SummaryDarkPanel = createSurface('rounded-myr-card bg-[rgba(18,16,25,0.86)] px-2.75 py-2 text-[#fff6e7]');
