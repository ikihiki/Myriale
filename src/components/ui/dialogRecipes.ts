export type DialogSize = 'default' | 'wide' | 'editor';
export type DialogTone = 'default' | 'warning';
export type DialogRole = 'overlay' | 'surface' | 'sigil' | 'title' | 'description' | 'body' | 'footer' | 'close';

export const dialogSizeClassNames: Record<DialogSize, string> = {
  default: 'w-[min(540px,calc(100vw-32px))]',
  wide: 'w-[min(620px,calc(100vw-32px))]',
  editor: 'w-[min(760px,calc(100vw-32px))]',
};

export const dialogSurfaceToneClassNames: Record<DialogTone, string> = {
  default: 'border-white/70 bg-[linear-gradient(135deg,rgba(255,250,240,.98),rgba(239,227,198,.96))] text-myr-ink',
  warning: 'border-myr-ruby/35 bg-[linear-gradient(135deg,rgba(255,248,236,.98),rgba(255,226,211,.96))] text-[#4f3030]',
};

const roleClassNames: Record<Exclude<DialogRole, 'surface' | 'title' | 'description'>, string> = {
  overlay: 'fixed inset-0 z-[60] bg-[radial-gradient(circle_at_30%_20%,rgba(124,92,255,.22),transparent_28%),rgba(18,16,25,.66)] backdrop-blur-[6px]',
  sigil: 'mb-4 grid size-11 place-items-center rounded-full bg-[conic-gradient(from_180deg,var(--myr-color-iris),var(--myr-color-ember),var(--myr-color-mist),var(--myr-color-iris))] font-myr-display text-xl font-black text-[#17121d]',
  body: 'mt-5 leading-[1.65]',
  footer: 'mt-6 flex flex-wrap justify-end gap-2.5 border-t border-myr-ink/10 pt-4',
  close: 'absolute right-[18px] top-[18px] inline-grid size-[34px] cursor-pointer place-items-center rounded-full border border-myr-ink/20 bg-myr-paper/80 font-bold text-myr-ink transition-colors hover:border-myr-iris hover:text-myr-iris focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-myr-iris',
};

const titleToneClassNames: Record<DialogTone, string> = {
  default: 'text-myr-ink',
  warning: 'text-myr-ruby',
};

const descriptionToneClassNames: Record<DialogTone, string> = {
  default: 'text-[#5f506c]',
  warning: 'text-[#684747]',
};

export function dialogRecipe(options: {
  role: DialogRole;
  size?: DialogSize;
  tone?: DialogTone;
}): string {
  const tone = options.tone ?? 'default';

  if (options.role === 'surface') {
    return [
      'fixed left-1/2 top-1/2 z-[70] box-border grid max-h-[calc(100vh-32px)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-myr-shell border p-7 font-myr-body shadow-[0_24px_80px_rgba(18,16,25,.24)] outline-none max-sm:max-h-[calc(100vh-24px)] max-sm:w-[calc(100vw-24px)] max-sm:p-5',
      dialogSizeClassNames[options.size ?? 'default'],
      dialogSurfaceToneClassNames[tone],
    ].join(' ');
  }

  if (options.role === 'title') {
    return ['m-0 pr-10 font-myr-display text-[clamp(26px,4vw,38px)] leading-none tracking-myr-display', titleToneClassNames[tone]].join(' ');
  }

  if (options.role === 'description') {
    return ['mt-2.5 mb-0 leading-relaxed', descriptionToneClassNames[tone]].join(' ');
  }

  return roleClassNames[options.role];
}
