import { describe, expect, it } from 'vitest';
import { createAppRouter } from '../router';
import { appHrefForStoryKey, appPathForStoryKey } from './navigation';

describe('TanStack app routing', () => {
  it('matches a play session and exposes its typed parameter', async () => {
    const router = createAppRouter({ initialUrl: '/sessions/SES-PREP-1098?turn=3' });
    await router.load();

    expect(router.state.location.pathname).toBe('/sessions/SES-PREP-1098');
    expect(router.state.location.search).toEqual({ turn: 3 });
    expect(router.state.matches[router.state.matches.length - 1]?.params).toMatchObject({ sessionId: 'SES-PREP-1098' });
  });

  it('matches the home route and renders the root not-found fallback for unknown URLs', async () => {
    const homeRouter = createAppRouter({ initialUrl: '/' });
    await homeRouter.load();
    expect(homeRouter.state.matches[homeRouter.state.matches.length - 1]?.routeId).toBe('/');

    const unknownRouter = createAppRouter({ initialUrl: '/unknown/place' });
    await unknownRouter.load();
    expect(unknownRouter.state.statusCode).toBe(404);
  });

  it('maps shared navigation keys to router paths and validated search strings', () => {
    expect(appPathForStoryKey('sessionNotesLorebook')).toBe('/sessions/SES-PREP-1098');
    expect(appPathForStoryKey('adminAiKeys')).toBe('/account/admin/ai-keys');
    expect(appHrefForStoryKey('startSession', { query: { scenarioId: 'SCN-001' } })).toBe('/sessions/start?scenarioId=SCN-001');
  });
});
