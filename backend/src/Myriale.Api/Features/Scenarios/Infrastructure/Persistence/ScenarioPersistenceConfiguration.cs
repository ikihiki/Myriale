using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Myriale.Api.Features.Scenarios.Infrastructure.Persistence;

internal sealed class ScenarioConfiguration : IEntityTypeConfiguration<Scenario>
{
    public void Configure(EntityTypeBuilder<Scenario> builder)
    {
        builder.Property(scenario => scenario.Revision).IsConcurrencyToken();
        builder.Property(scenario => scenario.Title).HasConversion(value => value.Value, value => new ScenarioTitle(value));
        builder.Property(scenario => scenario.HeroMode).HasConversion<string>();
        builder.Property(scenario => scenario.Status).HasConversion<string>();
        builder.Property(scenario => scenario.IllustrationStyle).HasConversion(value => value.Value, value => new IllustrationPrompt(value));
        builder.Property(scenario => scenario.IllustrationMood).HasConversion(value => value.Value, value => new IllustrationPrompt(value));
        builder.Property(scenario => scenario.IllustrationNegative).HasConversion(value => value.Value, value => new IllustrationPrompt(value));
    }
}

internal sealed class ScenarioDefinitionVersionConfiguration : IEntityTypeConfiguration<ScenarioDefinitionVersion>
{
    public void Configure(EntityTypeBuilder<ScenarioDefinitionVersion> builder)
    {
        builder.Property(version => version.Revision).IsConcurrencyToken();
        builder.Ignore(version => version.DomainEvents);
        builder.Property(version => version.Status).HasConversion<string>();
        builder.Property(version => version.ScenarioTitle).HasConversion(value => value.Value, value => new ScenarioTitle(value));
        builder.Property(version => version.ScenarioHeroMode).HasConversion<string>();
        builder.Property(version => version.ScenarioIllustrationStyle).HasConversion(value => value.Value, value => new IllustrationPrompt(value));
        builder.Property(version => version.ScenarioIllustrationMood).HasConversion(value => value.Value, value => new IllustrationPrompt(value));
        builder.Property(version => version.ScenarioIllustrationNegative).HasConversion(value => value.Value, value => new IllustrationPrompt(value));
        builder.HasIndex(version => new { version.ScenarioId, version.Version }).IsUnique();
        builder.HasIndex(version => version.ScenarioId).IsUnique().HasFilter("\"Status\" = 'Draft'");
        builder.HasOne(version => version.Scenario).WithMany().HasForeignKey(version => version.ScenarioId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ScenarioLocationConfiguration : IEntityTypeConfiguration<ScenarioLocation>
{
    public void Configure(EntityTypeBuilder<ScenarioLocation> builder)
    {
        builder.HasIndex(location => new { location.DefinitionVersionId, location.Code }).IsUnique();
        builder.HasOne(location => location.DefinitionVersion).WithMany(version => version.Locations)
            .HasForeignKey(location => location.DefinitionVersionId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ScenarioObjectTypeConfiguration : IEntityTypeConfiguration<ScenarioObjectType>
{
    public void Configure(EntityTypeBuilder<ScenarioObjectType> builder)
    {
        builder.HasIndex(type => new { type.DefinitionVersionId, type.Code }).IsUnique();
        builder.HasOne(type => type.DefinitionVersion).WithMany(version => version.ObjectTypes)
            .HasForeignKey(type => type.DefinitionVersionId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ScenarioObjectTypeActionConfiguration : IEntityTypeConfiguration<ScenarioObjectTypeAction>
{
    public void Configure(EntityTypeBuilder<ScenarioObjectTypeAction> builder)
    {
        builder.Property(action => action.Visibility).HasConversion<string>();
        builder.Property(action => action.ExecutionMode).HasConversion<string>();
        builder.HasIndex(action => new { action.ObjectTypeId, action.Code }).IsUnique();
        builder.HasOne(action => action.ObjectType).WithMany(type => type.Actions)
            .HasForeignKey(action => action.ObjectTypeId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ScenarioObjectConfiguration : IEntityTypeConfiguration<ScenarioObject>
{
    public void Configure(EntityTypeBuilder<ScenarioObject> builder)
    {
        builder.HasIndex(item => new { item.DefinitionVersionId, item.Code }).IsUnique();
        builder.HasOne(item => item.DefinitionVersion).WithMany(version => version.Objects)
            .HasForeignKey(item => item.DefinitionVersionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(item => item.Location).WithMany().HasForeignKey(item => item.LocationId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class ScenarioProgressionNodeConfiguration : IEntityTypeConfiguration<ScenarioProgressionNode>
{
    public void Configure(EntityTypeBuilder<ScenarioProgressionNode> builder)
    {
        builder.HasIndex(node => new { node.DefinitionVersionId, node.Code }).IsUnique();
        builder.HasOne(node => node.DefinitionVersion).WithMany(version => version.ProgressionNodes)
            .HasForeignKey(node => node.DefinitionVersionId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ScenarioProgressionTransitionConfiguration : IEntityTypeConfiguration<ScenarioProgressionTransition>
{
    public void Configure(EntityTypeBuilder<ScenarioProgressionTransition> builder)
    {
        builder.HasIndex(transition => new { transition.DefinitionVersionId, transition.SourceNodeId, transition.SignalCode }).IsUnique();
        builder.HasOne(transition => transition.DefinitionVersion).WithMany(version => version.ProgressionTransitions)
            .HasForeignKey(transition => transition.DefinitionVersionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(transition => transition.SourceNode).WithMany()
            .HasForeignKey(transition => transition.SourceNodeId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(transition => transition.TargetNode).WithMany()
            .HasForeignKey(transition => transition.TargetNodeId).OnDelete(DeleteBehavior.Restrict);
    }
}
