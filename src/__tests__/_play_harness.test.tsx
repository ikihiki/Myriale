import '@testing-library/jest-dom/vitest';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { composeStories } from '@storybook/react';
import * as pageStories from '../stories/UserManagementPage.stories';
import * as kitStories from '../stories/AccountKit.stories';
import * as appChromeStories from '../stories/AppChrome.stories';
import * as sessionResumeStories from '../stories/SessionResumePage.stories';
import * as scenarioRegistrationStories from '../stories/ScenarioRegistrationPage.stories';
import * as editScenarioStories from '../stories/EditScenarioPage.stories';
import * as programDrivenStories from '../stories/SessionPage.program-driven.stories';
import * as sessionTurnStories from '../stories/SessionTurn.stories';
import * as myrialeAppStories from '../stories/MyrialeApp.stories';

afterEach(() => cleanup());

// Runs every Storybook story's play function against a real render, so the
// documented user-flow interactions (US-UM01..16 + the shared Account kit +
// the shared AppChrome navigation + US-R01..08 session resume + US-E01..10
// edit scenario + US-PG01..10 program-driven narrative + the shared SessionTurn
// component) are verified in CI, not just type-checked.
const composedPageStories = composeStories(pageStories);
const composedKit = composeStories(kitStories);
const composedAppChrome = composeStories(appChromeStories);
const composedSessionResume = composeStories(sessionResumeStories);
const composedScenarioRegistration = composeStories(scenarioRegistrationStories);
const composedEditScenario = composeStories(editScenarioStories);
const composedProgramDriven = composeStories(programDrivenStories);
const composedSessionTurn = composeStories(sessionTurnStories);

const composedMyrialeApp = composeStories(myrialeAppStories);

describe('play: MyrialeApp integrated stories', () => {
  for (const [name, Story] of Object.entries(composedMyrialeApp)) {
    it(name, async () => {
      const { container } = render(<Story />);
      if (Story.play) {
        await Story.play({ canvasElement: container });
      }
      expect(container).toBeTruthy();
    });
  }
});

describe('play: UserManagementPage stories', () => {
  for (const [name, Story] of Object.entries(composedPageStories)) {
    it(name, async () => {
      const { container } = render(<Story />);
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
      if (Story.play) {
        await Story.play({ canvasElement: container });
      }
      expect(container).toBeTruthy();
    });
  }
});

describe('play: SessionResumePage stories', () => {
  for (const [name, Story] of Object.entries(composedSessionResume)) {
    it(name, async () => {
      const { container } = render(<Story />);
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
      if (Story.play) {
        await Story.play({ canvasElement: container });
      }
      expect(container).toBeTruthy();
    });
  }
});

describe('play: SessionTurn stories', () => {
  for (const [name, Story] of Object.entries(composedSessionTurn)) {
    it(name, async () => {
      const { container } = render(<Story />);
      if (Story.play) {
        await Story.play({ canvasElement: container });
      }
      expect(container).toBeTruthy();
    });
  }
});
