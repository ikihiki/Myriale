import { Label } from '../../components/ui';

export function SectionHead({ kicker, title, lead }: { kicker: string; title: string; lead?: string }) {
  return (
    <header className="mb-4.5">
      <Label as="p" textRole="eyebrow" className="m-0 mb-2 !text-xs !text-myr-account-ink-soft">{kicker}</Label>
      <Label as="h1" textRole="display" className="m-0 !font-[Georgia,'Times_New_Roman',serif] !text-[clamp(28px,3.6vw,48px)] !leading-[.98] !tracking-[-.045em]">{title}</Label>
      {lead && <Label as="p" textRole="body" className="mt-2.5 mb-0 max-w-[56ch] !leading-[1.6] !text-myr-account-ink-soft">{lead}</Label>}
    </header>
  );
}
