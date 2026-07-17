FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/Myriale.Api/Myriale.Api.csproj src/Myriale.Api/
COPY src/Myriale.ServiceDefaults/Myriale.ServiceDefaults.csproj src/Myriale.ServiceDefaults/
RUN dotnet restore src/Myriale.Api/Myriale.Api.csproj
COPY src/Myriale.Api src/Myriale.Api
COPY src/Myriale.ServiceDefaults src/Myriale.ServiceDefaults
RUN dotnet publish src/Myriale.Api/Myriale.Api.csproj --configuration Release --output /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Myriale.Api.dll"]
