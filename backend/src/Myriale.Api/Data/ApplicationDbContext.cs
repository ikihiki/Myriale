using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Scenario> Scenarios => Set<Scenario>();
    public DbSet<ScenarioDefinitionVersion> ScenarioDefinitionVersions => Set<ScenarioDefinitionVersion>();
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

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<AiProviderProfile>().Property(profile => profile.Id).HasConversion(id => id.Value, value => new AiProviderProfileId(value));
        builder.Entity<AiProviderProfile>().Property(profile => profile.CredentialId).HasConversion(id => id.Value, value => new AiCredentialId(value));
        builder.Entity<AiProviderProfile>().Property(profile => profile.Adapter).HasConversion<string>();
        builder.Entity<AiProviderProfile>().Property(profile => profile.Revision).IsConcurrencyToken();
        builder.Entity<AiCredential>().Property(credential => credential.Id).HasConversion(id => id.Value, value => new AiCredentialId(value));
        builder.Entity<AiCredential>().Property(credential => credential.Revision).IsConcurrencyToken();
        builder.Entity<AiProviderProfileValidation>().Property(validation => validation.ProfileId).HasConversion(id => id.Value, value => new AiProviderProfileId(value));
        builder.Entity<AiProviderProfileValidation>().Property(validation => validation.CredentialId).HasConversion(id => id.Value, value => new AiCredentialId(value));
        builder.Entity<AiProviderProfileValidation>().Property(validation => validation.Status).HasConversion<string>();
        builder.Entity<AiProviderProfileValidation>().HasIndex(validation => new { validation.ProfileId, validation.TestedAt });
        builder.Entity<AiProviderRuntimeSettings>().Property(settings => settings.Revision).IsConcurrencyToken();
        builder.Entity<Scenario>().Property(scenario => scenario.Revision).IsConcurrencyToken();
        builder.Entity<ScenarioDefinitionVersion>().Property(version => version.Revision).IsConcurrencyToken();
        builder.Entity<ScenarioDefinitionVersion>().Ignore(version => version.DomainEvents);
        builder.Entity<Scenario>().Property(scenario => scenario.Title)
            .HasConversion(value => value.Value, value => new ScenarioTitle(value));
        builder.Entity<Scenario>().Property(scenario => scenario.HeroMode)
            .HasConversion<string>();
        builder.Entity<Scenario>().Property(scenario => scenario.Status)
            .HasConversion<string>();
        builder.Entity<Scenario>().Property(scenario => scenario.IllustrationStyle)
            .HasConversion(value => value.Value, value => new IllustrationPrompt(value));
        builder.Entity<Scenario>().Property(scenario => scenario.IllustrationMood)
            .HasConversion(value => value.Value, value => new IllustrationPrompt(value));
        builder.Entity<Scenario>().Property(scenario => scenario.IllustrationNegative)
            .HasConversion(value => value.Value, value => new IllustrationPrompt(value));
        builder.Entity<ScenarioDefinitionVersion>().Property(version => version.Status)
            .HasConversion<string>();
        builder.Entity<ScenarioDefinitionVersion>().Property(version => version.ScenarioTitle)
            .HasConversion(value => value.Value, value => new ScenarioTitle(value));
        builder.Entity<ScenarioDefinitionVersion>().Property(version => version.ScenarioHeroMode)
            .HasConversion<string>();
        builder.Entity<ScenarioDefinitionVersion>().Property(version => version.ScenarioIllustrationStyle)
            .HasConversion(value => value.Value, value => new IllustrationPrompt(value));
        builder.Entity<ScenarioDefinitionVersion>().Property(version => version.ScenarioIllustrationMood)
            .HasConversion(value => value.Value, value => new IllustrationPrompt(value));
        builder.Entity<ScenarioDefinitionVersion>().Property(version => version.ScenarioIllustrationNegative)
            .HasConversion(value => value.Value, value => new IllustrationPrompt(value));
        builder.Entity<ScenarioObjectTypeAction>().Property(action => action.Visibility)
            .HasConversion<string>();
        builder.Entity<ScenarioObjectTypeAction>().Property(action => action.ExecutionMode)
            .HasConversion<string>();
        builder.Entity<ScenarioDefinitionVersion>()
            .HasIndex(version => new { version.ScenarioId, version.Version }).IsUnique();
        builder.Entity<ScenarioDefinitionVersion>()
            .HasIndex(version => version.ScenarioId).IsUnique()
            .HasFilter("\"Status\" = 'Draft'");
        builder.Entity<ScenarioDefinitionVersion>()
            .HasOne(version => version.Scenario).WithMany().HasForeignKey(version => version.ScenarioId).OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ScenarioLocation>()
            .HasIndex(location => new { location.DefinitionVersionId, location.Code }).IsUnique();
        builder.Entity<ScenarioLocation>()
            .HasOne(location => location.DefinitionVersion).WithMany(version => version.Locations)
            .HasForeignKey(location => location.DefinitionVersionId).OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ScenarioObjectType>()
            .HasIndex(type => new { type.DefinitionVersionId, type.Code }).IsUnique();
        builder.Entity<ScenarioObjectType>()
            .HasOne(type => type.DefinitionVersion).WithMany(version => version.ObjectTypes)
            .HasForeignKey(type => type.DefinitionVersionId).OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ScenarioObjectTypeAction>()
            .HasIndex(action => new { action.ObjectTypeId, action.Code }).IsUnique();
        builder.Entity<ScenarioObjectTypeAction>()
            .HasOne(action => action.ObjectType).WithMany(type => type.Actions)
            .HasForeignKey(action => action.ObjectTypeId).OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ScenarioObject>()
            .HasIndex(item => new { item.DefinitionVersionId, item.Code }).IsUnique();
        builder.Entity<ScenarioObject>()
            .HasOne(item => item.DefinitionVersion).WithMany(version => version.Objects)
            .HasForeignKey(item => item.DefinitionVersionId).OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ScenarioObject>()
            .HasOne(item => item.Location).WithMany().HasForeignKey(item => item.LocationId).OnDelete(DeleteBehavior.Restrict);
        builder.Entity<ModulePackage>().Property(package => package.Digest)
            .HasConversion(value => value.Value, value => new ModulePackageDigest(value));
        builder.Entity<ModulePackage>().Property(package => package.ModuleId)
            .HasConversion(value => value.Value, value => new ModulePackageModuleId(value));
        builder.Entity<ModulePackage>().Property(package => package.Version)
            .HasConversion(value => value.Value, value => new ModulePackageVersion(value));
        builder.Entity<ModulePackage>().Property(package => package.ManifestJson).IsRequired();
        builder.Entity<ModulePackage>().Property(package => package.Format).HasConversion<string>();
        builder.Entity<ModulePackage>().Property(package => package.Status).HasConversion<string>();
        builder.Entity<ModulePackage>().Property(package => package.Revision).IsConcurrencyToken();
        builder.Entity<ModulePackage>()
            .HasIndex(package => new { package.ModuleId, package.Version })
            .IsUnique();
        builder.Entity<ScenarioProgressionNode>()
            .HasIndex(node => new { node.DefinitionVersionId, node.Code })
            .IsUnique();
        builder.Entity<ScenarioProgressionNode>()
            .HasOne(node => node.DefinitionVersion)
            .WithMany(version => version.ProgressionNodes)
            .HasForeignKey(node => node.DefinitionVersionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ScenarioProgressionTransition>()
            .HasIndex(transition => new { transition.DefinitionVersionId, transition.SourceNodeId, transition.SignalCode })
            .IsUnique();
        builder.Entity<ScenarioProgressionTransition>()
            .HasOne(transition => transition.DefinitionVersion)
            .WithMany(version => version.ProgressionTransitions)
            .HasForeignKey(transition => transition.DefinitionVersionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ScenarioProgressionTransition>()
            .HasOne(transition => transition.SourceNode)
            .WithMany()
            .HasForeignKey(transition => transition.SourceNodeId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<ScenarioProgressionTransition>()
            .HasOne(transition => transition.TargetNode)
            .WithMany()
            .HasForeignKey(transition => transition.TargetNodeId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<Session>()
            .Property(session => session.Status)
            .HasConversion(value => value.ToWireValue(), value => SessionEnumValues.ParseStatus(value));
        builder.Entity<SessionTurn>()
            .Property(turn => turn.Kind)
            .HasConversion(value => value.ToWireValue(), value => SessionEnumValues.ParseTurnKind(value));
        builder.Entity<SessionTurn>()
            .Property(turn => turn.DialogueTurnType)
            .HasConversion(
                value => value == null ? null : value.Value.ToWireValue(),
                value => value == null ? null : SessionEnumValues.ParseTurnType(value));
        builder.Entity<SessionPlayerInput>()
            .Property(input => input.InteractionType)
            .HasConversion(value => value.ToWireValue(), value => SessionEnumValues.ParseInteractionType(value));
        builder.Entity<Session>()
            .Property(session => session.Revision)
            .IsConcurrencyToken();
        builder.Entity<Session>()
            .HasOne(session => session.HeadTurn)
            .WithMany()
            .HasForeignKey(session => session.HeadTurnId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<Session>()
            .HasIndex(session => new { session.OwnerId, session.CreationRequestId })
            .IsUnique()
            .HasFilter("\"CreationRequestId\" IS NOT NULL");
        builder.Entity<Session>()
            .HasIndex(session => new { session.OwnerId, session.UpdatedAt });
        builder.Entity<Session>()
            .HasOne(session => session.Scenario)
            .WithMany()
            .HasForeignKey(session => session.ScenarioId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<Session>()
            .HasOne(session => session.ScenarioDefinitionVersion)
            .WithMany()
            .HasForeignKey(session => session.ScenarioDefinitionVersionId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<Session>()
            .HasOne(session => session.CurrentLocation)
            .WithMany()
            .HasForeignKey(session => session.CurrentLocationId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<SessionObjectState>()
            .Property(state => state.Revision)
            .IsConcurrencyToken();
        builder.Entity<SessionObjectState>()
            .HasIndex(state => new { state.SessionId, state.ScenarioObjectId })
            .IsUnique();
        builder.Entity<SessionObjectState>()
            .HasOne(state => state.Session).WithMany(session => session.ObjectStates)
            .HasForeignKey(state => state.SessionId).OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionObjectState>()
            .HasOne(state => state.ScenarioObject).WithMany()
            .HasForeignKey(state => state.ScenarioObjectId).OnDelete(DeleteBehavior.Restrict);
        builder.Entity<SessionObjectState>()
            .HasOne(state => state.Location).WithMany()
            .HasForeignKey(state => state.LocationId).OnDelete(DeleteBehavior.Restrict);
        builder.Entity<SessionRuleActionStep>().Property(step => step.Stage)
            .HasConversion(value => value.ToWireValue(), value => ScenarioTurnStageValues.Parse(value));
        builder.Entity<SessionRuleActionStep>()
            .HasIndex(step => step.ExecutionId).IsUnique();
        builder.Entity<SessionRuleActionStep>()
            .HasIndex(step => step.PlayerInputId).IsUnique();
        builder.Entity<SessionRuleActionStep>()
            .HasOne(step => step.Session).WithMany(session => session.RuleActionSteps)
            .HasForeignKey(step => step.SessionId).OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionRuleActionStep>()
            .HasOne(step => step.Execution).WithOne()
            .HasForeignKey<SessionRuleActionStep>(step => step.ExecutionId).OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionRuleActionStep>()
            .HasOne(step => step.PlayerInput).WithOne()
            .HasForeignKey<SessionRuleActionStep>(step => step.PlayerInputId).OnDelete(DeleteBehavior.Restrict);
        builder.Entity<SessionState>()
            .Property(state => state.Revision)
            .IsConcurrencyToken();
        builder.Entity<SessionState>()
            .HasOne(state => state.Session)
            .WithOne(session => session.State)
            .HasForeignKey<SessionState>(state => state.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionProgressionModuleSnapshot>()
            .HasIndex(snapshot => new { snapshot.SessionId, snapshot.TransitionId })
            .IsUnique();
        builder.Entity<SessionProgressionModuleSnapshot>()
            .HasOne(snapshot => snapshot.Session)
            .WithMany(session => session.ProgressionModuleSnapshots)
            .HasForeignKey(snapshot => snapshot.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionProgressionModuleSnapshot>()
            .HasOne(snapshot => snapshot.Transition)
            .WithMany()
            .HasForeignKey(snapshot => snapshot.TransitionId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<SessionProgressState>()
            .Property(progress => progress.Revision)
            .IsConcurrencyToken();
        builder.Entity<SessionProgressState>()
            .HasOne(progress => progress.Session)
            .WithOne(session => session.Progress)
            .HasForeignKey<SessionProgressState>(progress => progress.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionProgressState>()
            .HasOne(progress => progress.CurrentNode)
            .WithMany()
            .HasForeignKey(progress => progress.CurrentNodeId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<SessionNarrativeSignal>()
            .HasIndex(signal => new { signal.NarrativeTurnId, signal.Code })
            .IsUnique();
        builder.Entity<SessionNarrativeSignal>()
            .HasOne(signal => signal.Session)
            .WithMany(session => session.NarrativeSignals)
            .HasForeignKey(signal => signal.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionNarrativeSignal>()
            .HasOne(signal => signal.NarrativeTurn)
            .WithMany(turn => turn.NarrativeSignals)
            .HasForeignKey(signal => signal.NarrativeTurnId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionProgressionTransitionReceipt>()
            .Property(receipt => receipt.Status)
            .HasConversion(
                status => status.ToWireValue(),
                value => ProgressionReceiptStatusValues.Parse(value));
        builder.Entity<SessionProgressionTransitionReceipt>()
            .Property(receipt => receipt.Revision)
            .IsConcurrencyToken();
        builder.Entity<SessionProgressionTransitionReceipt>()
            .HasIndex(receipt => receipt.ModuleTurnId)
            .IsUnique();
        builder.Entity<SessionProgressionTransitionReceipt>()
            .HasOne(receipt => receipt.ModuleTurn)
            .WithOne()
            .HasForeignKey<SessionProgressionTransitionReceipt>(receipt => receipt.ModuleTurnId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<SessionProgressionTransitionReceipt>()
            .HasIndex(receipt => receipt.SourceSignalId)
            .IsUnique();
        builder.Entity<SessionProgressionTransitionReceipt>()
            .HasOne(receipt => receipt.Session)
            .WithMany(session => session.ProgressionTransitionReceipts)
            .HasForeignKey(receipt => receipt.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionProgressionTransitionReceipt>()
            .HasOne(receipt => receipt.SourceSignal)
            .WithOne(signal => signal.TransitionReceipt)
            .HasForeignKey<SessionProgressionTransitionReceipt>(receipt => receipt.SourceSignalId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionProgressionTransitionReceipt>()
            .HasOne(receipt => receipt.Transition)
            .WithMany()
            .HasForeignKey(receipt => receipt.TransitionId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<SessionTurn>()
            .HasIndex(turn => new { turn.SessionId, turn.Position })
            .IsUnique();
        builder.Entity<SessionPlayerInput>()
            .HasIndex(input => new { input.SessionId, input.RequestId })
            .IsUnique();
        builder.Entity<SessionPlayerInput>()
            .HasOne(input => input.Session)
            .WithMany(session => session.PlayerInputs)
            .HasForeignKey(input => input.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionPlayerInput>()
            .HasOne(input => input.AcceptedAfterTurn)
            .WithMany()
            .HasForeignKey(input => input.AcceptedAfterTurnId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<SessionTurn>()
            .HasIndex(turn => new { turn.SessionId, turn.PreviousTurnId })
            .IsUnique()
            .HasFilter("\"PreviousTurnId\" IS NOT NULL");
        builder.Entity<SessionTurn>()
            .HasIndex(turn => turn.SessionId)
            .IsUnique()
            .HasFilter("\"PreviousTurnId\" IS NULL");
        builder.Entity<SessionTurn>()
            .HasOne(turn => turn.PreviousTurn)
            .WithOne(turn => turn.NextTurn)
            .HasForeignKey<SessionTurn>(turn => turn.PreviousTurnId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<SessionTurn>()
            .HasIndex(turn => turn.PlayerInputId)
            .IsUnique();
        builder.Entity<SessionTurn>()
            .HasOne(turn => turn.PlayerInput)
            .WithOne(input => input.NarrativeTurn)
            .HasForeignKey<SessionTurn>(turn => turn.PlayerInputId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<SessionTurn>()
            .HasIndex(turn => turn.SourceModuleTurnId)
            .IsUnique();
        builder.Entity<SessionTurn>()
            .HasOne(turn => turn.SourceModuleTurn)
            .WithOne(turn => turn.NarrativeTurn)
            .HasForeignKey<SessionTurn>(turn => turn.SourceModuleTurnId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<SessionTurn>()
            .HasOne(turn => turn.Session)
            .WithMany(session => session.Turns)
            .HasForeignKey(turn => turn.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionExecution>()
            .Property(execution => execution.Kind)
            .HasConversion(value => value.ToWireValue(), value => SessionExecutionEnumValues.ParseKind(value));
        builder.Entity<SessionExecution>()
            .Property(execution => execution.Status)
            .HasConversion(value => value.ToWireValue(), value => SessionExecutionEnumValues.ParseStatus(value));
        builder.Entity<SessionExecution>()
            .Property(execution => execution.TriggerType)
            .HasConversion(value => value.ToWireValue(), value => SessionExecutionEnumValues.ParseTriggerType(value));
        builder.Entity<SessionExecution>()
            .Property(execution => execution.PublishPolicy)
            .HasConversion(value => value.ToWireValue(), value => SessionExecutionEnumValues.ParsePublishPolicy(value));
        builder.Entity<SessionExecution>()
            .Property(execution => execution.Revision)
            .IsConcurrencyToken();
        builder.Entity<SessionExecution>()
            .HasIndex(execution => new { execution.SessionId, execution.IdempotencyKey })
            .IsUnique();
        builder.Entity<SessionExecution>()
            .HasIndex(execution => new { execution.Status, execution.NextAttemptAt, execution.Priority, execution.QueuedAt });
        builder.Entity<SessionExecution>()
            .HasOne(execution => execution.Session)
            .WithMany(session => session.Executions)
            .HasForeignKey(execution => execution.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionExecutionAttempt>()
            .HasIndex(attempt => new { attempt.ExecutionId, attempt.AttemptNumber })
            .IsUnique();
        builder.Entity<SessionExecutionAttempt>()
            .HasOne(attempt => attempt.Execution)
            .WithMany(execution => execution.Attempts)
            .HasForeignKey(attempt => attempt.ExecutionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionAiInteraction>()
            .HasIndex(interaction => new { interaction.AttemptId, interaction.Stage })
            .IsUnique();
        builder.Entity<SessionAiInteraction>()
            .HasIndex(interaction => new { interaction.SessionId, interaction.StartedAt, interaction.Sequence });
        builder.Entity<SessionAiInteraction>()
            .HasOne(interaction => interaction.Session)
            .WithMany(session => session.AiInteractions)
            .HasForeignKey(interaction => interaction.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionAiInteraction>()
            .HasOne(interaction => interaction.Execution)
            .WithMany(execution => execution.AiInteractions)
            .HasForeignKey(interaction => interaction.ExecutionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionAiInteraction>()
            .HasOne(interaction => interaction.Attempt)
            .WithMany(attempt => attempt.AiInteractions)
            .HasForeignKey(interaction => interaction.AttemptId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionArtifact>().Property(artifact => artifact.Kind)
            .HasConversion(value => value.ToWireValue(), value => SessionArtifactEnumValues.ParseKind(value));
        builder.Entity<SessionArtifact>().Property(artifact => artifact.Status)
            .HasConversion(value => value.ToWireValue(), value => SessionArtifactEnumValues.ParseStatus(value));
        builder.Entity<SessionArtifact>().Property(artifact => artifact.Schema)
            .HasConversion(value => value.ToWireValue(), value => SessionArtifactEnumValues.ParseSchema(value));
        builder.Entity<SessionArtifact>()
            .HasIndex(artifact => new { artifact.ExecutionId, artifact.Kind })
            .IsUnique();
        builder.Entity<SessionArtifact>().ToTable(table =>
        {
            table.HasCheckConstraint("CK_SessionArtifacts_Backing", "(\"PayloadJson\" IS NOT NULL AND \"StorageKey\" IS NULL) OR (\"PayloadJson\" IS NULL AND \"StorageKey\" IS NOT NULL)");
            table.HasCheckConstraint("CK_SessionArtifacts_Committed", "\"Status\" <> 'committed' OR (\"ValidatedAt\" IS NOT NULL AND \"CommittedAt\" IS NOT NULL)");
            table.HasCheckConstraint("CK_SessionArtifacts_KindSchema", "(\"Kind\" = 'rule-action-step' AND \"Schema\" = 'rule-action-step.v1') OR (\"Kind\" = 'post-state-narrative' AND \"Schema\" = 'post-state-narrative.v1') OR (\"Kind\" = 'narrative-text' AND \"Schema\" = 'narrative-text.v1') OR (\"Kind\" = 'note-patch' AND \"Schema\" = 'note-patch.v1') OR (\"Kind\" = 'image' AND \"Schema\" = 'image.v1')");
        });
        builder.Entity<SessionArtifact>()
            .HasOne(artifact => artifact.Execution)
            .WithMany(execution => execution.Artifacts)
            .HasForeignKey(artifact => artifact.ExecutionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionArtifact>()
            .HasOne(artifact => artifact.Attempt)
            .WithMany()
            .HasForeignKey(artifact => artifact.AttemptId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<SessionNote>().Property(note => note.Kind)
            .HasConversion(value => value.ToWireValue(), value => SessionMemoryEnumValues.ParseNoteKind(value));
        builder.Entity<SessionNote>().Property(note => note.CanonStatus)
            .HasConversion(value => value.ToWireValue(), value => SessionMemoryEnumValues.ParseCanonStatus(value));
        builder.Entity<SessionNote>().Property(note => note.UpdateSource)
            .HasConversion(value => value.ToWireValue(), value => SessionMemoryEnumValues.ParseUpdateSource(value));
        builder.Entity<SessionNote>()
            .Property(note => note.Revision)
            .IsConcurrencyToken();
        builder.Entity<SessionNote>()
            .HasOne(note => note.Session)
            .WithMany(session => session.Notes)
            .HasForeignKey(note => note.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionNoteRevision>()
            .HasIndex(revision => new { revision.NoteId, revision.Revision })
            .IsUnique();
        builder.Entity<SessionNoteRevision>()
            .HasOne(revision => revision.Note)
            .WithMany(note => note.Revisions)
            .HasForeignKey(revision => revision.NoteId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionNoteProposal>().Property(proposal => proposal.Status)
            .HasConversion(value => value.ToWireValue(), value => SessionMemoryEnumValues.ParseProposalStatus(value));
        builder.Entity<SessionNoteProposal>().Property(proposal => proposal.Revision).IsConcurrencyToken();
        builder.Entity<SessionNoteProposal>()
            .HasOne(proposal => proposal.Artifact)
            .WithOne()
            .HasForeignKey<SessionNoteProposal>(proposal => proposal.ArtifactId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionSummary>()
            .HasIndex(summary => new { summary.SessionId, summary.Version })
            .IsUnique();
        builder.Entity<SessionSummary>()
            .HasOne(summary => summary.Session)
            .WithMany(session => session.Summaries)
            .HasForeignKey(summary => summary.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionTurnLorebookReference>()
            .HasKey(reference => new { reference.TurnId, reference.NoteId });
        builder.Entity<SessionTurnLorebookReference>()
            .HasOne(reference => reference.Turn)
            .WithMany(turn => turn.LorebookReferences)
            .HasForeignKey(reference => reference.TurnId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionTurnLorebookReference>()
            .HasOne(reference => reference.Note)
            .WithMany(note => note.TurnReferences)
            .HasForeignKey(reference => reference.NoteId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionImage>()
            .HasIndex(image => image.ArtifactId)
            .IsUnique();
        builder.Entity<SessionImage>()
            .HasOne(image => image.Artifact)
            .WithOne()
            .HasForeignKey<SessionImage>(image => image.ArtifactId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ModuleExecution>()
            .HasIndex(execution => execution.SessionTurnId)
            .IsUnique();
        builder.Entity<ModuleExecution>()
            .HasOne(execution => execution.SessionTurn)
            .WithOne(turn => turn.ModuleExecution)
            .HasForeignKey<ModuleExecution>(execution => execution.SessionTurnId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ModuleExecution>()
            .Property(execution => execution.Status)
            .HasConversion(value => value.ToWireValue(), value => ModuleExecutionStatusValues.Parse(value));
        builder.Entity<ModuleExecutionRequest>()
            .Property(request => request.Operation)
            .HasConversion<string>();
        builder.Entity<ModuleExecutionRequest>()
            .Property(request => request.Status)
            .HasConversion<string>();
        builder.Entity<ModuleExecution>()
            .Property(execution => execution.Revision)
            .IsConcurrencyToken();
        builder.Entity<ModuleExecution>()
            .HasIndex(execution => new { execution.OwnerId, execution.UpdatedAt });
        builder.Entity<ModuleOutcomeApplication>()
            .HasIndex(application => application.ExecutionId)
            .IsUnique();
        builder.Entity<ModuleOutcomeApplication>()
            .HasIndex(application => application.ModuleExecutionRequestId)
            .IsUnique();
        builder.Entity<ModuleOutcomeApplication>()
            .HasOne(application => application.Execution)
            .WithOne(execution => execution.OutcomeApplication)
            .HasForeignKey<ModuleOutcomeApplication>(application => application.ExecutionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ModuleOutcomeApplication>()
            .HasOne(application => application.Session)
            .WithMany(session => session.OutcomeApplications)
            .HasForeignKey(application => application.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ModuleOutcomeApplication>()
            .HasOne(application => application.Request)
            .WithOne(request => request.OutcomeApplication)
            .HasForeignKey<ModuleOutcomeApplication>(application => application.ModuleExecutionRequestId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ModuleExecutionRequest>()
            .HasIndex(request => new { request.OwnerId, request.RequestId })
            .IsUnique();
        builder.Entity<ModuleExecutionRequest>()
            .HasIndex(request => request.ExecutionId);
        builder.Entity<ModuleExecutionRequest>()
            .HasOne(request => request.Execution)
            .WithMany(execution => execution.Requests)
            .HasForeignKey(request => request.ExecutionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
