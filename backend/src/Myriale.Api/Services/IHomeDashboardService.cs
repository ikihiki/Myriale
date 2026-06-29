using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public interface IHomeDashboardService
{
    Task<HomeDashboardResponse> GetDashboardAsync(CancellationToken cancellationToken);
}
