import { surfaceRecipe, textRecipe } from '../components/ui';

export const scenarioWizardShellClass = [
  'grid min-h-screen grid-cols-[168px_minmax(560px,1fr)_minmax(260px,300px)] items-start gap-3 p-3.5 text-[#17151f]',
  'bg-[radial-gradient(circle_at_12%_18%,rgba(124,92,255,0.2),transparent_24%),radial-gradient(circle_at_92%_8%,rgba(217,164,65,0.24),transparent_20%),linear-gradient(135deg,#17151f_0%,#283244_46%,#dce7f2_100%)]',
  'max-[1120px]:grid-cols-1',
].join(' ');

export const wizardPaperClass = [
  'grid min-h-[calc(100vh-28px)] content-start rounded-[22px] border border-[rgba(220,231,242,0.42)] px-6 py-5',
  'bg-[linear-gradient(90deg,rgba(184,74,74,0.08)_0_1px,transparent_1px_100%),linear-gradient(180deg,rgba(255,255,255,0.86),rgba(220,231,242,0.92))] bg-[length:26px_100%,auto]',
  'shadow-[0_24px_80px_rgba(23,21,31,0.22)] max-[1120px]:min-h-0',
].join(' ');

export const wizardKickerClass = `mb-1 ${textRecipe('eyebrow')} !text-[10px] !tracking-[0.14em] !text-[#6d587a]`;
export const wizardNoticeClass = 'my-2.5 rounded-xl bg-[rgba(18,16,25,0.86)] px-[11px] py-2 text-[13px] text-[#fff6e7]';
export const wizardButtonRowClass = 'mt-2 flex flex-wrap gap-[7px]';

export const wizardPanelClass = [
  'max-w-none border-0 bg-transparent px-0 pt-0.5 pb-3',
  '[&_h2]:mb-1 [&_h2]:font-serif [&_h2]:text-[clamp(28px,3.2vw,46px)] [&_h2]:leading-none [&_h2]:tracking-[-0.05em]',
  '[&_p]:my-1.5 [&_p]:mb-3 [&_p]:max-w-[860px] [&_p]:text-[13px] [&_p]:text-[#566072]',
  '[&_label]:my-3 [&_label]:grid [&_label]:gap-[5px] [&_label]:text-xs [&_label]:font-black [&_label]:tracking-[0.02em] [&_label]:text-[#4f5767]',
  '[&_input]:rounded-none [&_input]:border-x-0 [&_input]:border-t-0 [&_input]:border-b-2 [&_input]:border-[rgba(23,21,31,0.22)] [&_input]:bg-white/40 [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-[15px] [&_input]:shadow-none',
  '[&_select]:rounded-none [&_select]:border-x-0 [&_select]:border-t-0 [&_select]:border-b-2 [&_select]:border-[rgba(23,21,31,0.22)] [&_select]:bg-white/40 [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-[15px] [&_select]:shadow-none',
  '[&_textarea]:min-h-[clamp(280px,48vh,560px)] [&_textarea]:rounded-none [&_textarea]:border-x-0 [&_textarea]:border-t-0 [&_textarea]:border-b-2 [&_textarea]:border-[rgba(23,21,31,0.22)] [&_textarea]:bg-white/40 [&_textarea]:px-3 [&_textarea]:py-3.5 [&_textarea]:text-base [&_textarea]:leading-[1.7] [&_textarea]:shadow-none',
].join(' ');

export const illustrationWizardPanelClass = `${wizardPanelClass} [&_textarea]:min-h-[clamp(150px,24vh,260px)]`;

export const wizardProgressClass = [
  'my-2 grid grid-cols-[auto_1fr] items-baseline gap-x-2 border-b border-[rgba(23,21,31,0.18)] pb-2.5',
  '[&_span]:row-span-2 [&_span]:font-mono [&_span]:text-[28px] [&_span]:leading-[0.9] [&_span]:text-[#b84a4a]',
  '[&_strong]:font-serif [&_strong]:text-xl [&_strong]:tracking-[-0.04em]',
  '[&_small]:text-[11px] [&_small]:text-[#566072]',
].join(' ');

export const wizardActionsClass = 'flex max-w-none justify-between gap-3 border-t border-[rgba(23,21,31,0.18)] pt-3';

export const wizardSummaryClass = [
  surfaceRecipe({ role: 'inset', variant: 'summary' }),
  '[&_h2]:m-0 [&_h2]:font-serif [&_h2]:text-lg [&_h2]:tracking-[-0.04em]',
  '[&_label]:my-1.5 [&_label]:grid [&_label]:gap-1 [&_label]:text-[11px] [&_label]:font-black',
  '[&_select]:w-full [&_select]:rounded-[10px] [&_select]:border [&_select]:border-[rgba(23,21,31,0.18)] [&_select]:bg-[#fffef9] [&_select]:px-2.5 [&_select]:py-2 [&_select]:text-xs [&_select]:text-[#17151f]',
  '[&_h3]:mb-[5px] [&_h3]:mt-0 [&_h3]:text-xs',
  '[&_p]:my-1 [&_p]:line-clamp-3 [&_p]:overflow-hidden [&_p]:text-[11px] [&_p]:leading-[1.35] [&_p]:text-[#3f4552]',
].join(' ');
