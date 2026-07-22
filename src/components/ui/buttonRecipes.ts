export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'text' | 'danger' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'iconSm' | 'iconMd';
export type ButtonSurface = 'light' | 'dark';

const interactiveClassName = [
  '[font:inherit] inline-flex cursor-pointer items-center justify-center gap-2 border font-extrabold',
  'transition-[transform,background-color,border-color,color,box-shadow] duration-150',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-myr-iris',
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0',
  'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
].join(' ');

const variantClassNames: Record<ButtonSurface, Record<ButtonVariant, string>> = {
  light: {
    primary: 'rounded-full border-myr-ink/15 bg-myr-gold text-myr-void hover:-translate-y-px hover:bg-myr-ink hover:text-myr-paper',
    secondary: 'rounded-full border-transparent bg-myr-ink text-myr-paper hover:-translate-y-px hover:bg-myr-iris',
    ghost: 'rounded-full border-myr-ink/25 bg-transparent text-myr-ink hover:-translate-y-px hover:border-myr-iris hover:text-myr-iris',
    text: 'rounded-none border-transparent bg-transparent text-myr-iris underline-offset-4 hover:text-myr-ruby hover:underline',
    danger: 'rounded-full border-transparent bg-myr-ruby text-white hover:-translate-y-px hover:bg-[#a23b35]',
    icon: 'rounded-full border-transparent bg-transparent text-myr-ink hover:bg-myr-ink/10 hover:text-myr-iris',
  },
  dark: {
    primary: 'rounded-full border-myr-gold bg-myr-gold text-myr-void hover:-translate-y-px hover:bg-myr-paper',
    secondary: 'rounded-full border-myr-paper/20 bg-myr-paper text-myr-void hover:-translate-y-px hover:bg-white',
    ghost: 'rounded-full border-myr-paper/35 bg-transparent text-myr-paper hover:-translate-y-px hover:border-myr-gold hover:text-myr-gold',
    text: 'rounded-none border-transparent bg-transparent text-myr-paper underline-offset-4 hover:text-myr-gold hover:underline',
    danger: 'rounded-full border-transparent bg-myr-ruby text-white hover:-translate-y-px hover:bg-[#d45c55]',
    icon: 'rounded-full border-transparent bg-transparent text-myr-paper hover:bg-white/10 hover:text-myr-gold',
  },
};

export const buttonSizeClassNames: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
  iconSm: 'size-7.5 shrink-0 p-0 text-sm',
  iconMd: 'size-8.5 shrink-0 p-0 text-base',
};

export const actionRowClassName = 'flex flex-wrap gap-2.5';

export function buttonRecipe({
  variant,
  size = variant === 'icon' ? 'iconMd' : 'md',
  surface = 'light',
}: {
  variant: ButtonVariant;
  size?: ButtonSize;
  surface?: ButtonSurface;
}) {
  return [interactiveClassName, variantClassNames[surface][variant], buttonSizeClassNames[size]].join(' ');
}
