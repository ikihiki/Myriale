import { ScenarioForm } from '../scenario/@components/ScenarioForm';
import type { ScenarioRegistrationActions } from './scenarioRegistrationModel';

type Props = {
  account: { name: string; email: string; initials: string; role?: string } | null;
  scenarioId: string;
  saving: boolean;
  aiWorking: boolean;
  actions: ScenarioRegistrationActions;
  onLogout: () => void | Promise<void>;
};

export function ScenarioRegistrationPresentation({ account, scenarioId, saving, aiWorking, actions, onLogout }: Props) {
  return <ScenarioForm
    mode="create"
    account={account}
    scenarioId={scenarioId}
    saving={saving}
    aiWorking={aiWorking}
    actions={{ save: actions.saveDraft, assist: actions.assist }}
    onLogout={onLogout}
  />;
}
