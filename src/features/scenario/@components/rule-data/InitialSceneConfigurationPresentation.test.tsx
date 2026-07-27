import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { completeDoorRuleDataFixture } from '../../../../stories/scenario-registration-page/scenarioRegistrationFixtures';
import { InitialSceneConfigurationPresentation } from './InitialSceneConfigurationPresentation';
import type { ScenarioRuleData } from './scenarioRuleDataModel';

function Harness() {
  const [value, setValue] = useState<ScenarioRuleData>(() => structuredClone(completeDoorRuleDataFixture));
  return <><InitialSceneConfigurationPresentation value={value} onChange={setValue} /><output data-testid="rule-data-json">{JSON.stringify(value)}</output></>;
}

afterEach(cleanup);

describe('InitialSceneConfigurationPresentation', () => {
  it('changes the start location and resolved object initial state', async () => {
    render(<Harness />);
    const initialStateTable = screen.getByRole('table', { name: '北書庫の扉の初期ステート一覧' });
    expect(within(initialStateTable).getByRole('columnheader', { name: 'ステート' })).toBeVisible();
    expect(within(initialStateTable).getByRole('columnheader', { name: '基準値' })).toBeVisible();
    expect(within(initialStateTable).getByRole('columnheader', { name: '初期値' })).toBeVisible();

    fireEvent.click(screen.getByRole('combobox', { name: 'セッション開始場所' }));
    fireEvent.click(await screen.findByRole('option', { name: '星見の階段 / astral-stair' }));
    fireEvent.click(screen.getByRole('combobox', { name: '北書庫の扉の開いている初期値' }));
    fireEvent.click(await screen.findByRole('option', { name: 'true' }));

    const value = JSON.parse(screen.getByTestId('rule-data-json').textContent ?? '{}') as ScenarioRuleData;
    expect(value.startLocationCode).toBe('astral-stair');
    expect(value.objects[0].initialStateOverrides).toContainEqual({ stateCode: 'open', value: 'true' });
    expect(within(screen.getByRole('article', { name: '北書庫の扉の初期ステート' })).getByText(/上書き中/)).toBeVisible();
  });
});
