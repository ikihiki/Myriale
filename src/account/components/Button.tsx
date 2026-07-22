import type { ButtonHTMLAttributes } from 'react';
import { Button as SharedButton, type ButtonSize } from '../../components/ui';

type AccountButtonVariant = 'primary' | 'ghost' | 'danger' | 'text';

const sharedVariants = {
  primary: 'secondary',
  ghost: 'ghost',
  danger: 'danger',
  text: 'text',
} as const;

export function Button({
  variant = 'ghost',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: { variant?: AccountButtonVariant; size?: ButtonSize } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <SharedButton type={type} variant={sharedVariants[variant]} size={size} className={className} {...props} />;
}
