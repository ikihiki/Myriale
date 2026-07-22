export type SurfaceWidth = 'content' | 'focused' | 'chrome' | 'reading';
export type SurfaceVariant = 'default' | 'home' | 'archive' | 'account' | 'accountFlush' | 'summary' | 'turn';
export type SurfaceRole = 'canvas' | 'shell' | 'panel' | 'card' | 'inset' | 'dark';

export type SurfaceRecipeOptions =
  | { role: 'canvas' }
  | { role: 'shell'; width: SurfaceWidth }
  | { role: 'panel'; variant?: Extract<SurfaceVariant, 'default' | 'home' | 'account'> }
  | { role: 'card'; variant?: Extract<SurfaceVariant, 'default' | 'home' | 'archive' | 'account' | 'accountFlush' | 'summary' | 'turn'> }
  | { role: 'inset'; variant?: Extract<SurfaceVariant, 'default' | 'summary' | 'account'> }
  | { role: 'dark'; variant?: Extract<SurfaceVariant, 'default' | 'summary'> };

export const canvasSurfaceClassName =
  'min-h-[calc(100vh-118px)] bg-[image:var(--myr-screen-background)] p-3 font-myr-body text-myr-ink md:p-5';

export const shellSurfaceClassNames: Record<SurfaceWidth, string> = {
  content: 'mx-auto grid min-h-[calc(100vh-158px)] max-w-[1180px] content-start rounded-myr-panel border border-white/40 bg-[image:var(--myr-paper-background)] [background-size:26px_100%,auto] p-5 shadow-myr-panel md:p-8',
  focused: 'mx-auto grid min-h-[calc(100vh-158px)] max-w-[1040px] content-start rounded-myr-panel border border-white/40 bg-[image:var(--myr-paper-background)] [background-size:26px_100%,auto] p-5 shadow-myr-panel md:p-8',
  chrome: 'mx-auto grid w-full max-w-[1320px] content-start rounded-myr-panel border border-white/40 bg-[image:var(--myr-paper-background)] [background-size:26px_100%,auto] p-5 shadow-myr-panel md:p-8',
  reading: 'mx-auto grid w-full max-w-[720px] content-start rounded-myr-panel border border-white/40 bg-[image:var(--myr-paper-background)] [background-size:26px_100%,auto] p-5 shadow-myr-panel md:p-8',
};

export const panelSurfaceClassNames = {
  default: 'rounded-myr-card border border-myr-ink/15 bg-myr-paper/75 p-5 shadow-myr-card',
  home: 'grid gap-[18px] rounded-myr-shell border border-[rgba(220,231,242,.54)] bg-[radial-gradient(circle_at_10%_0%,rgba(124,92,255,.10),transparent_30%),linear-gradient(135deg,rgba(255,250,240,.97),rgba(255,248,232,.90))] p-[clamp(18px,3vw,26px)] shadow-[0_24px_80px_rgba(18,16,25,.18)] max-[720px]:rounded-[20px] max-[720px]:p-[18px]',
  account: 'rounded-myr-shell border border-myr-line bg-[rgba(255,250,240,.92)] p-[30px] shadow-myr-surface',
} as const;

export const cardSurfaceClassNames = {
  default: 'rounded-myr-card border border-myr-line-soft bg-myr-paper-glass p-4',
  home: 'home-card relative grid min-h-[230px] content-start gap-[10px] overflow-hidden rounded-myr-panel border border-[rgba(36,27,47,.12)] bg-[rgba(255,254,249,.82)] p-myr-card-inset',
  archive: 'rounded-myr-card border border-myr-ink/15 bg-myr-paper/75 p-4 shadow-myr-card',
  account: 'rounded-myr-shell border border-myr-line bg-[rgba(255,250,240,.9)] p-myr-section-inset shadow-myr-surface',
  accountFlush: 'overflow-hidden rounded-myr-shell border border-myr-line bg-[rgba(255,250,240,.9)] shadow-myr-surface',
  summary: 'rounded-xl border border-[rgba(23,21,31,0.14)] bg-[#fffef9] p-[9px]',
  turn: 'session-turn group grid gap-2 rounded-myr-card border border-myr-ink/14 bg-[rgba(255,254,249,.68)] p-3.5',
} as const;

export const insetSurfaceClassNames = {
  default: 'rounded-myr-card border border-myr-ink/15 bg-myr-vellum/45 p-5',
  summary: 'sticky top-3.5 grid max-h-[calc(100vh-28px)] self-start gap-2 overflow-auto rounded-[18px] border border-[rgba(220,231,242,0.42)] bg-[rgba(255,250,240,0.9)] p-3 shadow-[0_24px_80px_rgba(23,21,31,0.22)] max-[1120px]:static max-[1120px]:max-h-none',
  account: 'rounded-myr-shell border border-myr-line bg-[linear-gradient(135deg,rgba(255,250,240,.92),rgba(214,231,224,.9))] p-[26px] shadow-myr-surface',
} as const;

export const darkSurfaceClassNames = {
  default: 'rounded-3xl border border-[rgba(36,27,47,.16)] bg-[linear-gradient(180deg,rgba(25,20,33,.94),rgba(36,27,47,.88)),#191421] p-5 text-myr-paper',
  summary: 'rounded-myr-card bg-[rgba(18,16,25,0.86)] px-[11px] py-2 text-[#fff6e7]',
} as const;

export function surfaceRecipe(options: SurfaceRecipeOptions): string {
  switch (options.role) {
    case 'canvas': return canvasSurfaceClassName;
    case 'shell': return shellSurfaceClassNames[options.width];
    case 'panel': return panelSurfaceClassNames[options.variant ?? 'default'];
    case 'card': return cardSurfaceClassNames[options.variant ?? 'default'];
    case 'inset': return insetSurfaceClassNames[options.variant ?? 'default'];
    case 'dark': return darkSurfaceClassNames[options.variant ?? 'default'];
  }
}
