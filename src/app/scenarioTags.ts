const tagSeparatorPattern = /[,、，\n]+/;

export function parseScenarioTags(value: string | undefined): string[] {
  const seen = new Set<string>();
  return (value ?? '')
    .split(tagSeparatorPattern)
    .map((tag) => tag.trim().replace(/^#+\s*/, ''))
    .filter((tag) => {
      if (!tag || seen.has(tag)) return false;
      seen.add(tag);
      return true;
    });
}

export function serializeScenarioTags(tags: string[]): string {
  return parseScenarioTags(tags.join(',')).join(',');
}
