import type { AppChromeAccount } from '../../account/accountPresentation';
import type { ScenarioSummary } from './scenarioPresentation';

export type StartSessionSearch = {
  scenarioId?: string;
};

export type StartSessionHeroDraft = {
  name: string;
  profile: string;
};

export type StartSessionHeroRecommendation = StartSessionHeroDraft;

export type StartSessionCommandResult<T = undefined> = {
  ok: boolean;
  message?: string;
  requiresLogin?: boolean;
  value?: T;
};

export type StartSessionPresentationProps = {
  account: AppChromeAccount | null;
  scenario: ScenarioSummary | null;
  status: 'loading' | 'error' | 'ready';
  loadError?: string;
  canConfigureInterpretation: boolean;
  isBeginning: boolean;
  isRecommending: boolean;
  onLogout: () => void | Promise<void>;
  onLogin: () => void;
  onScenarioList: () => void;
  onRecommendHero: (draft: StartSessionHeroDraft) => Promise<StartSessionCommandResult<StartSessionHeroRecommendation>>;
  onBeginStory: (selectedHero: string, interpretationEnabled: boolean) => Promise<StartSessionCommandResult>;
};
