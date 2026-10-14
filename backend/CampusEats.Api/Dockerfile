FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/CampusEats.Api/CampusEats.Api.csproj backend/CampusEats.Api/
RUN dotnet restore backend/CampusEats.Api/CampusEats.Api.csproj
COPY backend/CampusEats.Api/ backend/CampusEats.Api/
RUN dotnet publish backend/CampusEats.Api/CampusEats.Api.csproj -c Release --no-restore -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
USER app
ENTRYPOINT ["dotnet", "CampusEats.Api.dll"]
