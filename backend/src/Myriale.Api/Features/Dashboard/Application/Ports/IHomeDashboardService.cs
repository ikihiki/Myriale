
namespace Myriale.Api.Features.Dashboard.Application.Ports;

public interface IHomeDashboardService
{
    Task<HomeDashboardResponse> GetDashboardAsync(string ownerId, CancellationToken cancellationToken);
}
