export type NavigationRole = 'appChromeItem' | 'menuItem' | 'breadcrumb' | 'railItem' | 'tabItem';
export type RailDensity = 'wizard' | 'account';

export type NavigationRecipeOptions =
  | { role: 'appChromeItem'; active?: boolean }
  | { role: 'menuItem'; danger?: boolean }
  | { role: 'breadcrumb'; current?: boolean }
  | { role: 'railItem'; active?: boolean; density: RailDensity }
  | { role: 'tabItem' };

const focusRingClassName = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-myr-iris';
const chromeFocusRingClassName = `${focusRingClassName} focus-visible:rounded-md`;

const appChromeItemBaseClassName = [
  'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-[9px] text-sm font-bold',
  'transition-[background,color] duration-150 ease-[ease] motion-reduce:transition-none',
  chromeFocusRingClassName,
].join(' ');

export const appChromeItemStateClassNames: Record<'active' | 'inactive', string> = {
  active: 'border-myr-ember bg-myr-paper text-myr-void',
  inactive: 'border-transparent bg-transparent text-[rgba(255,246,231,.86)] hover:bg-[rgba(255,246,231,.1)] hover:text-myr-cream',
};

const menuItemBaseClassName = '!grid !w-full !cursor-pointer !gap-0.5 !rounded-myr-control !bg-transparent !px-3 !py-[9px] !text-left';

export const menuItemToneClassNames: Record<'default' | 'danger', string> = {
  default: '!text-myr-ink hover:!bg-[rgba(124,92,255,.1)] data-[highlighted]:!bg-[rgba(124,92,255,.1)]',
  danger: '!mt-1 !rounded-t-none !rounded-b-[10px] !border-t !border-[rgba(36,27,47,.12)] !text-[#b8453f] hover:!bg-[rgba(184,69,63,.1)] data-[highlighted]:!bg-[rgba(184,69,63,.1)]',
};

export const breadcrumbStateClassNames: Record<'current' | 'ancestor', string> = {
  current: 'font-bold text-myr-cream',
  ancestor: 'text-[rgba(255,246,231,.62)]',
};

export const breadcrumbLinkClassName = [
  'cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[rgba(255,246,231,.7)]',
  'hover:text-myr-cream hover:underline',
  chromeFocusRingClassName,
].join(' ');

const railItemBaseClassName = [
  'w-full cursor-pointer border-0 text-left',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-myr-iris',
  'disabled:cursor-not-allowed disabled:opacity-40',
].join(' ');

export const railItemDensityClassNames: Record<RailDensity, string> = {
  wizard: 'grid gap-px rounded-myr-control bg-transparent px-[9px] py-2 text-[#f4eedf] [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[10px] [&_small]:leading-[1.2] [&_small]:text-[#bfc8d5] [&_span]:text-xs [&_span]:font-black [&_span]:leading-[1.2] [&_span]:text-myr-gold',
  account: 'rounded-full border border-transparent bg-[rgba(255,250,240,.08)] px-3.5 py-3 font-bold text-myr-cream transition-colors duration-150 hover:bg-[rgba(255,250,240,.16)]',
};

export const railItemActiveClassNames: Record<RailDensity, string> = {
  wizard: 'bg-[rgba(217,164,65,0.14)] shadow-[inset_3px_0_0_#d9a441] [&_small]:text-[#dce7f2]',
  account: 'border-[var(--ember)] bg-myr-paper text-[var(--void)] hover:bg-myr-paper',
};

const tabItemClassName = [
  'cursor-pointer rounded-full border-0 bg-transparent px-3.5 py-[9px] [font:inherit]',
  'text-myr-ui-sm font-[850] text-[var(--myr-ui-ink-soft)]',
  'data-[state=active]:bg-[var(--myr-ui-ink)] data-[state=active]:text-white',
  focusRingClassName,
].join(' ');

export function navigationRecipe(options: NavigationRecipeOptions): string {
  switch (options.role) {
    case 'appChromeItem':
      return `${appChromeItemBaseClassName} ${appChromeItemStateClassNames[options.active ? 'active' : 'inactive']}`;
    case 'menuItem':
      return `${menuItemBaseClassName} ${menuItemToneClassNames[options.danger ? 'danger' : 'default']}`;
    case 'breadcrumb':
      return breadcrumbStateClassNames[options.current ? 'current' : 'ancestor'];
    case 'railItem':
      return [
        railItemBaseClassName,
        railItemDensityClassNames[options.density],
        options.active ? railItemActiveClassNames[options.density] : '',
      ].filter(Boolean).join(' ');
    case 'tabItem':
      return tabItemClassName;
  }
}
