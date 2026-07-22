export function SectionHead({ kicker, title, lead }: { kicker: string; title: string; lead?: string }) {
  return (
    <header className="mb-[18px]">
      <p className="m-0 mb-2 text-xs font-extrabold tracking-[.16em] text-myr-account-ink-soft uppercase">{kicker}</p>
      <h1 className="m-0 font-[Georgia,'Times_New_Roman',serif] text-[clamp(28px,3.6vw,48px)] leading-[.98] tracking-[-.045em]">{title}</h1>
      {lead && <p className="mt-2.5 mb-0 max-w-[56ch] leading-[1.6] text-myr-account-ink-soft">{lead}</p>}
    </header>
  );
}
