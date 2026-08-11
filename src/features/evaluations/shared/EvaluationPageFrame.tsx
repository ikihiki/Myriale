import type { ReactNode } from 'react';
import { Button, Label } from '../../../components/ui';
import { AppChrome } from '../../../shared/AppChrome';
import type { EvaluationAccount, EvaluationTab } from './evaluationPageModel';

const tabs: Array<{ id: EvaluationTab; label: string; key: 'evaluationOverview' | 'evaluationSetup' | 'evaluationExecution' | 'evaluationReviews' | 'evaluationResults' }> = [
  { id: 'overview', label: '概要', key: 'evaluationOverview' }, { id: 'setup', label: 'セットアップ', key: 'evaluationSetup' },
  { id: 'execution', label: '実行', key: 'evaluationExecution' }, { id: 'reviews', label: 'レビュー', key: 'evaluationReviews' }, { id: 'results', label: '結果', key: 'evaluationResults' },
];

export function EvaluationPageFrame({ account, title, kicker, description, evaluationId, activeTab, onNavigate, onLogout, children }: {
  account: EvaluationAccount; title: string; kicker: string; description?: string; evaluationId?: string; activeTab?: EvaluationTab;
  onNavigate: (key: 'evaluationList' | 'evaluationCreate' | 'evaluationOverview' | 'evaluationSetup' | 'evaluationExecution' | 'evaluationReviews' | 'evaluationResults', options?: { evaluationId?: string }) => void;
  onLogout: () => void | Promise<void>; children: ReactNode;
}) {
  return <AppChrome section="evaluations" breadcrumbs={[{ label: 'Myriale', to: 'home' }, { label: '評価', to: 'evaluationList' }, ...(evaluationId ? [{ label: title }] : [])]} account={account} onLogout={onLogout}>
    <main className="mx-auto grid w-full max-w-myr-chrome gap-7 px-5 py-9 text-myr-ink max-sm:px-3" aria-label={title}>
      <header className="grid gap-3 border-b border-myr-ink/15 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="kicker m-0 text-myr-iris">{kicker}</p><Label as="h1" textRole="sectionEditorial" className="m-0">{title}</Label>{description && <p className="m-0 mt-2 max-w-3xl leading-7 text-myr-ink-subtle">{description}</p>}</div>
          {!evaluationId && <Button variant="primary" onClick={() => onNavigate('evaluationCreate')}>新しい評価を作成</Button>}
        </div>
        {evaluationId && <nav className="flex flex-wrap gap-2" aria-label="評価セッション内ナビゲーション">
          {tabs.map((tab) => <Button key={tab.id} size="sm" variant={activeTab === tab.id ? 'primary' : 'secondary'} aria-current={activeTab === tab.id ? 'page' : undefined} onClick={() => onNavigate(tab.key, { evaluationId })}>{tab.label}</Button>)}
        </nav>}
      </header>
      {children}
    </main>
  </AppChrome>;
}
