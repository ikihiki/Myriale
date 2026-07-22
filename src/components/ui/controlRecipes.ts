export type InputVariant = 'field' | 'underline' | 'compact' | 'borderless';
export type TextareaVariant = InputVariant | 'composer';

const commonStateClassName = 'focus-visible:border-myr-iris focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-myr-iris aria-invalid:border-myr-ruby aria-invalid:bg-[#fff7f5] read-only:border-myr-ink/15 read-only:bg-myr-vellum/35 read-only:text-myr-slate disabled:cursor-not-allowed disabled:border-myr-ink/15 disabled:bg-myr-vellum/35 disabled:text-myr-slate disabled:opacity-60';

export const inputVariantClassNames: Record<InputVariant, string> = {
  field: '[font:inherit] w-full rounded-2xl border border-myr-line bg-myr-paper-bright px-3.5 py-3 text-myr-ink',
  underline: '[font:inherit] w-full rounded-none border-x-0 border-t-0 border-b-2 border-myr-ink/20 bg-white/45 px-3 py-2.5 text-myr-ink shadow-none',
  compact: '[font:inherit] min-h-myr-control-compact w-full rounded-2xl border border-myr-line bg-myr-paper-bright px-2 py-1.5 text-myr-ui-sm text-myr-ink',
  borderless: '[font:inherit] w-full rounded-none border-0 bg-transparent px-3.5 py-3 text-myr-ink shadow-none',
};

export const textareaVariantClassNames: Record<TextareaVariant, string> = {
  field: '[font:inherit] min-h-myr-textarea-min w-full resize-y rounded-2xl border border-myr-line bg-myr-paper-bright px-3.5 py-3 text-myr-ink',
  underline: '[font:inherit] min-h-myr-textarea-min w-full resize-y rounded-none border-x-0 border-t-0 border-b-2 border-myr-ink/20 bg-white/45 px-3 py-2.5 text-myr-ink shadow-none',
  compact: '[font:inherit] min-h-myr-control-compact w-full resize-y rounded-2xl border border-myr-line bg-myr-paper-bright px-2 py-1.5 text-myr-ui-sm text-myr-ink',
  borderless: '[font:inherit] min-h-myr-textarea-min w-full resize-y rounded-none border-0 bg-transparent px-3.5 py-3 text-myr-ink shadow-none',
  composer: '[font:inherit] block min-h-myr-composer-min max-h-myr-composer-max w-full resize-y rounded-none border-0 bg-transparent px-4.75 pt-4.25 pb-2 text-myr-control leading-[1.6] text-[#24212d] shadow-none placeholder:text-[#8a8791] focus:outline-none focus:shadow-none',
};

export function controlClassName(variantClassName: string, className?: string) {
  return [variantClassName, commonStateClassName, className].filter(Boolean).join(' ');
}
