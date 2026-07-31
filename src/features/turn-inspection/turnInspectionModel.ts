export type JsonValue = unknown;

export type AiInteractionDto = {
  id: string;
  executionId: string;
  executionAttemptId: string;
  attemptNumber: number;
  sequence: number;
  stage: string;
  aiProfileId: string;
  status: string;
  provider?: string | null;
  model?: string | null;
  providerRequestId?: string | null;
  startedAt: string;
  completedAt?: string | null;
  latencyMilliseconds?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  finishReason?: string | null;
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

export type TurnInspectionDto = {
  sessionId: string;
  scenarioId: string;
  scenarioTitle: string;
  turn: { id: string; position: number; kind: string; createdAt: string };
  playerInput?: { id: string; text: string; interactionType?: string | null; createdAt?: string | null } | null;
  execution?: {
    id: string;
    status: string;
    stage?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
    elapsedMilliseconds?: number | null;
    timeline?: TimelineEntryDto[] | null;
  } | null;
  aiInteractions?: AiInteractionDto[] | null;
  ruleEngine?: {
    startedAt?: string | null;
    completedAt?: string | null;
    durationMilliseconds?: number | null;
    timeline?: TimelineEntryDto[] | null;
    input?: JsonValue;
    selectedAction?: JsonValue;
    arguments?: JsonValue;
    preState?: JsonValue;
    postState?: JsonValue;
    appliedEffects?: JsonValue[] | null;
    facts?: JsonValue[] | null;
    events?: JsonValue[] | null;
    hints?: JsonValue[] | null;
    derivedChanges?: JsonValue[] | null;
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
  playerInput: TurnInspectionDto['playerInput'];
  execution: (NonNullable<TurnInspectionDto['execution']> & {
    startedLabel: string;
    completedLabel: string;
    elapsedLabel: string;
    timeline: TimelineEntry[];
  }) | null;
  interactions: AiInteraction[];
  ruleEngine: (NonNullable<TurnInspectionDto['ruleEngine']> & {
    startedLabel: string;
    completedLabel: string;
    durationLabel: string;
    timeline: TimelineEntry[];
  }) | null;
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

function toTimeline(entries?: TimelineEntryDto[] | null): TimelineEntry[] {
  return (entries ?? []).map((entry) => ({
    ...entry,
    label: entry.label || entry.stage,
    startedLabel: formatDateTime(entry.startedAt),
    completedLabel: formatDateTime(entry.completedAt),
    durationLabel: formatDuration(entry.durationMilliseconds),
  }));
}

export function toTurnInspection(dto: TurnInspectionDto): TurnInspection {
  return {
    sessionId: dto.sessionId,
    scenarioId: dto.scenarioId,
    scenarioTitle: dto.scenarioTitle,
    turn: { ...dto.turn, createdLabel: formatDateTime(dto.turn.createdAt) },
    playerInput: dto.playerInput ?? null,
    execution: dto.execution ? {
      ...dto.execution,
      startedLabel: formatDateTime(dto.execution.startedAt),
      completedLabel: formatDateTime(dto.execution.completedAt),
      elapsedLabel: formatDuration(dto.execution.elapsedMilliseconds),
      timeline: toTimeline(dto.execution.timeline),
    } : null,
    interactions: [...(dto.aiInteractions ?? [])]
      .sort((left, right) => Date.parse(left.startedAt) - Date.parse(right.startedAt) || left.sequence - right.sequence)
      .map((interaction) => ({
        ...interaction,
        providerLabel: interaction.provider || '不明',
        modelLabel: interaction.model || '不明',
        startedLabel: formatDateTime(interaction.startedAt),
        completedLabel: formatDateTime(interaction.completedAt),
        latencyLabel: formatDuration(interaction.latencyMilliseconds),
        tokenLabel: formatTokens(interaction.inputTokens, interaction.outputTokens),
        sentPromptLabel: interaction.sentPrompt || '送信プロンプトは記録されていません。',
        receivedResultLabel: interaction.receivedResult || '受信結果は記録されていません。',
      })),
    ruleEngine: dto.ruleEngine ? {
      ...dto.ruleEngine,
      startedLabel: formatDateTime(dto.ruleEngine.startedAt),
      completedLabel: formatDateTime(dto.ruleEngine.completedAt),
      durationLabel: formatDuration(dto.ruleEngine.durationMilliseconds),
      timeline: toTimeline(dto.ruleEngine.timeline),
    } : null,
    rawJson: JSON.stringify(dto, null, 2),
  };
}

export function stringifyInspectionValue(value: JsonValue) {
  if (value == null) return '記録なし';
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}
