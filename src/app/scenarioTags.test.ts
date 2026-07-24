import { describe, expect, it } from 'vitest';
import { parseScenarioTags, serializeScenarioTags } from './scenarioTags';

describe('scenario tags', () => {
  it('parses comma, Japanese punctuation, and line separated tags', () => {
    expect(parseScenarioTags('# SF, ミステリー、脱出劇\nSF')).toEqual(['SF', 'ミステリー', '脱出劇']);
  });

  it('serializes multiple tags into the existing genre API field', () => {
    expect(serializeScenarioTags(['SF', 'ミステリー', 'SF', '脱出劇'])).toBe('SF,ミステリー,脱出劇');
  });
});
