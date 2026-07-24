import { useAppStore } from '../../app/store';
import { ScenarioListPresentation } from '../../features/session-start/ScenarioListPresentation';
import { toScenarioSummary } from '../../features/session-start/scenarioPresentation';
import { STORY_IDS, navigateToStory, useAppNavigation } from '../../shared/nav';

const demoAccount = {
  name: '霧野しおり',
  email: 'reader@myriale.example',
  initials: '霧野',
  role: 'プレイヤー',
};

export function MockScenarioListContainer() {
  const appNavigate = useAppNavigation();
  const { db } = useAppStore();
  const scenarios = Object.values(db.scenarios).map(toScenarioSummary);

  const navigateTo = (destination: 'scenarioRegister' | 'scenarioEdit' | 'startSession', scenarioId?: string) => {
    if (appNavigate) {
      if (destination === 'startSession') appNavigate(destination, { query: { scenarioId: scenarioId ?? '' } });
      else if (destination === 'scenarioEdit') appNavigate(destination, { scenarioId: scenarioId ?? '' });
      else appNavigate(destination);
      return;
    }
    navigateToStory(STORY_IDS[destination]);
  };

  return <ScenarioListPresentation
    account={demoAccount}
    scenarios={scenarios}
    status="ready"
    onRetry={() => undefined}
    onRegistration={() => navigateTo('scenarioRegister')}
    onEdit={(scenarioId) => navigateTo('scenarioEdit', scenarioId)}
    onStart={(scenarioId) => navigateTo('startSession', scenarioId)}
    onLogout={() => undefined}
  />;
}
