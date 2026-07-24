import type {
  ScenarioFormActions,
  ScenarioFormAssistResult,
  ScenarioFormCommandResult,
  ScenarioFormSaveResult,
  ScenarioFormValues,
} from '../scenario/@components/scenarioFormModel';
import { emptyScenarioFormValues, firstScenarioFormFieldError } from '../scenario/@components/scenarioFormModel';

export type ScenarioRegistrationValues = ScenarioFormValues;
export type ScenarioRegistrationCommandResult<T = undefined> = ScenarioFormCommandResult<T>;
export type ScenarioRegistrationSaveResult = ScenarioFormSaveResult;
export type ScenarioRegistrationAssistResult = ScenarioFormAssistResult;
export type ScenarioRegistrationActions = {
  saveDraft: ScenarioFormActions['save'];
  assist: ScenarioFormActions['assist'];
};
export const initialScenarioRegistrationValues = emptyScenarioFormValues;
export const firstScenarioFieldError = firstScenarioFormFieldError;
