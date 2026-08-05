
namespace Myriale.Api.Features.Dashboard.Application.Services;

public interface IHomeDashboardService
{
    Task<HomeDashboardResponse> GetDashboardAsync(string ownerId, CancellationToken cancellationToken);
}
