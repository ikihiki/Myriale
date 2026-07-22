export type NoticeTone = 'info' | 'success' | 'warning' | 'danger';
export type NoticeVariant = 'inverse' | 'soft';
export type BadgeTone = 'neutral' | NoticeTone;

export const toneTextClassNames: Record<BadgeTone, string> = {
  neutral: 'text-myr-slate',
  info: 'text-myr-iris',
  success: 'text-[#245741]',
  warning: 'text-[#7a571a]',
  danger: 'text-myr-ruby',
};

export const noticeToneClassNames: Record<NoticeVariant, Record<NoticeTone, string>> = {
  inverse: {
    info: 'shadow-[inset_4px_0_0_var(--iris)]',
    success: 'shadow-[inset_4px_0_0_var(--verde)]',
    warning: 'shadow-[inset_4px_0_0_var(--ember)]',
    danger: 'shadow-[inset_4px_0_0_var(--seal)]',
  },
  soft: {
    info: 'border-myr-iris/25 bg-myr-iris/10 text-myr-ink',
    success: 'border-[rgba(47,111,87,.32)] bg-[rgba(47,111,87,.1)] text-[#245741]',
    warning: 'border-myr-gold/40 bg-myr-gold/18 text-[#7a571a]',
    danger: 'border-myr-ruby/35 bg-myr-ruby/10 text-myr-ruby',
  },
};

export const noticeVariantClassNames: Record<NoticeVariant, string> = {
  inverse: 'rounded-2xl bg-[rgba(18,16,25,.86)] px-4 py-3 text-sm leading-normal text-myr-cream',
  soft: 'rounded-myr-card border px-4 py-3 text-sm leading-normal font-bold',
};

export const badgeToneClassNames: Record<BadgeTone, string> = {
  neutral: 'border-myr-line-strong bg-myr-paper-bright text-[#57515f]',
  info: 'border-myr-iris/30 bg-myr-iris/12 text-myr-iris',
  success: 'border-[rgba(47,111,87,.4)] bg-[rgba(47,111,87,.1)] text-[#245741]',
  warning: 'border-[rgba(217,164,65,.42)] bg-[rgba(217,164,65,.14)] text-[#7a571a]',
  danger: 'border-[rgba(184,69,63,.42)] bg-[rgba(184,69,63,.12)] text-[#8c322c]',
};

export const badgeDotClassNames: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--ink-soft)]',
  info: 'bg-[var(--iris)]',
  success: 'bg-[var(--verde)]',
  warning: 'bg-[var(--amber)]',
  danger: 'bg-[var(--seal)]',
};

export function noticeRecipe(tone: NoticeTone = 'info', variant: NoticeVariant = 'inverse'): string {
  return `${noticeVariantClassNames[variant]} ${noticeToneClassNames[variant][tone]}`;
}

export function badgeRecipe(tone: BadgeTone = 'neutral'): string {
  return `inline-flex w-max items-center whitespace-nowrap rounded-full border px-2.25 py-1 text-xs font-bold ${badgeToneClassNames[tone]}`;
}
