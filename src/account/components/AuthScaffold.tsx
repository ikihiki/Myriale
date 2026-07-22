import type { ReactNode } from 'react';
import { DeskBrand } from './DeskBrand';
import { SectionHead } from './SectionHead';

export function AuthScaffold({
  ariaLabel,
  kicker,
  title,
  lead,
  children,
  context,
  footer,
}: {
  ariaLabel: string;
  kicker: string;
  title: string;
  lead?: string;
  children: ReactNode;
  context?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(360px,480px)_minmax(0,360px)] items-start justify-center gap-[18px] px-[22px] py-[clamp(20px,5vh,56px)] max-[1080px]:grid-cols-[minmax(0,480px)]">
      <main
        className="rounded-myr-shell border border-myr-line bg-[rgba(255,250,240,.92)] p-[30px] shadow-myr-surface [&_.desk-brand]:mb-[22px]"
        aria-label={ariaLabel}
      >
        <DeskBrand />
        <SectionHead kicker={kicker} title={title} lead={lead} />
        {children}
        {footer && (
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-myr-line pt-4 text-myr-ui-sm text-myr-account-ink-soft">
            {footer}
          </div>
        )}
      </main>
      {context && (
        <aside
          className="rounded-myr-shell border border-myr-line bg-[linear-gradient(135deg,rgba(255,250,240,.92),rgba(214,231,224,.9))] p-[26px] shadow-myr-surface [&_.identity-seal]:mt-1 [&_.identity-seal]:mb-[18px] [&_h3]:mt-0 [&_h3]:mb-3.5 [&_h3]:font-[Georgia,serif] [&_h3]:text-2xl [&_li]:my-3 [&_li]:leading-6 [&_li]:text-[#5f506c] [&_ol]:m-0 [&_ol]:pl-[18px] [&_ul]:m-0 [&_ul]:pl-[18px]"
          aria-label="補足情報"
        >
          {context}
        </aside>
      )}
    </div>
  );
}
