import { ScenarioForm } from '../scenario/@components/ScenarioForm';
import type { ScenarioRegistrationActions, ScenarioRegistrationValues } from './scenarioRegistrationModel';

type Props = {
  account: { name: string; email: string; initials: string; role?: string } | null;
  scenarioId: string;
  initialValues?: ScenarioRegistrationValues;
  saving: boolean;
  aiWorking: boolean;
  actions: ScenarioRegistrationActions;
  onLogout: () => void | Promise<void>;
};

export function ScenarioRegistrationPresentation({ account, scenarioId, initialValues, saving, aiWorking, actions, onLogout }: Props) {
  return <ScenarioForm
    mode="create"
    account={account}
    scenarioId={scenarioId}
    initialValues={initialValues}
    saving={saving}
    aiWorking={aiWorking}
    actions={{ save: actions.saveDraft, assist: actions.assist }}
    onLogout={onLogout}
  />;
}
