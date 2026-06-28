export function DeskBrand({ subtitle = 'AI story atelier' }: { subtitle?: string }) {
  return (
    <div className="desk-brand">
      <span className="desk-sigil" aria-hidden="true">霧</span>
      <div>
        <strong>Myriale</strong>
        <small>{subtitle}</small>
      </div>
    </div>
  );
}
