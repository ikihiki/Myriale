import { Button, Notice, PageCanvas, PageShell } from '../../components/ui';
import { AppChrome } from '../../shared/AppChrome';
import { ScenarioForm } from '../scenario/@components/ScenarioForm';
import type { ScenarioFormActions, ScenarioFormValues } from '../scenario/@components/scenarioFormModel';

type Props = {
  account: { name: string; email: string; initials: string; role?: string } | null;
  scenarioId: string;
  initialValues: ScenarioFormValues | null;
  status: 'loading' | 'error' | 'ready';
  loadError?: string;
  saving: boolean;
  aiWorking: boolean;
  actions: ScenarioFormActions;
  onRetry: () => void;
  onLogout: () => void | Promise<void>;
};

export function EditScenarioPresentation({
  account,
  scenarioId,
  initialValues,
  status,
  loadError,
  saving,
  aiWorking,
  actions,
  onRetry,
  onLogout,
}: Props) {
  if (status !== 'ready' || !initialValues) {
    return (
      <AppChrome
        section="library"
        breadcrumbs={[{ label: 'Myriale', to: 'home' }, { label: 'ライブラリ', to: 'scenarioList' }, { label: 'シナリオを編集' }]}
        account={account}
        onLogout={onLogout}
      >
        <PageCanvas data-myriale-theme="archive">
          <PageShell width="content" aria-label="シナリオ編集の読み込み状態">
            {status === 'loading' ? (
              <Notice tone="info">シナリオを読み込んでいます。</Notice>
            ) : (
              <Notice tone="danger">
                {loadError ?? 'シナリオを読み込めませんでした。'}{' '}
                <Button variant="text" size="sm" onClick={onRetry}>再読み込み</Button>
              </Notice>
            )}
          </PageShell>
        </PageCanvas>
      </AppChrome>
    );
  }

  return <ScenarioForm
    key={scenarioId}
    mode="edit"
    account={account}
    scenarioId={scenarioId}
    initialValues={initialValues}
    saving={saving}
    aiWorking={aiWorking}
    actions={actions}
    onLogout={onLogout}
  />;
}
