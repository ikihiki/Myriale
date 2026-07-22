import type { ReactNode } from 'react';

/**
 * SessionTurn — the shared turn-display component used by every session-play
 * surface (AI dialogue and program-driven scenes).
 *
 * Every turn reads the same way: the user's action comes first, then its
 * result. Concretely a turn is an optional action slot (e.g. a "ここまで戻る"
 * button), the *lead* block (what the user/system did), and then the AI
 * Narrative body (what resulted). The lead is the only part that differs
 * between modes:
 *   - AI dialogue: the lead is the player's free-text input (tone="player").
 *   - Program-driven: the lead is the program-confirmed action/fact (tone="program").
 * Both share the same Narrative body, so the two surfaces use one component,
 * one ordering (input → result), and one set of styles.
 */

export type TurnLeadTone = 'player' | 'program';

export type TurnLead = {
  tone: TurnLeadTone;
  /** Short glyph/label chip shown before the text (e.g. "⟶" or "PROGRAM"). */
  tag: string;
  /** Screen-reader label for the lead text (e.g. "プレイヤーの入力: "). */
  srLabel?: string;
  text: ReactNode;
  /** Optional testid for the lead block. */
  testId?: string;
  /**
   * Controls shown inside the lead, directly under the input/fact line
   * (e.g. an interpretation toggle for a player input).
   */
  actions?: ReactNode;
  /**
   * Expandable detail rendered inside the lead, under the actions
   * (e.g. how the player input was interpreted).
   */
  detail?: ReactNode;
};

export type SessionTurnProps = {
  /** Quiet action row shown after the Narrative (e.g. a "ここまで戻る" button). */
  headingActions?: ReactNode;
  /**
   * Lead block shown *before* the Narrative: the user input (AI dialogue) or the
   * program-confirmed action/fact (program-driven). The turn always reads
   * input → result.
   */
  lead?: TurnLead;
  /** AI Narrative body (the result of the lead). */
  narrative: ReactNode;
  /** Tag chip for the Narrative (e.g. "AI"); omitted when not needed. */
  narrativeTag?: string;
  /** Optional testid for the Narrative paragraph. */
  narrativeTestId?: string;
  selected?: boolean;
  /** Extra class for accent variants (e.g. `turn-battle`). */
  variantClassName?: string;
  ariaLabel?: string;
  testId?: string;
  /** Ref callback for the article element (used for scroll-into-view). */
  articleRef?: (node: HTMLElement | null) => void;
};

const leadClass: Record<TurnLeadTone, string> = {
  player: 'rounded-[14px] bg-[linear-gradient(135deg,rgba(124,92,255,.12),rgba(124,92,255,.04))] px-3.5 py-3 font-bold text-[#2c2540]',
  program: 'rounded-myr-control bg-myr-ink/6 px-2.5 py-2 font-mono text-xs leading-normal text-myr-plum',
};

const leadTagClass: Record<TurnLeadTone, string> = {
  player: 'text-base leading-[1.4] text-myr-iris',
  program: 'inline-block rounded-full bg-myr-plum px-2 py-px align-middle text-[10px] font-black tracking-[.1em] text-myr-paper',
};

const variantClass: Record<string, string> = {
  '': '',
  'turn-battle': 'border-l-[3px] border-l-myr-ruby',
  'turn-roll': 'border-l-[3px] border-l-[#7054dd]',
  'turn-event': 'border-l-[3px] border-l-[#c77d16]',
  'turn-dialogue': 'border-l-[3px] border-l-[#4a845c]',
};

function TurnLeadBlock({ lead }: { lead: TurnLead }) {
  return (
    <div className={`grid max-w-none gap-2 ${leadClass[lead.tone]}`} data-testid={lead.testId}>
      <p className="m-0 flex max-w-none items-baseline gap-2.5">
        <span className={`shrink-0 ${leadTagClass[lead.tone]}`} aria-hidden="true">{lead.tag}</span>
        {lead.srLabel && <span className="sr-only">{lead.srLabel}</span>}
        <span className="flex-auto">{lead.text}</span>
      </p>
      {lead.actions && <div className="flex flex-wrap gap-2">{lead.actions}</div>}
      {lead.detail}
    </div>
  );
}

export function SessionTurn({
  headingActions,
  lead,
  narrative,
  narrativeTag,
  narrativeTestId,
  selected = false,
  variantClassName = '',
  ariaLabel,
  testId,
  articleRef,
}: SessionTurnProps) {
  const narrativeBlock = (
    <p className="m-0 max-w-none leading-[1.65] text-[#303644]" data-testid={narrativeTestId}>
      {narrativeTag && <span className="mr-2 inline-block rounded-full bg-myr-gold px-2 py-px align-middle text-[10px] font-black tracking-[.1em] text-[#17151f]" aria-hidden="true">{narrativeTag}</span>}
      {narrative}
    </p>
  );

  const leadBlock = lead ? <TurnLeadBlock lead={lead} /> : null;

  return (
    <article
      className={`session-turn group grid gap-2 rounded-myr-card border border-myr-ink/14 bg-[rgba(255,254,249,.68)] p-3.5 ${selected ? '!border-myr-ruby !shadow-[inset_4px_0_0_#b84a4a]' : ''} ${variantClass[variantClassName] ?? variantClassName}`.trim()}
      aria-label={ariaLabel}
      data-testid={testId}
      ref={articleRef}
    >
      {/* Always input → result: lead (user/system action) then the AI Narrative. */}
      {leadBlock}
      {narrativeBlock}
      {headingActions && (
        <div className="mt-[-2px] flex min-h-[30px] justify-start">
          <div className="flex gap-1 opacity-40 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 max-sm:opacity-100 motion-reduce:transition-none">
            {headingActions}
          </div>
        </div>
      )}
    </article>
  );
}
