export type SessionAiInteractionDto = {
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

export type SessionAiHistoryDto = {
  sessionId: string;
  scenarioId: string;
  scenarioTitle: string;
  interactions: SessionAiInteractionDto[];
};

export type SessionAiInteraction = {
  id: string;
  executionId: string;
  executionAttemptId: string;
  attemptNumber: number;
  sequence: number;
  stage: string;
  aiProfileId: string;
  status: string;
  provider: string;
  model: string;
  providerRequestId: string | null;
  startedLabel: string;
  completedLabel: string | null;
  latencyLabel: string;
  tokenLabel: string;
  finishReason: string | null;
  errorCode: string | null;
  sentPrompt: string;
  receivedResult: string;
  validationResult: string | null;
};

export type SessionAiHistory = {
  sessionId: string;
  scenarioId: string;
  scenarioTitle: string;
  interactions: SessionAiInteraction[];
};

export type SessionAiHistoryState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; history: SessionAiHistory };

const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  dateStyle: 'medium',
  timeStyle: 'medium',
});

function formatDateTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date);
}

function formatLatency(value?: number | null) {
  if (value == null) return '計測なし';
  if (value < 1_000) return `${value} ms`;
  return `${(value / 1_000).toFixed(2)} 秒`;
}

function formatTokens(input?: number | null, output?: number | null) {
  if (input == null && output == null) return '記録なし';
  return `入力 ${input ?? '—'} / 出力 ${output ?? '—'}`;
}

export function toSessionAiHistory(dto: SessionAiHistoryDto): SessionAiHistory {
  return {
    sessionId: dto.sessionId,
    scenarioId: dto.scenarioId,
    scenarioTitle: dto.scenarioTitle,
    interactions: [...dto.interactions]
      .sort((left, right) => Date.parse(left.startedAt) - Date.parse(right.startedAt)
        || left.attemptNumber - right.attemptNumber
        || left.sequence - right.sequence)
      .map((interaction) => ({
        id: interaction.id,
        executionId: interaction.executionId,
        executionAttemptId: interaction.executionAttemptId,
        attemptNumber: interaction.attemptNumber,
        sequence: interaction.sequence,
        stage: interaction.stage,
        aiProfileId: interaction.aiProfileId,
        status: interaction.status,
        provider: interaction.provider || '不明',
        model: interaction.model || '不明',
        providerRequestId: interaction.providerRequestId || null,
        startedLabel: formatDateTime(interaction.startedAt) ?? interaction.startedAt,
        completedLabel: formatDateTime(interaction.completedAt),
        latencyLabel: formatLatency(interaction.latencyMilliseconds),
        tokenLabel: formatTokens(interaction.inputTokens, interaction.outputTokens),
        finishReason: interaction.finishReason || null,
        errorCode: interaction.errorCode || null,
        sentPrompt: interaction.sentPrompt || '送信プロンプトは記録されていません。',
        receivedResult: interaction.receivedResult || '受信結果は記録されていません。',
        validationResult: interaction.validationResult || null,
      })),
  };
}
