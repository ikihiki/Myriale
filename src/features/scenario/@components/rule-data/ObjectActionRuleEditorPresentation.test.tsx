import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { westDoorAuthoringFixture } from '../../../../stories/scenario-registration-page/scenarioRegistrationFixtures';
import { ObjectTypesEditorPresentation } from './ObjectTypesEditorPresentation';
import type { ScenarioRuleData } from './scenarioRuleDataModel';

function Harness() {
  const [value, setValue] = useState<ScenarioRuleData>(() => structuredClone(westDoorAuthoringFixture));
  const [notice, setNotice] = useState('');
  return <>
    <ObjectTypesEditorPresentation mode="edit" value={value} onChange={setValue} onNotice={(message) => setNotice(message)} />
    <output data-testid="rule-data-json">{JSON.stringify(value)}</output>
    <output data-testid="rule-notice">{notice}</output>
  </>;
}

describe('Object action rule authoring', () => {
  it('opens a rule from the selected action table, edits effects, and keeps the action fixed', async () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: '出口の扉を編集' }));
    fireEvent.click(screen.getByRole('button', { name: '扉を開けて外へ出るを編集' }));
    expect(screen.getByRole('heading', { name: 'オブジェクト別の実行ルール' })).toBeVisible();
    expect(screen.getByRole('cell', { name: /西の扉/ })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: '西の扉の実行ルールを編集' }));
    expect(await screen.findByLabelText('実行ルールのアクション')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('5番目の出来事の名前')).toHaveValue('session-moved');
    fireEvent.change(screen.getByLabelText('5番目の出来事の名前'), { target: { value: 'player-left-building' } });
    expect(screen.getByLabelText('5番目の出来事の名前')).toHaveValue('player-left-building');

    fireEvent.click(screen.getByRole('button', { name: '7番目を上へ移動' }));
    await waitFor(() => expect(screen.getByLabelText('6番目の文章')).toHaveValue('まだ室内にいる'));
    fireEvent.click(screen.getByRole('button', { name: '6番目を削除' }));
    await waitFor(() => expect(screen.getByTestId('rule-result-preview')).toHaveTextContent('7 effect'));
  });

  it('cascades action code renames and blocks deletion while rules reference the action', async () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: '出口の扉を編集' }));
    fireEvent.click(screen.getByRole('button', { name: '扉を開けて外へ出るを編集' }));
    fireEvent.change(screen.getAllByLabelText('アクション1のcode')[0], { target: { value: 'leave-through-door' } });
    await waitFor(() => expect(screen.getAllByTestId('rule-data-json').some((element) => element.textContent?.includes('\"actionCode\":\"leave-through-door\"'))).toBe(true));

    fireEvent.click(screen.getByRole('button', { name: 'このアクションを削除' }));
    expect(screen.getAllByTestId('rule-notice').some((element) => element.textContent?.includes('先にルールを削除'))).toBe(true);
    expect(screen.getAllByTestId('rule-data-json').some((element) => element.textContent?.includes('\"code\":\"leave-through-door\"'))).toBe(true);
  });
});
