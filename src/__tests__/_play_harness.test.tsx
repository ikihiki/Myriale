import '@testing-library/jest-dom/vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { composeStories } from '@storybook/react';
import * as pageStories from '../stories/UserManagementPage.stories';
import * as kitStories from '../stories/AccountKit.stories';
import * as appChromeStories from '../stories/AppChrome.stories';
import * as sessionListStories from '../stories/SessionListPage.stories';
import * as scenarioRegistrationStories from '../stories/ScenarioRegistrationPage.stories';
import * as editScenarioStories from '../stories/EditScenarioPage.stories';
import * as programDrivenStories from '../stories/SessionPage.program-driven.stories';
import * as sessionTurnStories from '../stories/SessionTurn.stories';
import * as sessionErrorStories from '../stories/SessionPage.errors.stories';
import * as sessionExecutionStories from '../stories/SessionPage.execution-artifacts.stories';
import * as myrialeAppStories from '../stories/MyrialeApp.stories';
import * as startSessionStories from '../stories/StartSessionPage.stories';
import * as sessionDialogueStories from '../stories/SessionPage.play-dialogue.stories';

afterEach(() => cleanup());

// Runs every Storybook story's play function against a real render, so the
// documented user-flow interactions (US-UM01..16 + the shared Account kit +
// the shared AppChrome navigation + session listing/direct access + US-E01..10
// edit scenario + US-PG01..10 program-driven narrative + the shared SessionTurn
// component) are verified in CI, not just type-checked.
const composedPageStories = composeStories(pageStories);
const composedKit = composeStories(kitStories);
const composedAppChrome = composeStories(appChromeStories);
const composedSessionList = composeStories(sessionListStories);
const composedScenarioRegistration = composeStories(scenarioRegistrationStories);
const composedEditScenario = composeStories(editScenarioStories);
const composedProgramDriven = composeStories(programDrivenStories);
const composedSessionTurn = composeStories(sessionTurnStories);

const composedSessionErrors = composeStories(sessionErrorStories);
const composedSessionExecutions = composeStories(sessionExecutionStories);
const composedMyrialeApp = composeStories(myrialeAppStories);
const composedStartSession = composeStories(startSessionStories);
const composedSessionDialogue = composeStories(sessionDialogueStories);

describe('play: MyrialeApp integrated stories', () => {
  for (const [name, Story] of Object.entries(composedMyrialeApp)) {
    it(name, async () => {
      const { container } = render(<Story />);
      await waitFor(() => expect(container.firstElementChild).not.toBeNull());
      if (Story.play) {
        await Story.play({ canvasElement: container });
      }
      expect(container).toBeTruthy();
    });
  }
});

describe('play: Phase 1 completion stories', () => {
  it('does not use a local success fallback when starting a Session', async () => {
    const Story = composedStartSession.USS05BeginActiveSession;
    const { container } = render(<Story />);
    await waitFor(() => expect(container.firstElementChild).not.toBeNull());
    if (Story.play) await Story.play({ canvasElement: container });
  });

  it('does not create two Turns from a submit-button double click', async () => {
    const Story = composedSessionDialogue.ComposerDoubleClickCreatesOneTurn;
    const { container } = render(<Story />);
    await waitFor(() => expect(container.firstElementChild).not.toBeNull());
    if (Story.play) await Story.play({ canvasElement: container });
  });
});

describe('play: UserManagementPage stories', () => {
  for (const [name, Story] of Object.entries(composedPageStories)) {
    it(name, async () => {
      const { container } = render(<Story />);
      await waitFor(() => expect(container.firstElementChild).not.toBeNull());
      if (Story.play) {
        await Story.play({ canvasElement: container });
      }
      expect(container).toBeTruthy();
    });
  }
});

describe('play: AccountKit stories', () => {
  for (const [name, Story] of Object.entries(composedKit)) {
    it(name, async () => {
      const { container } = render(<Story />);
      await waitFor(() => expect(container.firstElementChild).not.toBeNull());
      if (Story.play) {
        await Story.play({ canvasElement: container });
      }
      expect(container).toBeTruthy();
    });
  }
});

describe('play: AppChrome stories', () => {
  for (const [name, Story] of Object.entries(composedAppChrome)) {
    it(name, async () => {
      const { container } = render(<Story />);
      await waitFor(() => expect(container.firstElementChild).not.toBeNull());
      if (Story.play) {
        await Story.play({ canvasElement: container });
      }
      expect(container).toBeTruthy();
    });
  }
});

describe('play: SessionListPage stories', () => {
  for (const [name, Story] of Object.entries(composedSessionList)) {
    it(name, async () => {
      const { container } = render(<Story />);
      await waitFor(() => expect(container.firstElementChild).not.toBeNull());
      if (Story.play) {
        await Story.play({ canvasElement: container });
      }
      expect(container).toBeTruthy();
    });
  }
});

describe('play: ScenarioRegistrationPage stories', () => {
  for (const [name, Story] of Object.entries(composedScenarioRegistration)) {
    it(name, async () => {
      const { container } = render(<Story />);
      await waitFor(() => expect(container.firstElementChild).not.toBeNull());
      if (Story.play) {
        await Story.play({ canvasElement: container });
      }
      expect(container).toBeTruthy();
    });
  }
});

describe('play: EditScenarioPage stories', () => {
  for (const [name, Story] of Object.entries(composedEditScenario)) {
    it(name, async () => {
      const { container } = render(<Story />);
      await waitFor(() => expect(container.firstElementChild).not.toBeNull());
      if (Story.play) {
        await Story.play({ canvasElement: container });
      }
      expect(container).toBeTruthy();
    });
  }
});

describe('play: SessionPage program-driven stories', () => {
  for (const [name, Story] of Object.entries(composedProgramDriven)) {
    it(name, async () => {
      const { container } = render(<Story />);
      await waitFor(() => expect(container.firstElementChild).not.toBeNull());
      if (Story.play) {
        await Story.play({ canvasElement: container });
      }
      expect(container).toBeTruthy();
    });
  }
});

describe('play: Session error-state stories', () => {
  for (const [name, Story] of Object.entries(composedSessionErrors)) {
    it(name, async () => {
      const { container } = render(<Story />);
      await waitFor(() => expect(container.firstElementChild).not.toBeNull());
      if (Story.play) await Story.play({ canvasElement: container });
      expect(container).toBeTruthy();
    });
  }
});

describe('play: Session execution and artifact stories', () => {
  for (const [name, Story] of Object.entries(composedSessionExecutions)) {
    it(name, async () => {
      const { container } = render(<Story />);
      await waitFor(() => expect(container.firstElementChild).not.toBeNull());
      if (Story.play) await Story.play({ canvasElement: container });
      expect(container).toBeTruthy();
    });
  }
});

describe('play: SessionTurn stories', () => {
  for (const [name, Story] of Object.entries(composedSessionTurn)) {
    it(name, async () => {
      const { container } = render(<Story />);
      await waitFor(() => expect(container.firstElementChild).not.toBeNull());
      if (Story.play) {
        await Story.play({ canvasElement: container });
      }
      expect(container).toBeTruthy();
    });
  }
});
