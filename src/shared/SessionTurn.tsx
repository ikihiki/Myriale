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
    <div className={`session-turn-lead lead-${lead.tone}`} data-testid={lead.testId}>
      <p className="session-turn-lead-line">
        <span className={`session-turn-lead-tag tag-${lead.tone}`} aria-hidden="true">{lead.tag}</span>
        {lead.srLabel && <span className="sr-only">{lead.srLabel}</span>}
        <span className="session-turn-lead-text">{lead.text}</span>
      </p>
      {lead.actions && <div className="session-turn-lead-actions">{lead.actions}</div>}
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
      {headingActions && (
        <div className="session-turn-heading">
          <div className="session-turn-actions">{headingActions}</div>
        </div>
      )}
      {/* Always input → result: lead (user/system action) then the AI Narrative. */}
      {leadBlock}
      {narrativeBlock}
    </article>
  );
}
