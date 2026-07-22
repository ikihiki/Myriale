import '@testing-library/jest-dom/vitest';
import { createRef } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  AccountCard,
  AccountFlushCard,
  AccountInset,
  AccountPanel,
  ArchiveCard,
  Card,
  DarkPanel,
  HomeCard,
  HomePanel,
  Inset,
  Label,
  PageCanvas,
  PageShell,
  Panel,
  SummaryCard,
  SummaryDarkPanel,
  SummaryInset,
  TurnCard,
} from '.';

afterEach(cleanup);

describe('Label', () => {
  it('renders a semantic element with native props, a forwarded ref, and merged classes', () => {
    const ref = createRef<HTMLHeadingElement>();
    render(
      <Label
        as="h2"
        textRole="section"
        ref={ref}
        id="chapter-title"
        data-state="ready"
        className="text-myr-ruby"
      >
        Chapter title
      </Label>,
    );

    const heading = screen.getByRole('heading', { level: 2, name: 'Chapter title' });
    expect(ref.current).toBe(heading);
    expect(heading).toHaveAttribute('id', 'chapter-title');
    expect(heading).toHaveAttribute('data-state', 'ready');
    expect(heading).toHaveClass('font-myr-display', 'tracking-myr-display', 'text-myr-ruby');
  });

  it('supports every existing text role without exposing class recipes', () => {
    const roles = ['display', 'section', 'sectionEditorial', 'eyebrow', 'eyebrowData', 'label', 'body', 'bodySm', 'caption', 'data'] as const;
    render(<>
      {roles.map((role) => <Label textRole={role} data-testid={role} key={role}>{role}</Label>)}
      <Label as="div" textRole="caption" role="status" aria-live="polite">Ready</Label>
    </>);

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByTestId('display')).toHaveClass('font-myr-display');
    expect(screen.getByTestId('sectionEditorial')).toHaveClass("font-['Yu_Mincho','Hiragino_Mincho_ProN',Georgia,serif]");
    expect(screen.getByTestId('eyebrowData')).toHaveClass('font-myr-mono', 'text-myr-ruby');
    expect(screen.getByTestId('bodySm')).toHaveClass('text-sm', 'leading-6');
    expect(screen.getByTestId('data')).toHaveClass('font-myr-mono');
  });
});

describe('surface components', () => {
  it('supports semantic elements, native props, refs, and class merging', () => {
    const ref = createRef<HTMLElement>();
    render(
      <PageCanvas as="section" ref={ref} aria-label="Canvas" data-state="ready" className="custom-canvas">
        Content
      </PageCanvas>,
    );

    const canvas = screen.getByRole('region', { name: 'Canvas' });
    expect(ref.current).toBe(canvas);
    expect(canvas.tagName).toBe('SECTION');
    expect(canvas).toHaveAttribute('data-state', 'ready');
    expect(canvas).toHaveClass('min-h-[calc(100vh-118px)]', 'bg-[image:var(--myr-screen-background)]', 'custom-canvas');
  });

  it('applies every PageShell width through the typed width prop', () => {
    render(
      <>
        <PageShell as="div" width="content" data-testid="content" />
        <PageShell as="div" width="focused" data-testid="focused" />
        <PageShell as="div" width="chrome" data-testid="chrome" />
        <PageShell as="div" width="reading" data-testid="reading" />
      </>,
    );

    expect(screen.getByTestId('content')).toHaveClass('max-w-myr-content');
    expect(screen.getByTestId('focused')).toHaveClass('max-w-myr-focused');
    expect(screen.getByTestId('chrome')).toHaveClass('max-w-myr-chrome', 'w-full');
    expect(screen.getByTestId('reading')).toHaveClass('max-w-myr-reading', 'w-full');
  });

  it('keeps panel, card, inset, and dark variants as separate named components', () => {
    render(
      <>
        <Panel data-testid="panel" />
        <HomePanel data-testid="home-panel" />
        <AccountPanel data-testid="account-panel" />
        <Card data-testid="card" />
        <ArchiveCard data-testid="archive-card" />
        <HomeCard data-testid="home-card" />
        <AccountCard data-testid="account-card" />
        <AccountFlushCard data-testid="account-flush-card" />
        <SummaryCard data-testid="summary-card" />
        <TurnCard data-testid="turn-card" />
        <Inset data-testid="inset" />
        <SummaryInset data-testid="summary-inset" />
        <AccountInset data-testid="account-inset" />
        <DarkPanel data-testid="dark" />
        <SummaryDarkPanel data-testid="summary-dark" />
      </>,
    );

    expect(screen.getByTestId('panel')).toHaveClass('shadow-myr-card');
    expect(screen.getByTestId('home-panel')).toHaveClass('rounded-myr-shell');
    expect(screen.getByTestId('account-panel')).toHaveClass('p-7.5');
    expect(screen.getByTestId('card')).toHaveClass('bg-myr-paper-glass');
    expect(screen.getByTestId('archive-card')).toHaveClass('bg-myr-paper/75');
    expect(screen.getByTestId('home-card')).toHaveClass('home-card');
    expect(screen.getByTestId('account-card')).toHaveClass('p-myr-section-inset');
    expect(screen.getByTestId('account-flush-card')).toHaveClass('overflow-hidden');
    expect(screen.getByTestId('summary-card')).toHaveClass('rounded-xl');
    expect(screen.getByTestId('turn-card')).toHaveClass('session-turn');
    expect(screen.getByTestId('inset')).toHaveClass('bg-myr-vellum/45');
    expect(screen.getByTestId('summary-inset')).toHaveClass('sticky');
    expect(screen.getByTestId('account-inset')).toHaveClass('p-6.5');
    expect(screen.getByTestId('dark')).toHaveClass('text-myr-paper');
    expect(screen.getByTestId('summary-dark')).toHaveClass('rounded-myr-card');
  });
});
