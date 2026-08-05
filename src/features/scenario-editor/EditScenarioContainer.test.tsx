import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDemoAccountApi } from '../../account/api/accountApi';
import { AccountApiProvider } from '../../account/hooks/useAccountSession';
import type { ScenarioApi, ScenarioDraftDto, ScenarioRuleDataPayload } from '../../app/scenarioApi';
import { createMyrialeQueryClient, MyrialeQueryProvider } from '../../app/queryClient';
import { EditScenarioContainer } from './EditScenarioContainer';

const scenario: ScenarioDraftDto = {
  id: 'SCN-1', title: '保存済みシナリオ', summary: '', genre: 'ミステリ', tone: '', lore: '', aiFreedom: '',
  heroMode: 'free', heroFreeGenerationAllowed: false, hero: '', opening: '', illustrationStyle: '', illustrationMood: '',
  illustrationNegative: '', sampleScene: '', ruleData: { schemaVersion: 3, startLocationCode: '', locations: [], objectTypes: [], objects: [] }, status: 'published', updatedAt: '2026-07-24',
};
const ruleData: ScenarioRuleDataPayload = {
  schemaVersion: 3,
  startLocationCode: 'hall',
  locations: [{ code: 'hall', name: '広間', description: '', atmosphere: '', danger: '' }],
  objectTypes: [{
    code: 'door', name: '保存済みの扉', description: '', schemaVersion: 1,
    profileFields: [], profileDefaults: [],
    stateFields: [{ code: 'open', label: '開いている', valueType: 'boolean', defaultValue: 'false', visibility: 'public' }],
    actions: [],
    actionRules: [],
  }],
  objects: [{ code: 'north-door', name: '北の扉', profileMarkdown: '## 外観\n\n石造りの扉。', mixinTypeCodes: ['door'], localProfileFields: [], localProfileDefaults: [], profileValues: [], initialLocationCode: 'hall', global: false, stateFields: [], actions: [], initialStateOverrides: [], actionRules: [] }],
};

afterEach(() => cleanup());

describe('EditScenarioContainer', () => {
  it('loads scenario detail and rule data, then saves both resources', async () => {
    let releaseScenario!: () => void;
    let releaseRuleData!: () => void;
    const scenarioGate = new Promise<void>((resolve) => { releaseScenario = resolve; });
    const ruleDataGate = new Promise<void>((resolve) => { releaseRuleData = resolve; });
    const updateScenario = vi.fn(async (_id: string, values) => ({ ...scenario, ...values, ruleData: undefined } as ScenarioDraftDto));
    const putScenarioRuleData = vi.fn(async (_id: string, values: ScenarioRuleDataPayload) => values);
    const api = {
      getScenario: vi.fn(async () => { await scenarioGate; return scenario; }),
      getScenarioRuleData: vi.fn(),
      createScenarioRuleDataDraft: vi.fn(async () => { await ruleDataGate; return ruleData; }),
      updateScenario,
      putScenarioRuleData,
      assistScenario: vi.fn(),
      getScenarios: vi.fn(),
      getScenarioRuleDataReadiness: vi.fn(),
      publishScenarioRuleData: vi.fn(),
      debugScenarioRuleData: vi.fn(),
      recommendHero: vi.fn(),
      createScenario: vi.fn(),
    } as unknown as ScenarioApi;

    render(
      <MyrialeQueryProvider client={createMyrialeQueryClient()}>
        <AccountApiProvider api={createDemoAccountApi()}>
          <EditScenarioContainer scenarioId="SCN-1" api={api} />
        </AccountApiProvider>
      </MyrialeQueryProvider>,
    );

    expect(api.getScenario).toHaveBeenCalledTimes(1);
    expect(api.createScenarioRuleDataDraft).toHaveBeenCalledTimes(1);
    expect(api.getScenarioRuleData).not.toHaveBeenCalled();
    releaseScenario();
    await Promise.resolve();
    expect(screen.getByText('シナリオを読み込んでいます。')).toBeVisible();
    releaseRuleData();

    await screen.findByRole('main', { name: 'シナリオ編集ウィザード' });
    fireEvent.click(screen.getByRole('button', { name: 'エンティティへ' }));
    fireEvent.click(screen.getByRole('button', { name: '保存済みの扉を編集' }));
    expect(screen.getByLabelText('種類のstable code')).toHaveValue('door');
    fireEvent.change(screen.getByLabelText('種類の表示名'), { target: { value: '改稿した扉' } });
    fireEvent.click(screen.getByRole('button', { name: '編集を完了' }));
    fireEvent.click(screen.getByRole('button', { name: '変更を保存' }));

    await waitFor(() => expect(updateScenario).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(putScenarioRuleData).toHaveBeenCalledTimes(1));
    expect(putScenarioRuleData.mock.calls[0][1]).toMatchObject({
      locations: [{ code: 'hall' }],
      objectTypes: [{ code: 'door', name: '改稿した扉' }],
      objects: [{ code: 'north-door' }],
    });
    await waitFor(() => expect(screen.getByTestId('scenario-notice')).toHaveTextContent('基本情報とObject Typeを保存しました'));
  });

  it('shows backend readiness issues and keeps publish disabled when the draft is not ready', async () => {
    let releaseReadiness!: () => void;
    const readinessGate = new Promise<void>((resolve) => { releaseReadiness = resolve; });
    const getScenarioRuleDataReadiness = vi.fn(async () => {
      await readinessGate;
      return {
        definitionVersionId: 'SDV-1',
        ready: false,
        errors: { 'locations[0].code': ['開始場所から参照される場所が見つかりません。'] },
      };
    });
    const publishScenarioRuleData = vi.fn();
    const api = {
      getScenario: vi.fn(async () => scenario),
      createScenarioRuleDataDraft: vi.fn(async () => ruleData),
      updateScenario: vi.fn(),
      putScenarioRuleData: vi.fn(),
      assistScenario: vi.fn(),
      debugScenarioRuleData: vi.fn(),
      getScenarioRuleDataReadiness,
      publishScenarioRuleData,
    } as unknown as ScenarioApi;

    render(
      <MyrialeQueryProvider client={createMyrialeQueryClient()}>
        <AccountApiProvider api={createDemoAccountApi()}>
          <EditScenarioContainer scenarioId="SCN-1" api={api} />
        </AccountApiProvider>
      </MyrialeQueryProvider>,
    );

    await screen.findByRole('main', { name: 'シナリオ編集ウィザード' });
    fireEvent.click(screen.getByRole('button', { name: '公開準備を確認' }));
    expect(screen.getByRole('button', { name: '公開準備を確認中…' })).toBeDisabled();
    releaseReadiness();

    await waitFor(() => expect(screen.getByTestId('publish-readiness')).toHaveTextContent('公開前に修正が必要です。'));
    expect(screen.getByTestId('publish-readiness')).toHaveTextContent('開始場所から参照される場所が見つかりません。');
    expect(screen.getByTestId('publish-readiness')).toHaveTextContent('locations[0].code');
    expect(screen.getByRole('button', { name: 'シナリオを公開' })).toBeDisabled();
    expect(publishScenarioRuleData).not.toHaveBeenCalled();
  });

  it('publishes a saved draft after a successful readiness check', async () => {
    let releasePublish!: () => void;
    const publishGate = new Promise<void>((resolve) => { releasePublish = resolve; });
    const publishScenarioRuleData = vi.fn(async () => {
      await publishGate;
      return ruleData;
    });
    const api = {
      getScenario: vi.fn(async () => scenario),
      createScenarioRuleDataDraft: vi.fn(async () => ruleData),
      updateScenario: vi.fn(),
      putScenarioRuleData: vi.fn(),
      assistScenario: vi.fn(),
      debugScenarioRuleData: vi.fn(),
      getScenarioRuleDataReadiness: vi.fn(async () => ({ definitionVersionId: 'SDV-1', ready: true, errors: {} })),
      publishScenarioRuleData,
    } as unknown as ScenarioApi;

    render(
      <MyrialeQueryProvider client={createMyrialeQueryClient()}>
        <AccountApiProvider api={createDemoAccountApi()}>
          <EditScenarioContainer scenarioId="SCN-1" api={api} />
        </AccountApiProvider>
      </MyrialeQueryProvider>,
    );

    await screen.findByRole('main', { name: 'シナリオ編集ウィザード' });
    const publishButton = screen.getByRole('button', { name: 'シナリオを公開' });
    expect(publishButton).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '公開準備を確認' }));
    await waitFor(() => expect(screen.getByTestId('publish-readiness')).toHaveTextContent('公開できます。'));
    expect(publishButton).toBeEnabled();

    fireEvent.click(publishButton);
    expect(screen.getByRole('button', { name: '公開中…' })).toBeDisabled();
    releasePublish();

    await waitFor(() => expect(publishScenarioRuleData).toHaveBeenCalledWith('SCN-1'));
    await waitFor(() => expect(screen.getByTestId('publish-success')).toHaveTextContent('公開が完了しました。'));
    expect(screen.getByTestId('scenario-notice')).toHaveTextContent('シナリオを公開しました。');
  });

  it('shows a publish API error without reporting success', async () => {
    const api = {
      getScenario: vi.fn(async () => scenario),
      createScenarioRuleDataDraft: vi.fn(async () => ruleData),
      updateScenario: vi.fn(),
      putScenarioRuleData: vi.fn(),
      assistScenario: vi.fn(),
      debugScenarioRuleData: vi.fn(),
      getScenarioRuleDataReadiness: vi.fn(async () => ({ definitionVersionId: 'SDV-1', ready: true, errors: {} })),
      publishScenarioRuleData: vi.fn(async () => { throw new Error('publish conflict'); }),
    } as unknown as ScenarioApi;

    render(
      <MyrialeQueryProvider client={createMyrialeQueryClient()}>
        <AccountApiProvider api={createDemoAccountApi()}>
          <EditScenarioContainer scenarioId="SCN-1" api={api} />
        </AccountApiProvider>
      </MyrialeQueryProvider>,
    );

    await screen.findByRole('main', { name: 'シナリオ編集ウィザード' });
    fireEvent.click(screen.getByRole('button', { name: '公開準備を確認' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'シナリオを公開' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'シナリオを公開' }));

    await waitFor(() => expect(screen.getByTestId('scenario-notice')).toHaveTextContent('publish conflict'));
    expect(screen.queryByTestId('publish-success')).not.toBeInTheDocument();
  });

  it('reports a safe partial failure when only the basic scenario update succeeds', async () => {
    const api = {
      getScenario: vi.fn(async () => scenario),
      getScenarioRuleData: vi.fn(),
      createScenarioRuleDataDraft: vi.fn(async () => ruleData),
      updateScenario: vi.fn(async () => ({ ...scenario, title: '更新済み' })),
      putScenarioRuleData: vi.fn(async () => { throw new Error('rule-data conflict'); }),
      assistScenario: vi.fn(),
      getScenarios: vi.fn(),
      getScenarioRuleDataReadiness: vi.fn(),
      publishScenarioRuleData: vi.fn(),
      debugScenarioRuleData: vi.fn(),
      recommendHero: vi.fn(),
      createScenario: vi.fn(),
    } as unknown as ScenarioApi;

    render(
      <MyrialeQueryProvider client={createMyrialeQueryClient()}>
        <AccountApiProvider api={createDemoAccountApi()}>
          <EditScenarioContainer scenarioId="SCN-1" api={api} />
        </AccountApiProvider>
      </MyrialeQueryProvider>,
    );

    await screen.findByRole('main', { name: 'シナリオ編集ウィザード' });
    fireEvent.click(screen.getByRole('button', { name: '変更を保存' }));

    await waitFor(() => expect(screen.getByTestId('scenario-notice')).toHaveTextContent('基本情報は保存されましたが、Object Typeを保存できませんでした'));
    expect(screen.getByTestId('scenario-notice')).not.toHaveTextContent('基本情報とObject Typeを保存しました');
  });
});
