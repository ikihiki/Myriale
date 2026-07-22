import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { badgeDotClassNames, badgeRecipe, type BadgeTone } from './statusRecipes';

function cx(...classNames: Array<string | undefined | false>) {
  return classNames.filter(Boolean).join(' ');
}

export type BadgeProps = ComponentPropsWithoutRef<'span'> & {
  tone?: BadgeTone;
  dot?: boolean;
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge({ children, className, dot = false, tone = 'neutral', ...props }, ref) {
    return (
      <span ref={ref} className={cx(badgeRecipe(tone), dot && 'gap-1.75', className)} {...props}>
        {dot && <span className={`size-2 shrink-0 rounded-full ${badgeDotClassNames[tone]}`} aria-hidden="true" />}
        {children}
      </span>
    );
  },
);
