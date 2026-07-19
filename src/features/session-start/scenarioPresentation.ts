import type { ScenarioDraftDto } from '../../app/scenarioApi';
import type { ScenarioRecord } from '../../app/store';

export type ScenarioSummary = {
  id: string;
  title: string;
  status: '公開中' | '自分用';
  genre: string;
  tone: string;
  lore: string;
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
    opening: scenario.opening || scenario.summary || `${scenario.title}の物語が始まる。`,
  };
}
