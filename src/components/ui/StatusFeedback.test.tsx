import '@testing-library/jest-dom/vitest';
import { createRef } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Badge, Notice } from '.';
import { badgeDotClassNames, badgeToneClassNames, noticeToneClassNames, type BadgeTone, type NoticeTone, type NoticeVariant } from './statusRecipes';

const noticeTones: NoticeTone[] = ['info', 'success', 'warning', 'danger'];
const noticeVariants: NoticeVariant[] = ['inverse', 'soft'];
const badgeTones: BadgeTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];

afterEach(cleanup);

describe('Notice', () => {
  it('renders every typed tone and variant recipe', () => {
    render(<>{noticeVariants.flatMap((variant) => noticeTones.map((tone) => <Notice key={`${variant}-${tone}`} variant={variant} tone={tone} data-testid={`${variant}-${tone}`}>{tone}</Notice>))}</>);
    for (const variant of noticeVariants) for (const tone of noticeTones) {
      expect(screen.getByTestId(`${variant}-${tone}`).className).toContain(noticeToneClassNames[variant][tone]);
    }
  });

  it('defaults to status while forwarding refs, ARIA/data props, and className', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Notice ref={ref} role="alert" aria-live="assertive" aria-label="保存エラー" data-state="failed" className="custom-notice">保存できません</Notice>);
    const notice = screen.getByRole('alert', { name: '保存エラー' });
    expect(ref.current).toBe(notice);
    expect(notice).toHaveAttribute('aria-live', 'assertive');
    expect(notice).toHaveAttribute('data-state', 'failed');
    expect(notice).toHaveClass('custom-notice');
    expect(notice).not.toHaveAttribute('tone');
    expect(notice).not.toHaveAttribute('variant');
  });
});

describe('Badge', () => {
  it('renders every typed tone with an optional decorative dot', () => {
    render(<>{badgeTones.map((tone) => <Badge key={tone} tone={tone} dot data-testid={tone}>{tone}</Badge>)}</>);
    for (const tone of badgeTones) {
      const badge = screen.getByTestId(tone);
      expect(badge.className).toContain(badgeToneClassNames[tone]);
      expect(badge.firstElementChild).toHaveClass(badgeDotClassNames[tone]);
      expect(badge.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('forwards native, ARIA, data, ref, and caller classes without leaking recipe props', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Badge ref={ref} tone="success" aria-label="接続状態" data-provider="runpod" className="custom-badge">接続済み</Badge>);
    const badge = screen.getByLabelText('接続状態');
    expect(ref.current).toBe(badge);
    expect(badge).toHaveAttribute('data-provider', 'runpod');
    expect(badge).toHaveClass('custom-badge');
    expect(badge).not.toHaveAttribute('tone');
    expect(badge).not.toHaveAttribute('dot');
    expect(badge.children).toHaveLength(0);
  });
});
