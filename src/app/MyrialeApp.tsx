import { useMemo } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { createFetchAccountApi, type AccountApi } from '../account/api/accountApi';
import { AccountApiProvider } from '../account/hooks/useAccountSession';
import { createAppRouter, type AppContainerOverrides, type AppHistoryMode } from '../router';
import { AppStoreProvider, type AppDb } from './store';
import { createMyrialeQueryClient, MyrialeQueryProvider } from './queryClient';
export type MyrialeAppProps = { accountApi?: AccountApi; initialUrl?: string; initialDb?: AppDb; showDebugPanel?: boolean; historyMode?: AppHistoryMode } & AppContainerOverrides;
export function MyrialeApp({ accountApi, initialUrl = '/', initialDb, showDebugPanel = true, historyMode = 'memory', ...containers }:MyrialeAppProps) { const resolvedAccountApi = useMemo(() => accountApi ?? createFetchAccountApi(), [accountApi]); const router = useMemo(() => createAppRouter({ initialUrl, historyMode, showDebugPanel, accountApi: resolvedAccountApi, ...containers }), [initialUrl, historyMode, showDebugPanel, resolvedAccountApi, ...Object.values(containers)]); const queryClient = useMemo(() => createMyrialeQueryClient(), []); return <MyrialeQueryProvider client={queryClient}><AccountApiProvider api={resolvedAccountApi}><AppStoreProvider initialDb={initialDb}><RouterProvider router={router}/></AppStoreProvider></AccountApiProvider></MyrialeQueryProvider>; }
