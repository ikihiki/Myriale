export type JsonValue = unknown;

export type AiInteractionDto = {
  id: string;
  attemptNumber: number;
  sequence: number;
  stage: string;
  aiProfileId: string;
  provider?: string | null;
  model?: string | null;
  providerRequestId?: string | null;
  startedAt: string;
  completedAt: string;
  elapsedMilliseconds: number;
  latencyMilliseconds?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  finishReason?: string | null;
  status: string;
  errorCode?: string | null;
  sentPrompt?: string | null;
  receivedResult?: string | null;
  validationResult?: string | null;
};

export type TimelineEntryDto = {
  label?: string | null;
  stage: string;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMilliseconds?: number | null;
};

type RuleTimingDto = {
  createdAt: string;
  enumeratedAt?: string | null;
  selectedAt?: string | null;
  appliedAt?: string | null;
  narrativePublishedAt?: string | null;
  enumerationElapsedMilliseconds?: number | null;
  selectionElapsedMilliseconds?: number | null;
  applicationElapsedMilliseconds?: number | null;
  narrativeElapsedMilliseconds?: number | null;
  totalElapsedMilliseconds?: number | null;
};

export type TurnInspectionDto = {
  session: { id: string; status: string; revision: number; createdAt: string; updatedAt: string };
  scenario: { id: string; title: string; definitionVersionId?: string | null };
  turn: { id: string; position: number; kind: string; heading?: string | null; narrativeBody?: string | null; createdAt: string };
  playerInput: { id: string; text: string; interactionType: string; acceptedAt: string };
  execution: {
    id: string;
    kind: string;
    status: string;
    stage?: string | null;
    attemptCount: number;
    createdAt: string;
    queuedAt: string;
    startedAt?: string | null;
    completedAt?: string | null;
    elapsedMilliseconds?: number | null;
  };
  aiInteractions: AiInteractionDto[];
  ruleEngine?: {
    stepId: string;
    stage: string;
    schemaVersion: string;
    preSessionRevision: number;
    postSessionRevision?: number | null;
    actionSnapshot?: JsonValue;
    selectedAction?: { arguments?: JsonValue; [key: string]: JsonValue } | null;
    selectedRuleId?: string | null;
    appliedEffects: JsonValue[];
    postState?: JsonValue;
    facts: JsonValue[];
    events: JsonValue[];
    hints: JsonValue[];
    changes: JsonValue[];
    timing: RuleTimingDto;
  } | null;
};

export type AiInteraction = AiInteractionDto & {
  providerLabel: string;
  modelLabel: string;
  startedLabel: string;
  completedLabel: string;
  latencyLabel: string;
  tokenLabel: string;
  sentPromptLabel: string;
  receivedResultLabel: string;
};

export type TimelineEntry = TimelineEntryDto & {
  label: string;
  startedLabel: string;
  completedLabel: string;
  durationLabel: string;
};

export type TurnInspection = {
  sessionId: string;
  scenarioId: string;
  scenarioTitle: string;
  turn: TurnInspectionDto['turn'] & { createdLabel: string };
  playerInput: { id: string; text: string; interactionType: string; createdAt: string };
  execution: TurnInspectionDto['execution'] & {
    startedLabel: string;
    completedLabel: string;
    elapsedLabel: string;
    timeline: TimelineEntry[];
  };
  interactions: AiInteraction[];
  ruleEngine: {
    startedAt: string;
    completedAt: string | null;
    durationMilliseconds: number | null;
    timeline: TimelineEntry[];
    input: JsonValue;
    selectedAction: JsonValue;
    arguments: JsonValue;
    preState: JsonValue;
    postState: JsonValue;
    appliedEffects: JsonValue[];
    facts: JsonValue[];
    events: JsonValue[];
    hints: JsonValue[];
    derivedChanges: JsonValue[];
    startedLabel: string;
    completedLabel: string;
    durationLabel: string;
  } | null;
  rawJson: string;
};

export type TurnInspectionState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; inspection: TurnInspection };

const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeStyle: 'long' });

export function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date);
}

export function formatDuration(value?: number | null) {
  if (value == null) return '計測なし';
  if (value < 1_000) return `${value} ms`;
  return `${(value / 1_000).toFixed(2)} 秒`;
}

function formatTokens(input?: number | null, output?: number | null) {
  if (input == null && output == null) return '記録なし';
  return `入力 ${input ?? '—'} / 出力 ${output ?? '—'}`;
}

function toTimeline(entries: TimelineEntryDto[]): TimelineEntry[] {
  return entries.filter((entry) => entry.startedAt || entry.completedAt || entry.durationMilliseconds != null).map((entry) => ({
    ...entry,
    label: entry.label || entry.stage,
    startedLabel: formatDateTime(entry.startedAt),
    completedLabel: formatDateTime(entry.completedAt),
    durationLabel: formatDuration(entry.durationMilliseconds),
  }));
}

function ruleTimeline(timing: RuleTimingDto): TimelineEntry[] {
  return toTimeline([
    { stage: 'enumeration', label: '利用可能な行動を列挙', startedAt: timing.createdAt, completedAt: timing.enumeratedAt, durationMilliseconds: timing.enumerationElapsedMilliseconds },
    { stage: 'selection', label: '入力から行動を選択', startedAt: timing.enumeratedAt, completedAt: timing.selectedAt, durationMilliseconds: timing.selectionElapsedMilliseconds },
    { stage: 'application', label: 'ルールと効果を適用', startedAt: timing.selectedAt, completedAt: timing.appliedAt, durationMilliseconds: timing.applicationElapsedMilliseconds },
    { stage: 'narrative', label: '確定状態からNarrativeを公開', startedAt: timing.appliedAt, completedAt: timing.narrativePublishedAt, durationMilliseconds: timing.narrativeElapsedMilliseconds },
  ]);
}

export function toTurnInspection(dto: TurnInspectionDto): TurnInspection {
  const executionStart = dto.execution.startedAt ?? dto.execution.queuedAt;
  const rule = dto.ruleEngine;
  const ruleCompletedAt = rule?.timing.narrativePublishedAt ?? rule?.timing.appliedAt ?? rule?.timing.selectedAt ?? rule?.timing.enumeratedAt ?? null;
  return {
    sessionId: dto.session.id,
    scenarioId: dto.scenario.id,
    scenarioTitle: dto.scenario.title,
    turn: { ...dto.turn, createdLabel: formatDateTime(dto.turn.createdAt) },
    playerInput: { ...dto.playerInput, createdAt: dto.playerInput.acceptedAt },
    execution: {
      ...dto.execution,
      startedLabel: formatDateTime(executionStart),
      completedLabel: formatDateTime(dto.execution.completedAt),
      elapsedLabel: formatDuration(dto.execution.elapsedMilliseconds),
      timeline: toTimeline([{ stage: dto.execution.stage ?? dto.execution.status, label: 'Turn execution', startedAt: executionStart, completedAt: dto.execution.completedAt, durationMilliseconds: dto.execution.elapsedMilliseconds }]),
    },
    interactions: [...dto.aiInteractions]
      .sort((left, right) => Date.parse(left.startedAt) - Date.parse(right.startedAt) || left.attemptNumber - right.attemptNumber || left.sequence - right.sequence)
      .map((interaction) => ({
        ...interaction,
        providerLabel: interaction.provider || '不明',
        modelLabel: interaction.model || '不明',
        startedLabel: formatDateTime(interaction.startedAt),
        completedLabel: formatDateTime(interaction.completedAt),
        latencyLabel: formatDuration(interaction.elapsedMilliseconds ?? interaction.latencyMilliseconds),
        tokenLabel: formatTokens(interaction.inputTokens, interaction.outputTokens),
        sentPromptLabel: interaction.sentPrompt || '送信プロンプトは記録されていません。',
        receivedResultLabel: interaction.receivedResult || '受信結果は記録されていません。',
      })),
    ruleEngine: rule ? {
      startedAt: rule.timing.createdAt,
      completedAt: ruleCompletedAt,
      durationMilliseconds: rule.timing.totalElapsedMilliseconds ?? null,
      timeline: ruleTimeline(rule.timing),
      input: { playerInput: dto.playerInput, actionSnapshot: rule.actionSnapshot },
      selectedAction: { selectedRuleId: rule.selectedRuleId, action: rule.selectedAction },
      arguments: rule.selectedAction?.arguments ?? null,
      preState: { sessionRevision: rule.preSessionRevision, actionSnapshot: rule.actionSnapshot },
      postState: rule.postState,
      appliedEffects: rule.appliedEffects,
      facts: rule.facts,
      events: rule.events,
      hints: rule.hints,
      derivedChanges: rule.changes,
      startedLabel: formatDateTime(rule.timing.createdAt),
      completedLabel: formatDateTime(ruleCompletedAt),
      durationLabel: formatDuration(rule.timing.totalElapsedMilliseconds),
    } : null,
    rawJson: JSON.stringify(dto, null, 2),
  };
}

export function stringifyInspectionValue(value: JsonValue) {
  if (value == null) return '記録なし';
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}
