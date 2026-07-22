import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'text';

const baseClassName = 'inline-flex cursor-pointer items-center justify-center gap-2 border border-transparent font-bold text-myr-ink transition-[transform,background,border-color] duration-150 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0';

const variantClassNames: Record<ButtonVariant, string> = {
  primary: 'rounded-full bg-myr-ink px-[18px] py-myr-control-y text-white hover:bg-[#2f2740]',
  ghost: 'rounded-full border-myr-line-strong bg-[rgba(255,250,240,.7)] px-[18px] py-myr-control-y hover:bg-myr-paper',
  danger: 'rounded-full bg-[var(--seal)] px-[18px] py-myr-control-y text-white hover:bg-[#a23b35]',
  text: 'rounded-md bg-transparent px-1 py-2 font-black text-[var(--iris-deep)] hover:translate-y-0 hover:underline',
};

export function Button({
  variant = 'ghost',
  className = '',
  type = 'button',
  ...props
}: { variant?: ButtonVariant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={`${baseClassName} ${variantClassNames[variant]} ${className}`.trim()} {...props} />;
}
