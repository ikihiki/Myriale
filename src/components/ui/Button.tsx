import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { buttonRecipe, type ButtonSize, type ButtonSurface, type ButtonVariant } from './buttonRecipes';

const compatibilityClassName = 'cursor-pointer border-0 [font:inherit] disabled:cursor-not-allowed';

function cx(...classNames: Array<string | undefined | false>) {
  return classNames.filter(Boolean).join(' ');
}

export type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  surface?: ButtonSurface;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, surface, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cx(variant ? buttonRecipe({ variant, size, surface }) : compatibilityClassName, className)}
        {...props}
      />
    );
  },
);
