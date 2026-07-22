import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentPropsWithRef,
  type ElementType,
  type ReactElement,
} from 'react';

export type TextRole =
  | 'display'
  | 'section'
  | 'sectionEditorial'
  | 'eyebrow'
  | 'eyebrowData'
  | 'label'
  | 'body'
  | 'bodySm'
  | 'caption'
  | 'data';

const textRoleClassNames: Record<TextRole, string> = {
  display: 'font-myr-display text-[clamp(2.25rem,5vw,4.75rem)] leading-[0.95] tracking-[-0.055em]',
  section: 'font-myr-display text-[clamp(1.75rem,3vw,2.5rem)] leading-none tracking-myr-display',
  sectionEditorial: "font-['Yu_Mincho','Hiragino_Mincho_ProN',Georgia,serif] text-[clamp(28px,4vw,44px)] tracking-[-.06em]",
  eyebrow: 'text-myr-caption font-extrabold tracking-[0.16em] text-myr-ink-subtle uppercase',
  eyebrowData: 'font-myr-mono text-myr-caption font-black tracking-[0.14em] text-myr-ruby uppercase',
  label: 'text-xs font-black tracking-myr-label text-myr-slate',
  body: 'text-base leading-7 text-myr-slate',
  bodySm: 'text-sm leading-6 text-myr-slate',
  caption: 'text-myr-caption font-extrabold text-myr-ink-subtle',
  data: 'font-myr-mono text-xs text-myr-slate',
};

type LabelOwnProps = {
  textRole: TextRole;
};

export type LabelProps<Element extends ElementType = 'span'> = LabelOwnProps & {
  as?: Element;
} & Omit<ComponentPropsWithoutRef<Element>, keyof LabelOwnProps | 'as'>;

type LabelComponent = <Element extends ElementType = 'span'>(
  props: LabelProps<Element> & { ref?: ComponentPropsWithRef<Element>['ref'] },
) => ReactElement | null;

function cx(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

const LabelImpl = forwardRef<HTMLElement, LabelProps<ElementType>>(
  function Label({ as, textRole, className, ...props }, ref) {
    const Component = as ?? 'span';
    return <Component ref={ref} className={cx(textRoleClassNames[textRole as TextRole], className)} {...props} />;
  },
);

export const Label = LabelImpl as LabelComponent;
