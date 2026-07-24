import type { CreateScenarioPayload, ScenarioAiAssistResponse, ScenarioAiKind, ScenarioDraftDto } from '../../../app/scenarioApi';
import { emptyScenarioRuleData } from './rule-data/scenarioRuleDataModel';

export type ScenarioFormValues = Required<Omit<CreateScenarioPayload, 'tone' | 'lore' | 'ruleData'>> & {
  ruleData: NonNullable<CreateScenarioPayload['ruleData']>;
};

export type ScenarioFormCommandResult<T = undefined> = {
  ok: boolean;
  message: string;
  value?: T;
  fieldErrors?: Record<string, string[]>;
};

export type ScenarioFormSaveResult = ScenarioFormCommandResult<{ scenarioId: string }>;
export type ScenarioFormAssistResult = ScenarioFormCommandResult<ScenarioAiAssistResponse>;

export type ScenarioFormActions = {
  save: (values: ScenarioFormValues) => Promise<ScenarioFormSaveResult>;
  assist: (values: ScenarioFormValues, kind: ScenarioAiKind, target: string) => Promise<ScenarioFormAssistResult>;
};

export const emptyScenarioFormValues: ScenarioFormValues = {
  title: '',
  summary: '',
  genre: '',
  aiFreedom: '中: 設定を守りつつ提案する',
  heroMode: 'free',
  heroFreeGenerationAllowed: false,
  hero: '',
  opening: '',
  illustrationStyle: '',
  illustrationMood: '',
  illustrationNegative: '',
  sampleScene: '',
  ruleData: emptyScenarioRuleData,
};

export function scenarioDraftToFormValues(
  scenario: ScenarioDraftDto,
  ruleData = scenario.ruleData ?? emptyScenarioRuleData,
): ScenarioFormValues {
  return {
    title: scenario.title,
    summary: scenario.summary,
    genre: scenario.genre,
    aiFreedom: scenario.aiFreedom,
    heroMode: scenario.heroMode,
    heroFreeGenerationAllowed: scenario.heroFreeGenerationAllowed,
    hero: scenario.hero,
    opening: scenario.opening,
    illustrationStyle: scenario.illustrationStyle,
    illustrationMood: scenario.illustrationMood,
    illustrationNegative: scenario.illustrationNegative,
    sampleScene: scenario.sampleScene,
    ruleData,
  };
}

export function firstScenarioFormFieldError(
  fieldErrors: Record<string, string[]> | undefined,
  field: keyof ScenarioFormValues,
) {
  return fieldErrors?.[field]?.[0];
}
