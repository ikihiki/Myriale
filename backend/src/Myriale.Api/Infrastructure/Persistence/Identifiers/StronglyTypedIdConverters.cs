using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Myriale.Api.Features.Accounts.Identifiers;
using Myriale.Api.Features.AiProviders.Identifiers;
using Myriale.Api.Features.Evaluations.Identifiers;
using Myriale.Api.Features.ModuleExecutions.Identifiers;
using Myriale.Api.Features.ModulePackages.Identifiers;
using Myriale.Api.Features.ProgressionRuntime.Identifiers;
using Myriale.Api.Features.Scenarios.Identifiers;
using Myriale.Api.Features.SessionArtifacts.Identifiers;
using Myriale.Api.Features.SessionExecutions.Identifiers;
using Myriale.Api.Features.SessionMemory.Identifiers;
using Myriale.Api.Features.Sessions.Identifiers;
using Myriale.Api.Features.Wave0.Identifiers;

namespace Myriale.Api.Infrastructure.Persistence.Identifiers;

internal sealed class AiProviderProfileIdConverter()
    : ValueConverter<AiProviderProfileId, string>(id => id.AsPrimitive(), value => new AiProviderProfileId(value));
internal sealed class AiCredentialIdConverter()
    : ValueConverter<AiCredentialId, string>(id => id.AsPrimitive(), value => new AiCredentialId(value));
internal sealed class AiProviderProfileValidationIdConverter()
    : ValueConverter<AiProviderProfileValidationId, Guid>(id => id.AsPrimitive(), value => new AiProviderProfileValidationId(value));
internal sealed class AccountIdConverter()
    : ValueConverter<AccountId, string>(id => id.AsPrimitive(), value => new AccountId(value));

internal sealed class ScenarioIdConverter()
    : ValueConverter<ScenarioId, string>(id => id.AsPrimitive(), value => new ScenarioId(value));
internal sealed class ScenarioDefinitionVersionIdConverter()
    : ValueConverter<ScenarioDefinitionVersionId, string>(id => id.AsPrimitive(), value => new ScenarioDefinitionVersionId(value));
internal sealed class ScenarioLocationIdConverter()
    : ValueConverter<ScenarioLocationId, string>(id => id.AsPrimitive(), value => new ScenarioLocationId(value));
internal sealed class ScenarioObjectTypeIdConverter()
    : ValueConverter<ScenarioObjectTypeId, string>(id => id.AsPrimitive(), value => new ScenarioObjectTypeId(value));
internal sealed class ScenarioObjectTypeActionIdConverter()
    : ValueConverter<ScenarioObjectTypeActionId, string>(id => id.AsPrimitive(), value => new ScenarioObjectTypeActionId(value));
internal sealed class ScenarioObjectIdConverter()
    : ValueConverter<ScenarioObjectId, string>(id => id.AsPrimitive(), value => new ScenarioObjectId(value));
internal sealed class ScenarioProgressionNodeIdConverter()
    : ValueConverter<ScenarioProgressionNodeId, string>(id => id.AsPrimitive(), value => new ScenarioProgressionNodeId(value));
internal sealed class ScenarioProgressionTransitionIdConverter()
    : ValueConverter<ScenarioProgressionTransitionId, string>(id => id.AsPrimitive(), value => new ScenarioProgressionTransitionId(value));
internal sealed class EvaluationSessionIdConverter() : ValueConverter<EvaluationSessionId, string>(id => id.AsPrimitive(), value => new EvaluationSessionId(value));
internal sealed class EvaluationSituationIdConverter() : ValueConverter<EvaluationSituationId, string>(id => id.AsPrimitive(), value => new EvaluationSituationId(value));
internal sealed class EvaluationCandidateIdConverter() : ValueConverter<EvaluationCandidateId, string>(id => id.AsPrimitive(), value => new EvaluationCandidateId(value));
internal sealed class EvaluationAttemptIdConverter() : ValueConverter<EvaluationAttemptId, string>(id => id.AsPrimitive(), value => new EvaluationAttemptId(value));
internal sealed class EvaluationModelInvocationIdConverter() : ValueConverter<EvaluationModelInvocationId, string>(id => id.AsPrimitive(), value => new EvaluationModelInvocationId(value));
internal sealed class EvaluationMachineJudgmentIdConverter() : ValueConverter<EvaluationMachineJudgmentId, string>(id => id.AsPrimitive(), value => new EvaluationMachineJudgmentId(value));
internal sealed class EvaluationReviewBatchIdConverter() : ValueConverter<EvaluationReviewBatchId, string>(id => id.AsPrimitive(), value => new EvaluationReviewBatchId(value));
internal sealed class EvaluationReviewAssignmentIdConverter() : ValueConverter<EvaluationReviewAssignmentId, string>(id => id.AsPrimitive(), value => new EvaluationReviewAssignmentId(value));
internal sealed class EvaluationReviewItemIdConverter() : ValueConverter<EvaluationReviewItemId, string>(id => id.AsPrimitive(), value => new EvaluationReviewItemId(value));
internal sealed class EvaluationHumanJudgmentIdConverter() : ValueConverter<EvaluationHumanJudgmentId, string>(id => id.AsPrimitive(), value => new EvaluationHumanJudgmentId(value));
internal sealed class EvaluationAggregateIdConverter() : ValueConverter<EvaluationAggregateId, string>(id => id.AsPrimitive(), value => new EvaluationAggregateId(value));

internal sealed class SessionIdConverter()
    : ValueConverter<SessionId, string>(id => id.AsPrimitive(), value => new SessionId(value));
internal sealed class SessionTurnIdConverter()
    : ValueConverter<SessionTurnId, string>(id => id.AsPrimitive(), value => new SessionTurnId(value));
internal sealed class SessionPlayerInputIdConverter()
    : ValueConverter<SessionPlayerInputId, string>(id => id.AsPrimitive(), value => new SessionPlayerInputId(value));
internal sealed class SessionObjectStateIdConverter()
    : ValueConverter<SessionObjectStateId, string>(id => id.AsPrimitive(), value => new SessionObjectStateId(value));
internal sealed class SessionRuleActionStepIdConverter()
    : ValueConverter<SessionRuleActionStepId, string>(id => id.AsPrimitive(), value => new SessionRuleActionStepId(value));

internal sealed class SessionExecutionIdConverter()
    : ValueConverter<SessionExecutionId, string>(id => id.AsPrimitive(), value => new SessionExecutionId(value));
internal sealed class SessionExecutionAttemptIdConverter()
    : ValueConverter<SessionExecutionAttemptId, string>(id => id.AsPrimitive(), value => new SessionExecutionAttemptId(value));
internal sealed class SessionAiInteractionIdConverter()
    : ValueConverter<SessionAiInteractionId, string>(id => id.AsPrimitive(), value => new SessionAiInteractionId(value));
internal sealed class SessionExecutionTriggerIdConverter()
    : ValueConverter<SessionExecutionTriggerId, string>(id => id.AsPrimitive(), value => new SessionExecutionTriggerId(value));

internal sealed class SessionArtifactIdConverter()
    : ValueConverter<SessionArtifactId, string>(id => id.AsPrimitive(), value => new SessionArtifactId(value));
internal sealed class SessionImageIdConverter()
    : ValueConverter<SessionImageId, string>(id => id.AsPrimitive(), value => new SessionImageId(value));
internal sealed class SessionNoteIdConverter()
    : ValueConverter<SessionNoteId, string>(id => id.AsPrimitive(), value => new SessionNoteId(value));
internal sealed class SessionNoteRevisionIdConverter()
    : ValueConverter<SessionNoteRevisionId, string>(id => id.AsPrimitive(), value => new SessionNoteRevisionId(value));
internal sealed class SessionSummaryIdConverter()
    : ValueConverter<SessionSummaryId, string>(id => id.AsPrimitive(), value => new SessionSummaryId(value));

internal sealed class SessionProgressionModuleSnapshotIdConverter()
    : ValueConverter<SessionProgressionModuleSnapshotId, string>(id => id.AsPrimitive(), value => new SessionProgressionModuleSnapshotId(value));
internal sealed class SessionNarrativeSignalIdConverter()
    : ValueConverter<SessionNarrativeSignalId, string>(id => id.AsPrimitive(), value => new SessionNarrativeSignalId(value));
internal sealed class SessionProgressionTransitionReceiptIdConverter()
    : ValueConverter<SessionProgressionTransitionReceiptId, string>(id => id.AsPrimitive(), value => new SessionProgressionTransitionReceiptId(value));

internal sealed class ModulePackageModuleIdConverter()
    : ValueConverter<ModulePackageModuleId, string>(id => id.AsPrimitive(), value => new ModulePackageModuleId(value));
internal sealed class ModulePackageVersionConverter()
    : ValueConverter<ModulePackageVersion, string>(id => id.AsPrimitive(), value => new ModulePackageVersion(value));
internal sealed class ModulePackageDigestConverter()
    : ValueConverter<ModulePackageDigest, string>(id => id.AsPrimitive(), value => new ModulePackageDigest(value));

internal sealed class ModuleExecutionIdConverter()
    : ValueConverter<ModuleExecutionId, string>(id => id.AsPrimitive(), value => new ModuleExecutionId(value));
internal sealed class ModuleExecutionRequestIdConverter()
    : ValueConverter<ModuleExecutionRequestId, long>(id => id.AsPrimitive(), value => new ModuleExecutionRequestId(value));
internal sealed class ModuleOutcomeApplicationIdConverter()
    : ValueConverter<ModuleOutcomeApplicationId, long>(id => id.AsPrimitive(), value => new ModuleOutcomeApplicationId(value));

internal sealed class RepresentativeStringIdConverter()
    : ValueConverter<RepresentativeStringId, string>(id => id.AsPrimitive(), value => new RepresentativeStringId(value));
internal sealed class RepresentativeLongIdConverter()
    : ValueConverter<RepresentativeLongId, long>(id => id.AsPrimitive(), value => new RepresentativeLongId(value));
internal sealed class RepresentativeGuidIdConverter()
    : ValueConverter<RepresentativeGuidId, Guid>(id => id.AsPrimitive(), value => new RepresentativeGuidId(value));

internal static class StronglyTypedIdConventions
{
    public static void Configure(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<AiProviderProfileId>().HaveConversion<AiProviderProfileIdConverter>();
        configurationBuilder.Properties<AiCredentialId>().HaveConversion<AiCredentialIdConverter>();
        configurationBuilder.Properties<AiProviderProfileValidationId>().HaveConversion<AiProviderProfileValidationIdConverter>();
        configurationBuilder.Properties<AccountId>().HaveConversion<AccountIdConverter>();

        configurationBuilder.Properties<ScenarioId>().HaveConversion<ScenarioIdConverter>();
        configurationBuilder.Properties<ScenarioDefinitionVersionId>().HaveConversion<ScenarioDefinitionVersionIdConverter>();
        configurationBuilder.Properties<ScenarioLocationId>().HaveConversion<ScenarioLocationIdConverter>();
        configurationBuilder.Properties<ScenarioObjectTypeId>().HaveConversion<ScenarioObjectTypeIdConverter>();
        configurationBuilder.Properties<ScenarioObjectTypeActionId>().HaveConversion<ScenarioObjectTypeActionIdConverter>();
        configurationBuilder.Properties<ScenarioObjectId>().HaveConversion<ScenarioObjectIdConverter>();
        configurationBuilder.Properties<ScenarioProgressionNodeId>().HaveConversion<ScenarioProgressionNodeIdConverter>();
        configurationBuilder.Properties<ScenarioProgressionTransitionId>().HaveConversion<ScenarioProgressionTransitionIdConverter>();
        configurationBuilder.Properties<EvaluationSessionId>().HaveConversion<EvaluationSessionIdConverter>();
        configurationBuilder.Properties<EvaluationSituationId>().HaveConversion<EvaluationSituationIdConverter>();
        configurationBuilder.Properties<EvaluationCandidateId>().HaveConversion<EvaluationCandidateIdConverter>();
        configurationBuilder.Properties<EvaluationAttemptId>().HaveConversion<EvaluationAttemptIdConverter>();
        configurationBuilder.Properties<EvaluationModelInvocationId>().HaveConversion<EvaluationModelInvocationIdConverter>();
        configurationBuilder.Properties<EvaluationMachineJudgmentId>().HaveConversion<EvaluationMachineJudgmentIdConverter>();
        configurationBuilder.Properties<EvaluationReviewBatchId>().HaveConversion<EvaluationReviewBatchIdConverter>();
        configurationBuilder.Properties<EvaluationReviewAssignmentId>().HaveConversion<EvaluationReviewAssignmentIdConverter>();
        configurationBuilder.Properties<EvaluationReviewItemId>().HaveConversion<EvaluationReviewItemIdConverter>();
        configurationBuilder.Properties<EvaluationHumanJudgmentId>().HaveConversion<EvaluationHumanJudgmentIdConverter>();
        configurationBuilder.Properties<EvaluationAggregateId>().HaveConversion<EvaluationAggregateIdConverter>();

        configurationBuilder.Properties<SessionId>().HaveConversion<SessionIdConverter>();
        configurationBuilder.Properties<SessionTurnId>().HaveConversion<SessionTurnIdConverter>();
        configurationBuilder.Properties<SessionPlayerInputId>().HaveConversion<SessionPlayerInputIdConverter>();
        configurationBuilder.Properties<SessionObjectStateId>().HaveConversion<SessionObjectStateIdConverter>();
        configurationBuilder.Properties<SessionRuleActionStepId>().HaveConversion<SessionRuleActionStepIdConverter>();

        configurationBuilder.Properties<SessionExecutionId>().HaveConversion<SessionExecutionIdConverter>();
        configurationBuilder.Properties<SessionExecutionAttemptId>().HaveConversion<SessionExecutionAttemptIdConverter>();
        configurationBuilder.Properties<SessionAiInteractionId>().HaveConversion<SessionAiInteractionIdConverter>();
        configurationBuilder.Properties<SessionExecutionTriggerId>().HaveConversion<SessionExecutionTriggerIdConverter>();
        configurationBuilder.Properties<SessionArtifactId>().HaveConversion<SessionArtifactIdConverter>();
        configurationBuilder.Properties<SessionImageId>().HaveConversion<SessionImageIdConverter>();
        configurationBuilder.Properties<SessionNoteId>().HaveConversion<SessionNoteIdConverter>();
        configurationBuilder.Properties<SessionNoteRevisionId>().HaveConversion<SessionNoteRevisionIdConverter>();
        configurationBuilder.Properties<SessionSummaryId>().HaveConversion<SessionSummaryIdConverter>();

        configurationBuilder.Properties<SessionProgressionModuleSnapshotId>().HaveConversion<SessionProgressionModuleSnapshotIdConverter>();
        configurationBuilder.Properties<SessionNarrativeSignalId>().HaveConversion<SessionNarrativeSignalIdConverter>();
        configurationBuilder.Properties<SessionProgressionTransitionReceiptId>().HaveConversion<SessionProgressionTransitionReceiptIdConverter>();
        configurationBuilder.Properties<ModulePackageModuleId>().HaveConversion<ModulePackageModuleIdConverter>();
        configurationBuilder.Properties<ModulePackageVersion>().HaveConversion<ModulePackageVersionConverter>();
        configurationBuilder.Properties<ModulePackageDigest>().HaveConversion<ModulePackageDigestConverter>();
        configurationBuilder.Properties<ModuleExecutionId>().HaveConversion<ModuleExecutionIdConverter>();
        configurationBuilder.Properties<ModuleExecutionRequestId>().HaveConversion<ModuleExecutionRequestIdConverter>();
        configurationBuilder.Properties<ModuleOutcomeApplicationId>().HaveConversion<ModuleOutcomeApplicationIdConverter>();

        configurationBuilder.Properties<RepresentativeStringId>().HaveConversion<RepresentativeStringIdConverter>();
        configurationBuilder.Properties<RepresentativeLongId>().HaveConversion<RepresentativeLongIdConverter>();
        configurationBuilder.Properties<RepresentativeGuidId>().HaveConversion<RepresentativeGuidIdConverter>();
    }
}
