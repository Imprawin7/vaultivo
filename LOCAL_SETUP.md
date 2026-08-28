# Running Vaultivo locally (VS Code)

## Prerequisites
- Java 17+, Maven (or use VS Code's Java Extension Pack, which bundles Maven support)
- Node.js 18+
- Docker Desktop (for Postgres + MinIO)
- VS Code extensions: **Extension Pack for Java**, **Spring Boot Extension Pack**

## 1. Start Postgres + MinIO
From the project root:
```bash
docker compose up -d
```
This starts Postgres on `5432` and MinIO (S3-compatible storage) on `9000` (API) / `9001` (web console —
visit http://localhost:9001, login `minioadmin` / `minioadmin`), and auto-creates the `vaultivo-dev` bucket
with CORS configured for the frontend's dev origin.

> The exact `mc cors set` syntax has shifted across MinIO client versions. If uploads fail with a CORS
> error in the browser console, run `docker compose logs minio-init` to check whether that step actually
> succeeded, and adjust `cors.json` / the `minio-init` command in `docker-compose.yml` if needed.

## 2. Run the backend
Open the `backend/` folder in VS Code. A run configuration is already set up in `.vscode/launch.json`
with all required env vars pointed at the local Postgres + MinIO from step 1 — just open
`VaultivoApplication.java` and hit **Run** (or F5), or use the Spring Boot Dashboard extension.

First boot runs the Flyway migration (`V1__init_schema.sql`) automatically — no manual DB setup needed.

Google OAuth2 login is **optional** for local testing; email/password registration works without any
Google setup. To also test "Sign in with Google" locally, add real `GOOGLE_CLIENT_ID` /
`GOOGLE_CLIENT_SECRET` values to `launch.json` (see the commented-out lines) — you'll need a Google Cloud
OAuth client with `http://localhost:8080/login/oauth2/code/google` as an authorized redirect URI.

Verify it's up: http://localhost:8080/api/health should return `{"status":"UP"}`.

## 3. Run the frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. The Vite dev server proxies `/api` and `/oauth2/**` to the backend on `:8080`.

## 4. Test it
- Register an account, log in
- Create a folder, upload a file (drag-and-drop or the sidebar button) — this exercises the full
  presigned-upload flow against MinIO
- Star a file, trash something, restore it, share a file with a second account (register a second user
  to test sharing/permissions properly), create a public link and open it in an incognito window

## Resetting local data
```bash
docker compose down -v   # wipes Postgres + MinIO data volumes
docker compose up -d
```
