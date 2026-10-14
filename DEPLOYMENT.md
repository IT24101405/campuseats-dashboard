# CampusEats Lab 11 deployment

The frontend stays on Vercel. The .NET 8 API runs on Render and stores data in an isolated Neon PostgreSQL lab database. No cloud resources are created by this change. Review the code before committing or pushing.

## 1. Create an isolated Neon database

Create a new project such as `campuseats-lab11` in the Neon console, selecting a free plan if available. Do not attach an existing production database or enable paid services. Use its database (normally `neondb`) and role. Open **Connect** and obtain the host, database, username and password. Use Npgsql's semicolon-separated format, not a `postgresql://` URL:

```text
Host=YOUR_NEON_HOST;Port=5432;Database=neondb;Username=YOUR_ROLE;Password=YOUR_PASSWORD;SSL Mode=VerifyFull
```

Store the real value only in Render's secret environment settings or a private local process environment. Never put it in Vercel, frontend code, screenshots, or Git. See [Neon's .NET guide](https://neon.com/docs/guides/dotnet-npgsql).

## 2. Apply migrations

Run commands from the repository root with .NET 8 SDK installed:

```powershell
dotnet tool restore
dotnet restore backend/CampusEats.Api
dotnet build backend/CampusEats.Api -c Release
dotnet ef migrations has-pending-model-changes --project backend/CampusEats.Api
dotnet ef migrations script --idempotent --project backend/CampusEats.Api --output backend/CampusEats.Api/obj/migrations.sql
```

Review the generated SQL before applying it. Set `ConnectionStrings__Default` in your terminal's process environment to the private lab database connection string, without overwriting an existing value or exposing it in command history. Then:

```powershell
dotnet ef database update --project backend/CampusEats.Api
dotnet run --project backend/CampusEats.Api --no-launch-profile
```

The initial migration creates `MenuItems` and `Orders`, and inserts the five original menu items. EF's migration history prevents repeat insertion when the migration command runs again. Do not use `EnsureCreated` or delete migration history. Subsequent menu JSON edits are not automatically synchronized to the database.

Alternatively, for a single-instance lab deployment, explicitly set `RUN_MIGRATIONS_ON_STARTUP=true` on Render for the first deploy. This applies pending migrations before serving requests. After success, set it to `false` and redeploy. It defaults to false. Never enable it across concurrent replicas; apply reviewed migrations once before deployment instead. See [EF migration guidance](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/applying).

## 3. Deploy the API on Render

After reviewing and pushing your changes yourself, create a **Web Service** from this GitHub repository. Select the branch containing the backend and **Docker** as the runtime. Configure:

| Setting | Value |
| --- | --- |
| Root directory | Leave blank (repository root) |
| Dockerfile path | `backend/CampusEats.Api/Dockerfile` |
| Docker build context | `.` (repository root) |
| Health check path | `/health` |
| Instance | Free if offered; do not select paid service without approval |

Environment variables:

| Variable | Value |
| --- | --- |
| `ConnectionStrings__Default` | Private Npgsql connection string above |
| `RUN_MIGRATIONS_ON_STARTUP` | `true` only if using the explicit first-deploy lab option; otherwise `false` |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ASPNETCORE_URLS` | `http://0.0.0.0:8080` |
| `PORT` | `8080` |

Leave the Docker command override empty. The image launches `CampusEats.Api.dll` as a non-root user. The build context is the repository root, so do not set the Render root directory to the backend folder. See [Render Docker settings](https://render.com/docs/docker).

Optional local Docker check, when Docker is installed:

```powershell
docker build -f backend/CampusEats.Api/Dockerfile -t campuseats-api .
docker run --rm -p 8080:8080 -e ConnectionStrings__Default campuseats-api
```

The second command passes the already-configured process environment variable. Apply migrations first, or explicitly pass `-e RUN_MIGRATIONS_ON_STARTUP=true` for the isolated lab database.

## 4. Test the deployed API

Replace the example base URL with the actual Render URL. Use synthetic customer data only:

```powershell
$api = 'https://YOUR-SERVICE.onrender.com'
Invoke-WebRequest "$api/health" -UseBasicParsing
Invoke-RestMethod "$api/api/menu"
Invoke-WebRequest "$api/api/orders" -Method Post -ContentType 'application/json' -Body '{"name":"Lab Tester","email":"lab@example.com","qty":2}' -UseBasicParsing
Invoke-WebRequest "$api/api/orders" -Method Post -ContentType 'application/json' -Body '{"name":"","email":"invalid","qty":0}' -UseBasicParsing
```

Expect 200, the five menu items, 201 with an order ID, then 400 (PowerShell throws for the expected 400). Also test fractional quantity, missing fields and malformed JSON: each should return 400. There is no public order-list or customer-detail endpoint. `/health` is a liveness check only; successful `/api/menu` confirms database connectivity.

In Neon SQL Editor, verify persistence without exposing customer data:

```sql
SELECT COUNT(*) FROM "MenuItems"; -- 5
SELECT "Id", "Qty", "CreatedAt" FROM "Orders" ORDER BY "Id" DESC LIMIT 5;
SELECT * FROM "__EFMigrationsHistory";
```

Run database update again and verify the menu count remains five. Restart/redeploy the API and verify the test order remains stored.

Repeatable smoke checks (Node 18+; API must already be running):

```powershell
node backend/tests/smoke.mjs
# Only after configuring an isolated migrated lab database:
$env:TEST_DATABASE = 'true'
node backend/tests/smoke.mjs
```

Set `TEST_API_URL` to the Render origin to test a deployed API. Database mode creates one synthetic order per run. Without database mode, the checks cover health, invalid submissions, CORS, and the absence of public order-reading endpoints.

## 5. Connect Vercel

After successful API tests, intentionally replace the existing `VITE_API_URL=https://api.example.invalid` in the Vercel project's **Production** environment with the actual Render origin, for example `https://YOUR-SERVICE.onrender.com`. Do not include `/api` at the end. Redeploy Vercel; Vite embeds this value at build time, so changing the setting alone does not update the existing deployment.

Until configured, the menu uses `/menu.json` and the order page clearly shows demo mode with saving disabled. With a real URL, API failures are displayed rather than silently using static data. Only a 201 response produces order success.

For local development, add `VITE_API_URL=http://localhost:8080` to a private `.env.local` only if that value is not already configured; restart Vite with `npm.cmd run dev`. Existing environment files were not changed. The API permits exactly `http://localhost:5173` and `https://campuseats-dashboard-ten.vercel.app` via CORS. Other Vercel preview/custom origins need an explicit CORS code change.

Verify menu search, navigation, `/`, `/dish/1`, `/order`, unknown-route behavior, and direct refresh of each route. Existing CSS, routing and `vercel.json` are retained. In browser Network tools, confirm `/api/menu` returns 200 and order POST returns 201, then inspect Neon for the stored synthetic order.

## 6. Status, logs and Lab 11 evidence

Review Render Events/build logs for publish success and Runtime logs for port 8080 and migration errors. Review Vercel deployment status/build logs and browser Network/Console for failed requests. A 500 on menu/orders usually requires checking the database connection, SSL settings and migrations. Avoid sharing raw connection strings or customer data from logs.

Capture:

- GitHub repository showing backend, migration, Dockerfile and deployment guide after your reviewed push.
- Successful .NET Release build and Vite build outputs.
- Neon isolated project and schema; menu count and synthetic order ID/quantity/time.
- Render Docker configuration, successful deployment and public service URL.
- Environment variable **names only**, with all secrets hidden.
- `/health` 200, `/api/menu` 200, valid order 201 and invalid order 400.
- Vercel deployment success, menu/search, order confirmation, and browser API requests.
- Direct refresh of `/order` to demonstrate the retained Vercel routing fix.

Database persistence, live connectivity and Docker execution require their respective services/tools; successful compilation alone does not prove these checks.
