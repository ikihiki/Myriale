import type { ScenarioAiAssistResponse, ScenarioAiKind, CreateScenarioPayload } from '../../app/scenarioApi';

export type ScenarioRegistrationValues = Required<CreateScenarioPayload>;

export type ScenarioRegistrationCommandResult<T = undefined> = {
  ok: boolean;
  message: string;
  value?: T;
  fieldErrors?: Record<string, string[]>;
};

export type ScenarioRegistrationSaveResult = ScenarioRegistrationCommandResult<{ scenarioId: string }>;
export type ScenarioRegistrationAssistResult = ScenarioRegistrationCommandResult<ScenarioAiAssistResponse>;

export type ScenarioRegistrationActions = {
  saveDraft: (values: ScenarioRegistrationValues) => Promise<ScenarioRegistrationSaveResult>;
  assist: (
    values: ScenarioRegistrationValues,
    kind: ScenarioAiKind,
    target: string,
  ) => Promise<ScenarioRegistrationAssistResult>;
};

export const initialScenarioRegistrationValues: ScenarioRegistrationValues = {
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
};

export function firstScenarioFieldError(
  fieldErrors: Record<string, string[]> | undefined,
  field: keyof ScenarioRegistrationValues,
) {
  return fieldErrors?.[field]?.[0];
}
