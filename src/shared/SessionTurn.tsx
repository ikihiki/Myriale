import type { ReactNode } from 'react';

/**
 * SessionTurn — the shared turn-display component used by every session-play
 * surface (AI dialogue and program-driven scenes).
 *
 * Every turn reads the same way: the user's action comes first, then its
 * result. Concretely a turn is an optional heading, the *lead* block (what the
 * user/system did), and then the AI Narrative body (what resulted). The lead is
 * the only part that differs between modes:
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
  /** Optional testid for the lead paragraph. */
  testId?: string;
};

export type SessionTurnProps = {
  /** Kicker label in the heading (e.g. "Turn 01", "ログ 1"). */
  kicker?: ReactNode;
  /** Heading title. */
  title?: ReactNode;
  /** Trailing heading slot (e.g. a "ここまで戻る" button). */
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
  /** Extra content under the Narrative (e.g. interpretation toggle). */
  footer?: ReactNode;
  selected?: boolean;
  /** Extra class for accent variants (e.g. `turn-battle`). */
  variantClassName?: string;
  ariaLabel?: string;
  testId?: string;
  /** Ref callback for the article element (used for scroll-into-view). */
  articleRef?: (node: HTMLElement | null) => void;
};

function TurnLeadBlock({ lead }: { lead: TurnLead }) {
  return (
    <p className={`session-turn-lead lead-${lead.tone}`} data-testid={lead.testId}>
      <span className={`session-turn-lead-tag tag-${lead.tone}`} aria-hidden="true">{lead.tag}</span>
      {lead.srLabel && <span className="sr-only">{lead.srLabel}</span>}
      <span className="session-turn-lead-text">{lead.text}</span>
    </p>
  );
}

export function SessionTurn({
  kicker,
  title,
  headingActions,
  lead,
  narrative,
  narrativeTag,
  narrativeTestId,
  footer,
  selected = false,
  variantClassName = '',
  ariaLabel,
  testId,
  articleRef,
}: SessionTurnProps) {
  const narrativeBlock = (
    <p className="session-turn-narrative" data-testid={narrativeTestId}>
      {narrativeTag && <span className="session-turn-narrative-tag" aria-hidden="true">{narrativeTag}</span>}
      {narrative}
    </p>
  );

  const leadBlock = lead ? <TurnLeadBlock lead={lead} /> : null;

  return (
    <article
      className={`session-turn ${selected ? 'selected' : ''} ${variantClassName}`.trim()}
      aria-label={ariaLabel}
      data-testid={testId}
      ref={articleRef}
    >
      {(kicker || title || headingActions) && (
        <div className="session-turn-heading">
          {kicker != null && <span className="session-turn-kicker">{kicker}</span>}
          {title != null && <h2 className="session-turn-title">{title}</h2>}
          {headingActions && <div className="session-turn-actions">{headingActions}</div>}
        </div>
      )}
      {/* Always input → result: lead (user/system action) then the AI Narrative. */}
      {leadBlock}
      {narrativeBlock}
      {footer && <div className="session-turn-footer">{footer}</div>}
    </article>
  );
}
