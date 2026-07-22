import { describe, expect, it } from 'vitest';
import { createDemoAccountApi } from '../account/api/accountApi';
import { safeRedirectTarget } from '../auth/requireAuthenticated';
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

  it('redirects an anonymous Session route to login and preserves the requested URL', async () => {
    const accountApi = createDemoAccountApi();
    await accountApi.logout();
    const router = createAppRouter({
      initialUrl: '/sessions/SES-PRIVATE?turn=3',
      accountApi,
    });

    await router.load();

    expect(router.state.location.pathname).toBe('/account/login');
    expect(router.state.location.search).toEqual({ redirect: '/sessions/SES-PRIVATE?turn=3' });
  });

  it('guards Session start before the page can call its APIs', async () => {
    const accountApi = createDemoAccountApi();
    await accountApi.logout();
    const router = createAppRouter({
      initialUrl: '/sessions/start?scenarioId=SCN-STAR-LIBRARY',
      accountApi,
    });

    await router.load();

    expect(router.state.location.pathname).toBe('/account/login');
    expect(router.state.location.search).toEqual({
      redirect: '/sessions/start?scenarioId=SCN-STAR-LIBRARY',
    });
  });

  it('accepts only local return destinations for guarded login', () => {
    expect(safeRedirectTarget('/sessions/SES-1')).toBe('/sessions/SES-1');
    expect(safeRedirectTarget('//example.test/steal')).toBeUndefined();
    expect(safeRedirectTarget('https://example.test/steal')).toBeUndefined();
    expect(safeRedirectTarget('/account/login?redirect=/sessions/SES-1')).toBeUndefined();
  });

  it('redirects a session start without scenarioId to the scenario list', async () => {
    const router = createAppRouter({ initialUrl: '/sessions/start' });
    await router.load();

    expect(router.state.location.pathname).toBe('/scenarios');
  });

  it('redirects the legacy AI key URL to /admin', async () => {
    const router = createAppRouter({ initialUrl: '/account/admin/ai-keys' });
    await router.load();

    expect(router.state.location.pathname).toBe('/admin');
  });

  it('matches the canonical AI Provider admin route', async () => {
    const router = createAppRouter({ initialUrl: '/admin' });
    await router.load();

    expect(router.state.location.pathname).toBe('/admin');
    expect(router.state.matches[router.state.matches.length - 1]?.routeId).toBe('/admin');
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
    expect(appPathForStoryKey('adminAiKeys')).toBe('/admin');
    expect(appHrefForStoryKey('startSession', { query: { scenarioId: 'SCN-001' } })).toBe('/sessions/start?scenarioId=SCN-001');
  });
});
