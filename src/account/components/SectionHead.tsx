export function SectionHead({ kicker, title, lead }: { kicker: string; title: string; lead?: string }) {
  return (
    <header className="section-head">
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
      {lead && <p className="section-lead">{lead}</p>}
    </header>
  );
}
