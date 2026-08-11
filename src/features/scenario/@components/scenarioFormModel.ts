import type { CompareScenarioDraftNarrativeResponse, CreateScenarioPayload, ImportScenarioNarrativeTestResponse, ScenarioAiAssistResponse, ScenarioAiKind, ScenarioDraftDto, ScenarioNarrativeTestCase, ScenarioRuleDataReadinessDto, ScenarioRuleDebugRequest, ScenarioRuleDebugResponse } from '../../../app/scenarioApi';
import { emptyScenarioRuleData } from './rule-data/scenarioRuleDataModel';

export type ScenarioFormValues = Required<Omit<CreateScenarioPayload, 'ruleData'>> & {
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
export type ScenarioFormDebugResult = ScenarioFormCommandResult<ScenarioRuleDebugResponse>;
export type ScenarioFormNarrativeImportResult = ScenarioFormCommandResult<ImportScenarioNarrativeTestResponse>;
export type ScenarioFormNarrativeCompareResult = ScenarioFormCommandResult<CompareScenarioDraftNarrativeResponse>;
export type ScenarioFormReadinessResult = ScenarioFormCommandResult<ScenarioRuleDataReadinessDto>;
export type ScenarioFormPublishResult = ScenarioFormCommandResult;

export type ScenarioFormActions = {
  save: (values: ScenarioFormValues) => Promise<ScenarioFormSaveResult>;
  assist: (values: ScenarioFormValues, kind: ScenarioAiKind, target: string) => Promise<ScenarioFormAssistResult>;
  debug: (values: ScenarioFormValues, request: ScenarioRuleDebugRequest) => Promise<ScenarioFormDebugResult>;
  importNarrativeTest?: (sessionId: string, turnId: string) => Promise<ScenarioFormNarrativeImportResult>;
  compareNarrativeDraft?: (values: ScenarioFormValues, testCase: ScenarioNarrativeTestCase) => Promise<ScenarioFormNarrativeCompareResult>;
  openEvaluationCreate?: () => void;
  checkReadiness?: () => Promise<ScenarioFormReadinessResult>;
  publish?: () => Promise<ScenarioFormPublishResult>;
};

export const emptyScenarioFormValues: ScenarioFormValues = {
  title: '',
  summary: '',
  genre: '',
  tone: '',
  lore: '',
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
    tone: scenario.tone,
    lore: scenario.lore,
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
