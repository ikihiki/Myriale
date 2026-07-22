import { useOptionalAppStore } from '../../app/store';
import { StartSessionPresentation } from '../../features/session-start/StartSessionPresentation';
import { toScenarioSummary } from '../../features/session-start/scenarioPresentation';
import { useAppNavigation } from '../../shared/nav';

const demoAccount = {
  name: '霧野しおり',
  email: 'reader@myriale.example',
  initials: '霧野',
  role: 'プレイヤー',
};

export function MockStartSessionContainer({ scenarioId }: { scenarioId: string }) {
  const appStore = useOptionalAppStore();
  const appNavigate = useAppNavigation();
  const storedScenario = appStore?.db.scenarios[scenarioId];
  const scenario = storedScenario ? toScenarioSummary(storedScenario) : null;

  return <StartSessionPresentation
    account={demoAccount}
    scenario={scenario}
    status={scenario ? 'ready' : 'error'}
    loadError={scenario ? undefined : '指定されたシナリオが見つかりません。'}
    canConfigureInterpretation
    isBeginning={false}
    isRecommending={false}
    onLogout={() => undefined}
    onLogin={() => appNavigate?.('login')}
    onScenarioList={() => appNavigate?.('scenarioList')}
    onRecommendHero={async () => ({
      ok: true,
      message: 'AI案を入力欄へ反映しました。確認・修正してから確定してください。',
      value: {
        name: 'ノクト',
        profile: '夜明け前の星図を読む、慎重な旅人。',
      },
    })}
    onBeginStory={async () => ({ ok: false, message: 'Session APIが設定されていません。' })}
  />;
}
