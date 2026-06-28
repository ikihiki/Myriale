import type { ButtonHTMLAttributes } from 'react';

export function Button({
  variant = 'ghost',
  className = '',
  type = 'button',
  ...props
}: { variant?: 'primary' | 'ghost' | 'danger' | 'text' } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={`btn btn-${variant} ${className}`.trim()} {...props} />;
}
