import '@testing-library/jest-dom/vitest';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { composeStories } from '@storybook/react';
import * as wireframeStories from '../stories/UserManagementWireframe.stories';
import * as kitStories from '../stories/AccountKit.stories';
import * as appChromeStories from '../stories/AppChrome.stories';
import * as sessionResumeStories from '../stories/SessionResumeWireframe.stories';
import * as editScenarioStories from '../stories/EditScenarioWireframe.stories';
import * as programDrivenStories from '../stories/ProgramDrivenNarrativeWireframe.stories';

afterEach(() => cleanup());

// Runs every Storybook story's play function against a real render, so the
// documented user-flow interactions (US-UM01..16 + the shared Account kit +
// the shared AppChrome navigation + US-R01..08 session resume + US-E01..10
// edit scenario + US-PG01..10 program-driven narrative) are verified in CI,
// not just type-checked.
const composedWireframe = composeStories(wireframeStories);
const composedKit = composeStories(kitStories);
const composedAppChrome = composeStories(appChromeStories);
const composedSessionResume = composeStories(sessionResumeStories);
const composedEditScenario = composeStories(editScenarioStories);
const composedProgramDriven = composeStories(programDrivenStories);

describe('play: UserManagementWireframe stories', () => {
  for (const [name, Story] of Object.entries(composedWireframe)) {
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

describe('play: SessionResumeWireframe stories', () => {
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

describe('play: EditScenarioWireframe stories', () => {
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

describe('play: ProgramDrivenNarrativeWireframe stories', () => {
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
