using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Scenario> Scenarios => Set<Scenario>();
    public DbSet<AiProviderKey> AiProviderKeys => Set<AiProviderKey>();
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
    public DbSet<SessionNarrativeHandoff> SessionNarrativeHandoffs => Set<SessionNarrativeHandoff>();
    public DbSet<SessionPlayerInput> SessionPlayerInputs => Set<SessionPlayerInput>();
    public DbSet<SessionPlayerInputWork> SessionPlayerInputWorks => Set<SessionPlayerInputWork>();
    public DbSet<ModuleExecution> ModuleExecutions => Set<ModuleExecution>();
    public DbSet<ModuleExecutionRequest> ModuleExecutionRequests => Set<ModuleExecutionRequest>();
    public DbSet<ModuleOutcomeApplication> ModuleOutcomeApplications => Set<ModuleOutcomeApplication>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<ModulePackage>()
            .HasIndex(package => new { package.ModuleId, package.Version })
            .IsUnique();
        builder.Entity<ScenarioProgressionNode>()
            .HasIndex(node => new { node.ScenarioId, node.Code })
            .IsUnique();
        builder.Entity<ScenarioProgressionNode>()
            .HasOne(node => node.Scenario)
            .WithMany()
            .HasForeignKey(node => node.ScenarioId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ScenarioProgressionTransition>()
            .HasIndex(transition => new { transition.SourceNodeId, transition.SignalCode })
            .IsUnique();
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
            .Property(session => session.Revision)
            .IsConcurrencyToken();
        builder.Entity<Session>()
            .HasOne(session => session.HeadTurn)
            .WithMany()
            .HasForeignKey(session => session.HeadTurnId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<Session>()
            .HasIndex(session => new { session.OwnerId, session.UpdatedAt });
        builder.Entity<Session>()
            .HasOne(session => session.Scenario)
            .WithMany()
            .HasForeignKey(session => session.ScenarioId)
            .OnDelete(DeleteBehavior.Restrict);
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
        builder.Entity<SessionNarrativeHandoff>()
            .Property(handoff => handoff.Revision)
            .IsConcurrencyToken();
        builder.Entity<SessionNarrativeHandoff>()
            .HasIndex(handoff => handoff.ExecutionId)
            .IsUnique();
        builder.Entity<SessionNarrativeHandoff>()
            .HasOne(handoff => handoff.SourceModuleTurn)
            .WithOne(turn => turn.NarrativeHandoff)
            .HasForeignKey<SessionNarrativeHandoff>(handoff => handoff.SourceModuleTurnId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SessionPlayerInputWork>()
            .Property(work => work.Revision)
            .IsConcurrencyToken();
        builder.Entity<SessionPlayerInputWork>()
            .HasOne(work => work.PlayerInput)
            .WithOne(input => input.Work)
            .HasForeignKey<SessionPlayerInputWork>(work => work.PlayerInputId)
            .OnDelete(DeleteBehavior.Cascade);
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
        builder.Entity<ModuleExecution>()
            .HasIndex(execution => execution.SessionTurnId)
            .IsUnique();
        builder.Entity<ModuleExecution>()
            .HasOne(execution => execution.SessionTurn)
            .WithOne(turn => turn.ModuleExecution)
            .HasForeignKey<ModuleExecution>(execution => execution.SessionTurnId)
            .OnDelete(DeleteBehavior.Cascade);
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
