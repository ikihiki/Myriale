import { describe, expect, it } from 'vitest';
import { appUrlForStoryKey, formatAppUrl, parseAppUrl } from './routes';

describe('app URL routing', () => {
  it('opens a play session directly from a URL-like string', () => {
    const route = parseAppUrl('/sessions/SES-PREP-1098/play?turn=3');
    expect(route.screen).toBe('playSession');
    expect(route.params.sessionId).toBe('SES-PREP-1098');
    expect(route.query.turn).toBe('3');
    expect(formatAppUrl(route)).toBe('/sessions/SES-PREP-1098/play?turn=3');
  });

  it('falls back safely for unknown URLs', () => {
    expect(parseAppUrl('/unknown/place').screen).toBe('scenarioRegister');
  });

  it('maps legacy story keys to app URLs', () => {
    expect(appUrlForStoryKey('sessionNotesLorebook')).toBe('/sessions/SES-PREP-1098/notes/lorebook');
  });
});
