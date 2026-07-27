import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ScenarioNpcPayload } from '../../../app/scenarioApi';
import { completeDoorRuleDataFixture } from '../../../stories/scenario-registration-page/scenarioRegistrationFixtures';
import { NpcSettingsPresentation } from './NpcSettingsPresentation';

function Harness() {
  const [npcs, setNpcs] = useState<ScenarioNpcPayload[]>([]);
  return <><NpcSettingsPresentation value={npcs} ruleData={completeDoorRuleDataFixture} onChange={setNpcs} onNotice={() => undefined} /><output data-testid="npcs-json">{JSON.stringify(npcs)}</output></>;
}

afterEach(cleanup);

describe('NpcSettingsPresentation', () => {
  it('adds and edits a structured NPC in the shared table', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'NPCを追加' }));
    fireEvent.change(screen.getByLabelText('NPCのstable code'), { target: { value: 'archivist-mira' } });
    fireEvent.change(screen.getByLabelText('NPC名'), { target: { value: '司書ミラ' } });
    fireEvent.change(screen.getByLabelText('NPCの役割'), { target: { value: '案内役' } });
    fireEvent.change(screen.getByLabelText('NPCの秘密'), { target: { value: '沈没の原因を知っている' } });
    fireEvent.click(screen.getByRole('button', { name: '編集を完了' }));

    const table = screen.getByRole('table', { name: 'NPC一覧' });
    expect(within(table).getByText('司書ミラ')).toBeVisible();
    const npcs = JSON.parse(screen.getByTestId('npcs-json').textContent ?? '[]') as ScenarioNpcPayload[];
    expect(npcs[0]).toMatchObject({ code: 'archivist-mira', role: '案内役', initialLocationCode: 'sunken-library', secrets: '沈没の原因を知っている' });
  });
});
