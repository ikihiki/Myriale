import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { controlClassName, textareaVariantClassNames, type TextareaVariant } from './controlRecipes';

export type TextareaProps = ComponentPropsWithoutRef<'textarea'> & {
  variant?: TextareaVariant;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, variant = 'field', ...props }, ref) {
    return <textarea ref={ref} className={controlClassName(textareaVariantClassNames[variant], className)} {...props} />;
  },
);
