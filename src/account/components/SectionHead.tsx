import { textRecipe } from '../../components/ui';

export function SectionHead({ kicker, title, lead }: { kicker: string; title: string; lead?: string }) {
  return (
    <header className="mb-4.5">
      <p className={`m-0 mb-2 ${textRecipe('eyebrow')} !text-xs !text-myr-account-ink-soft`}>{kicker}</p>
      <h1 className={`m-0 ${textRecipe('display')} !font-[Georgia,'Times_New_Roman',serif] !text-[clamp(28px,3.6vw,48px)] !leading-[.98] !tracking-[-.045em]`}>{title}</h1>
      {lead && <p className={`mt-2.5 mb-0 max-w-[56ch] ${textRecipe('body')} !leading-[1.6] !text-myr-account-ink-soft`}>{lead}</p>}
    </header>
  );
}
