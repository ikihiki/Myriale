import { forwardRef, type ComponentPropsWithoutRef } from 'react';

export type SessionIconProps = ComponentPropsWithoutRef<'svg'>;

const iconClassName = 'size-4.5 fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]';

function cx(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

function iconProps(className?: string) {
  return {
    className: cx(iconClassName, className),
    viewBox: '0 0 20 20',
    'aria-hidden': true,
    focusable: 'false' as const,
  };
}

export const ArrowUpIcon = forwardRef<SVGSVGElement, SessionIconProps>(
  function ArrowUpIcon({ className, ...props }, ref) {
    return <svg ref={ref} {...iconProps(className)} {...props}><path d="M10 15V5m0 0L6 9m4-4 4 4" /></svg>;
  },
);

export const RotateBackIcon = forwardRef<SVGSVGElement, SessionIconProps>(
  function RotateBackIcon({ className, ...props }, ref) {
    return <svg ref={ref} {...iconProps(className)} {...props}><path d="M6.5 6.5H3.75V3.75M4.2 6.2a7 7 0 1 1-.75 6.85" /></svg>;
  },
);

export const SparkleIcon = forwardRef<SVGSVGElement, SessionIconProps>(
  function SparkleIcon({ className, ...props }, ref) {
    return <svg ref={ref} {...iconProps(className)} {...props}><path d="M10 2.75c.45 2.65 1.85 4.05 4.5 4.5-2.65.45-4.05 1.85-4.5 4.5-.45-2.65-1.85-4.05-4.5-4.5 2.65-.45 4.05-1.85 4.5-4.5ZM15.25 12.5c.22 1.35.9 2.03 2.25 2.25-1.35.22-2.03.9-2.25 2.25-.22-1.35-.9-2.03-2.25-2.25 1.35-.22 2.03-.9 2.25-2.25Z" /></svg>;
  },
);

export const LightbulbIcon = forwardRef<SVGSVGElement, SessionIconProps>(
  function LightbulbIcon({ className, ...props }, ref) {
    return <svg ref={ref} {...iconProps(className)} {...props}><path d="M6.5 12.25c-1.1-.95-1.75-2.25-1.75-3.75a5.25 5.25 0 0 1 10.5 0c0 1.5-.65 2.8-1.75 3.75-.75.65-1 1.2-1 2H7.5c0-.8-.25-1.35-1-2ZM7.5 17h5M8 14.25h4" /></svg>;
  },
);

export const CloseIcon = forwardRef<SVGSVGElement, SessionIconProps>(
  function CloseIcon({ className, ...props }, ref) {
    return <svg ref={ref} {...iconProps(className)} {...props}><path d="m6 6 8 8m0-8-8 8" /></svg>;
  },
);
