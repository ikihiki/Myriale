import type { ReactNode } from 'react';

/**
 * SessionTurn — the shared turn-display component used by every session-play
 * surface (AI dialogue and program-driven scenes).
 *
 * A "turn" is rendered as an optional heading, an optional *lead* block, and the
 * AI Narrative body. The lead block is the part that differs between modes:
 *   - AI dialogue: the lead is the player's free-text input (tone="player").
 *   - Program-driven: the lead is the program-confirmed fact (tone="program").
 * Both share the same Narrative body (tone="ai"), so the two surfaces use one
 * component and one set of styles.
 *
 * `leadPosition` keeps the existing per-surface ordering: AI dialogue shows the
 * Narrative first then the player input ("after"), while program-driven scenes
 * show the fact first then the Narrative ("before").
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
  /** Lead block shown before/after the Narrative (player input or program fact). */
  lead?: TurnLead;
  /** Where the lead sits relative to the Narrative body. Default: 'after'. */
  leadPosition?: 'before' | 'after';
  /** AI Narrative body. */
  narrative: ReactNode;
  /** Tag chip for the Narrative (e.g. "AI"); omitted when not needed. */
  narrativeTag?: string;
  /** Optional testid for the Narrative paragraph. */
  narrativeTestId?: string;
  /** Extra content under the Narrative/lead (e.g. interpretation toggle). */
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
  leadPosition = 'after',
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
      {leadPosition === 'before' && leadBlock}
      {narrativeBlock}
      {leadPosition === 'after' && leadBlock}
      {footer && <div className="session-turn-footer">{footer}</div>}
    </article>
  );
}
