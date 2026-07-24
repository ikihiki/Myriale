import { redirect, type ParsedLocation } from '@tanstack/react-router';
import type { AccountApi, AccountUser } from '../account/api/accountApi';

export const defaultAuthenticatedPath = '/';

export async function requireAuthenticated(
  accountApi: AccountApi,
  location: ParsedLocation,
): Promise<AccountUser> {
  const user = await accountApi.getMe();
  if (user) return user;

  throw redirect({
    to: '/account/login',
    search: { redirect: location.href },
    replace: true,
  });
}

export function authenticatedRedirectTarget(value: unknown): string {
  return safeRedirectTarget(value) ?? defaultAuthenticatedPath;
}

export function safeRedirectTarget(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return undefined;
  if (value === '/account/login' || value.startsWith('/account/login?') || value.startsWith('/account/login#')) return undefined;
  return value;
}
