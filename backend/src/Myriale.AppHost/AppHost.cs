var builder = DistributedApplication.CreateBuilder(args);

var api = builder.AddProject<Projects.Myriale_Api>("myriale-api")
    .WithExternalHttpEndpoints();

builder.AddNpmApp("myriale-frontend", "../../../", "dev")
    .WithReference(api)
    .WaitFor(api)
    .WithEnvironment("VITE_MYRIAL_API_MODE", "proxy")
    .WithHttpEndpoint(port: 5173, name: "vite", isProxied: false)
    .WithExternalHttpEndpoints();

builder.AddNpmApp("myriale-storybook", "../../../", "storybook")
    .WithReference(api)
    .WaitFor(api)
    .WithEnvironment("VITE_MYRIAL_API_MODE", "proxy")
    .WithHttpEndpoint(port: 6006, name: "storybook", isProxied: false)
    .WithExternalHttpEndpoints();

builder.Build().Run();
