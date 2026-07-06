import { describe, expect, it } from 'vitest';
import { appUrlForStoryKey, formatAppUrl, parseAppUrl } from './routes';

describe('app URL routing', () => {
  it('opens a play session directly from a URL-like string', () => {
    const route = parseAppUrl('/sessions/SES-PREP-1098?turn=3');
    expect(route.screen).toBe('playSession');
    expect(route.params.sessionId).toBe('SES-PREP-1098');
    expect(route.query.turn).toBe('3');
    expect(formatAppUrl(route)).toBe('/sessions/SES-PREP-1098?turn=3');
  });

  it('opens the home dashboard and falls back safely for unknown URLs', () => {
    expect(parseAppUrl('/').screen).toBe('home');
    expect(parseAppUrl('/unknown/place').screen).toBe('home');
  });

  it('maps legacy story keys to app URLs', () => {
    expect(appUrlForStoryKey('sessionNotesLorebook')).toBe('/sessions/SES-PREP-1098');
  });

  it('opens AI key management from an admin URL and story key', () => {
    expect(parseAppUrl('/account/admin/ai-keys').screen).toBe('adminAiKeys');
    expect(appUrlForStoryKey('adminAiKeys')).toBe('/account/admin/ai-keys');
  });
});
