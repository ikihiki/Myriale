using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Infrastructure.Persistence;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Scenario> Scenarios => Set<Scenario>();
    public DbSet<ScenarioDefinitionVersion> ScenarioDefinitionVersions => Set<ScenarioDefinitionVersion>();
    public DbSet<EvaluationSession> EvaluationSessions => Set<EvaluationSession>();
    public DbSet<EvaluationSituation> EvaluationSituations => Set<EvaluationSituation>();
    public DbSet<EvaluationCandidate> EvaluationCandidates => Set<EvaluationCandidate>();
    public DbSet<EvaluationAttempt> EvaluationAttempts => Set<EvaluationAttempt>();
    public DbSet<EvaluationModelInvocation> EvaluationModelInvocations => Set<EvaluationModelInvocation>();
    public DbSet<EvaluationMachineJudgment> EvaluationMachineJudgments => Set<EvaluationMachineJudgment>();
    public DbSet<EvaluationReviewBatch> EvaluationReviewBatches => Set<EvaluationReviewBatch>();
    public DbSet<EvaluationReviewAssignment> EvaluationReviewAssignments => Set<EvaluationReviewAssignment>();
    public DbSet<EvaluationReviewItem> EvaluationReviewItems => Set<EvaluationReviewItem>();
    public DbSet<EvaluationHumanJudgment> EvaluationHumanJudgments => Set<EvaluationHumanJudgment>();
    public DbSet<EvaluationAggregate> EvaluationAggregates => Set<EvaluationAggregate>();
    public DbSet<ScenarioLocation> ScenarioLocations => Set<ScenarioLocation>();
    public DbSet<ScenarioObjectType> ScenarioObjectTypes => Set<ScenarioObjectType>();
    public DbSet<ScenarioObjectTypeAction> ScenarioObjectTypeActions => Set<ScenarioObjectTypeAction>();
    public DbSet<ScenarioObject> ScenarioObjects => Set<ScenarioObject>();
    public DbSet<AiCredential> AiCredentials => Set<AiCredential>();
    public DbSet<AiProviderProfile> AiProviderProfiles => Set<AiProviderProfile>();
    public DbSet<AiProviderProfileValidation> AiProviderProfileValidations => Set<AiProviderProfileValidation>();
    public DbSet<AiProviderRuntimeSettings> AiProviderRuntimeSettings => Set<AiProviderRuntimeSettings>();
    public DbSet<ModulePackage> ModulePackages => Set<ModulePackage>();
    public DbSet<ScenarioProgressionNode> ScenarioProgressionNodes => Set<ScenarioProgressionNode>();
    public DbSet<ScenarioProgressionTransition> ScenarioProgressionTransitions => Set<ScenarioProgressionTransition>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<SessionTurn> SessionTurns => Set<SessionTurn>();
    public DbSet<SessionState> SessionStates => Set<SessionState>();
    public DbSet<SessionProgressionModuleSnapshot> SessionProgressionModuleSnapshots => Set<SessionProgressionModuleSnapshot>();
    public DbSet<SessionProgressState> SessionProgressStates => Set<SessionProgressState>();
    public DbSet<SessionNarrativeSignal> SessionNarrativeSignals => Set<SessionNarrativeSignal>();
    public DbSet<SessionProgressionTransitionReceipt> SessionProgressionTransitionReceipts => Set<SessionProgressionTransitionReceipt>();
    public DbSet<SessionPlayerInput> SessionPlayerInputs => Set<SessionPlayerInput>();
    public DbSet<SessionExecution> SessionExecutions => Set<SessionExecution>();
    public DbSet<SessionObjectState> SessionObjectStates => Set<SessionObjectState>();
    public DbSet<SessionRuleActionStep> SessionRuleActionSteps => Set<SessionRuleActionStep>();
    public DbSet<SessionExecutionAttempt> SessionExecutionAttempts => Set<SessionExecutionAttempt>();
    public DbSet<SessionAiInteraction> SessionAiInteractions => Set<SessionAiInteraction>();
    public DbSet<SessionArtifact> SessionArtifacts => Set<SessionArtifact>();
    public DbSet<SessionNote> SessionNotes => Set<SessionNote>();
    public DbSet<SessionNoteRevision> SessionNoteRevisions => Set<SessionNoteRevision>();
    public DbSet<SessionNoteProposal> SessionNoteProposals => Set<SessionNoteProposal>();
    public DbSet<SessionSummary> SessionSummaries => Set<SessionSummary>();
    public DbSet<SessionTurnLorebookReference> SessionTurnLorebookReferences => Set<SessionTurnLorebookReference>();
    public DbSet<SessionImage> SessionImages => Set<SessionImage>();
    public DbSet<ModuleExecution> ModuleExecutions => Set<ModuleExecution>();
    public DbSet<ModuleExecutionRequest> ModuleExecutionRequests => Set<ModuleExecutionRequest>();
    public DbSet<ModuleOutcomeApplication> ModuleOutcomeApplications => Set<ModuleOutcomeApplication>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        base.ConfigureConventions(configurationBuilder);
        StronglyTypedIdConventions.Configure(configurationBuilder);
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
