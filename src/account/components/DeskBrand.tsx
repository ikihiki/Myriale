export function DeskBrand({ subtitle = 'AI story atelier' }: { subtitle?: string }) {
  return (
    <div className="desk-brand flex items-center gap-3">
      <span className="grid size-13 shrink-0 place-items-center rounded-full border border-[rgba(255,255,255,.28)] bg-[conic-gradient(from_180deg,var(--iris),var(--ember),var(--mist),var(--iris))] font-['Shippori_Mincho',Georgia,serif] text-[22px] font-black text-[#17121d]" aria-hidden="true">霧</span>
      <div>
        <strong className="block font-[Georgia,'Times_New_Roman',serif] text-[22px] tracking-myr-label">Myriale</strong>
        <small className="text-xs tracking-[.18em] text-myr-account-ink-soft uppercase">{subtitle}</small>
      </div>
    </div>
  );
}
