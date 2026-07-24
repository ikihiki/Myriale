import type { ScenarioDraftDto } from '../../app/scenarioApi';
import type { ScenarioRecord } from '../../app/store';

export type ScenarioSummary = {
  id: string;
  title: string;
  status: '公開中' | '自分用';
  genre: string;
  basicInformation: string;
  heroMode: 'fixed' | 'select' | 'free';
  heroFreeGenerationAllowed: boolean;
  hero: string;
  opening: string;
};

type ScenarioSource = ScenarioRecord | ScenarioDraftDto;

function toPlainText(markdown: string | undefined) {
  return (markdown ?? '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[*_`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toScenarioSummary(scenario: ScenarioSource): ScenarioSummary {
  return {
    id: scenario.id,
    title: scenario.title,
    status: scenario.status === 'published' ? '公開中' : '自分用',
    genre: scenario.genre,
    basicInformation: toPlainText(scenario.summary) || '基本情報はまだ登録されていません。',
    heroMode: scenario.heroMode === 'fixed' || scenario.heroMode === 'select' ? scenario.heroMode : 'free',
    heroFreeGenerationAllowed: scenario.heroMode === 'select' && (scenario.heroFreeGenerationAllowed ?? false),
    hero: scenario.hero || 'このシナリオの世界観に合う主人公を自由に作成できます。',
    opening: scenario.opening || scenario.summary || `${scenario.title}の物語が始まる。`,
  };
}
