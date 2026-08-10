using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Features.Evaluations.Infrastructure.Persistence;

internal sealed class EvaluationSessionConfiguration : IEntityTypeConfiguration<EvaluationSession>
{
    public void Configure(EntityTypeBuilder<EvaluationSession> b)
    {
        b.Property(x => x.Status).HasConversion<string>(); b.Property(x => x.Revision).IsConcurrencyToken();
        b.HasIndex(x => new { x.OwnerId, x.CreatedAt }); b.HasIndex(x => new { x.OwnerId, x.IdempotencyKey }).IsUnique().HasFilter("\"IdempotencyKey\" IS NOT NULL");
    }
}
internal sealed class EvaluationSituationConfiguration : IEntityTypeConfiguration<EvaluationSituation>
{
    public void Configure(EntityTypeBuilder<EvaluationSituation> b)
    {
        b.Property(x => x.Stage).HasConversion<string>(); b.Property(x => x.SourceKind).HasConversion<string>();
        b.HasIndex(x => new { x.SessionId, x.StableKey, x.Revision }).IsUnique(); b.HasIndex(x => new { x.SessionId, x.RequestHash });
        b.HasOne(x => x.Session).WithMany(x => x.Situations).HasForeignKey(x => x.SessionId).OnDelete(DeleteBehavior.Cascade);
    }
}
internal sealed class EvaluationCandidateConfiguration : IEntityTypeConfiguration<EvaluationCandidate>
{
    public void Configure(EntityTypeBuilder<EvaluationCandidate> b)
    {
        b.HasIndex(x => new { x.SessionId, x.CandidateKey }).IsUnique(); b.HasIndex(x => new { x.SessionId, x.BlindCode }).IsUnique();
        b.HasOne(x => x.Session).WithMany(x => x.Candidates).HasForeignKey(x => x.SessionId).OnDelete(DeleteBehavior.Cascade);
    }
}
internal sealed class EvaluationAttemptConfiguration : IEntityTypeConfiguration<EvaluationAttempt>
{
    public void Configure(EntityTypeBuilder<EvaluationAttempt> b)
    {
        b.Property(x => x.Status).HasConversion<string>(); b.Property(x => x.Revision).IsConcurrencyToken();
        b.HasIndex(x => new { x.SituationId, x.CandidateId, x.Repetition }).IsUnique();
        b.HasIndex(x => new { x.Status, x.NextAttemptAt, x.CreatedAt });
        b.HasOne(x => x.Session).WithMany(x => x.Attempts).HasForeignKey(x => x.SessionId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Situation).WithMany().HasForeignKey(x => x.SituationId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Candidate).WithMany().HasForeignKey(x => x.CandidateId).OnDelete(DeleteBehavior.Restrict);
    }
}
internal sealed class EvaluationModelInvocationConfiguration : IEntityTypeConfiguration<EvaluationModelInvocation>
{
    public void Configure(EntityTypeBuilder<EvaluationModelInvocation> b)
    {
        b.Property(x => x.Status).HasConversion<string>(); b.HasIndex(x => new { x.AttemptId, x.InvocationNumber }).IsUnique();
        b.HasOne(x => x.Attempt).WithMany(x => x.Invocations).HasForeignKey(x => x.AttemptId).OnDelete(DeleteBehavior.Cascade);
    }
}
internal sealed class EvaluationMachineJudgmentConfiguration : IEntityTypeConfiguration<EvaluationMachineJudgment>
{
    public void Configure(EntityTypeBuilder<EvaluationMachineJudgment> b)
    {
        b.HasIndex(x => new { x.InvocationId, x.JudgeKey, x.JudgeVersion, x.CriterionKey }).IsUnique();
        b.HasOne(x => x.Invocation).WithMany(x => x.MachineJudgments).HasForeignKey(x => x.InvocationId).OnDelete(DeleteBehavior.Cascade);
    }
}
internal sealed class EvaluationReviewBatchConfiguration : IEntityTypeConfiguration<EvaluationReviewBatch>
{
    public void Configure(EntityTypeBuilder<EvaluationReviewBatch> b) { b.Property(x => x.Status).HasConversion<string>(); b.HasIndex(x => new { x.SessionId, x.CreatedAt }); }
}
internal sealed class EvaluationReviewAssignmentConfiguration : IEntityTypeConfiguration<EvaluationReviewAssignment>
{
    public void Configure(EntityTypeBuilder<EvaluationReviewAssignment> b)
    {
        b.Property(x => x.Status).HasConversion<string>(); b.Property(x => x.Revision).IsConcurrencyToken(); b.HasIndex(x => x.OpaqueCode).IsUnique();
        b.HasOne(x => x.Batch).WithMany(x => x.Assignments).HasForeignKey(x => x.BatchId).OnDelete(DeleteBehavior.Cascade);
    }
}
internal sealed class EvaluationReviewItemConfiguration : IEntityTypeConfiguration<EvaluationReviewItem>
{
    public void Configure(EntityTypeBuilder<EvaluationReviewItem> b)
    {
        b.HasIndex(x => new { x.AssignmentId, x.AttemptId }).IsUnique(); b.HasOne(x => x.Assignment).WithMany(x => x.Items).HasForeignKey(x => x.AssignmentId).OnDelete(DeleteBehavior.Cascade);
    }
}
internal sealed class EvaluationHumanJudgmentConfiguration : IEntityTypeConfiguration<EvaluationHumanJudgment>
{
    public void Configure(EntityTypeBuilder<EvaluationHumanJudgment> b) => b.HasIndex(x => new { x.ItemId, x.ReviewerId, x.CriterionKey, x.Revision }).IsUnique();
}
internal sealed class EvaluationAggregateConfiguration : IEntityTypeConfiguration<EvaluationAggregate>
{
    public void Configure(EntityTypeBuilder<EvaluationAggregate> b) => b.HasIndex(x => new { x.SessionId, x.Revision }).IsUnique();
}
