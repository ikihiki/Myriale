import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { westDoorAuthoringFixture } from '../../../../stories/scenario-registration-page/scenarioRegistrationFixtures';
import { ActionResultsEditorPresentation } from './ActionResultsEditorPresentation';
import type { ScenarioRuleData } from './scenarioRuleDataModel';

function Harness() {
  const [value, setValue] = useState<ScenarioRuleData>(() => structuredClone(westDoorAuthoringFixture));
  return <ActionResultsEditorPresentation value={value} onChange={setValue} />;
}

describe('ActionResultsEditorPresentation', () => {
  it('edits emit-event and forbidden narrative text, reorders effects, and deletes an effect', async () => {
    render(<Harness />);

    expect(await screen.findByLabelText('5番目の出来事の名前')).toHaveValue('session-moved');
    fireEvent.change(screen.getByLabelText('5番目の出来事の名前'), { target: { value: 'player-left-building' } });
    expect(screen.getByLabelText('5番目の出来事の名前')).toHaveValue('player-left-building');

    fireEvent.click(screen.getByRole('button', { name: '7番目を上へ移動' }));
    await waitFor(() => expect(screen.getByLabelText('6番目の文章')).toHaveValue('まだ室内にいる'));

    fireEvent.change(screen.getByLabelText('6番目の文章'), { target: { value: '室内に残っている' } });
    expect(screen.getByLabelText('6番目の文章')).toHaveValue('室内に残っている');

    fireEvent.click(screen.getByRole('button', { name: '6番目を削除' }));
    await waitFor(() => expect(screen.getByTestId('rule-result-preview')).toHaveTextContent('7 effect'));
  });
});
