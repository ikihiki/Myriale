import type { ScenarioDraftDto } from '../../app/scenarioApi';
import type { ScenarioRecord } from '../../app/store';

export type ScenarioSummary = {
  id: string;
  title: string;
  status: '公開中' | '自分用';
  genre: string;
  tone: string;
  lore: string;
  heroMode: 'fixed' | 'select' | 'free';
  heroFreeGenerationAllowed: boolean;
  hero: string;
  opening: string;
};

type ScenarioSource = ScenarioRecord | ScenarioDraftDto;

export function toScenarioSummary(scenario: ScenarioSource): ScenarioSummary {
  return {
    id: scenario.id,
    title: scenario.title,
    status: scenario.status === 'published' ? '公開中' : '自分用',
    genre: scenario.genre,
    tone: scenario.tone || 'シナリオ設定に基づくトーン',
    lore: scenario.lore || '選択したシナリオの設定をSession用に読み込みます。',
    heroMode: scenario.heroMode === 'fixed' || scenario.heroMode === 'select' ? scenario.heroMode : 'free',
    heroFreeGenerationAllowed: scenario.heroMode === 'select' && (scenario.heroFreeGenerationAllowed ?? false),
    hero: scenario.hero || 'このシナリオの世界観に合う主人公を自由に作成できます。',
    opening: scenario.opening || scenario.summary || `${scenario.title}の物語が始まる。`,
  };
}
