import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { controlClassName, inputVariantClassNames, type InputVariant } from './controlRecipes';

export type InputProps = ComponentPropsWithoutRef<'input'> & {
  variant?: InputVariant;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, variant = 'field', ...props }, ref) {
    return <input ref={ref} className={controlClassName(inputVariantClassNames[variant], className)} {...props} />;
  },
);
