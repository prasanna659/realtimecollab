# RealtimeCollab

A real-time Kanban workspace. Teams create workspaces and projects, move tasks across a board, comment on tasks, and see every change from teammates live over WebSocket.

**Stack:** React 19 + TypeScript + Vite + Tailwind · Spring Boot 3.3 (Java 21) · PostgreSQL 16 · Flyway · STOMP over WebSocket · Docker Compose + nginx

## Features

- Register, log in, log out. JWT access tokens (15 min) and rotating refresh tokens (7 days, only a SHA-256 hash is stored).
- Workspaces with `OWNER` / `MEMBER` roles. Owners invite existing users by email and remove members. Members can leave.
- Projects per workspace: create, rename, pick a colour, archive and restore. Archived projects are read-only.
- Tasks with title, description, status, priority, due date and assignee. Open a card to edit any of them. Assignees must be workspace members.
- Search the board, filter by priority, or show only your own tasks.
- Drag-and-drop Kanban board with three columns: `TODO`, `IN_PROGRESS`, `DONE`. Works with mouse, touch and keyboard.
- Task comments (add, list, delete your own).
- A real connection badge (Live / Reconnecting) and automatic reconnect with a fresh token.
- Live updates: task created / updated / moved / deleted and comments are pushed to everyone viewing the board.
- Every project, task and comment request checks workspace membership. WebSocket subscriptions are limited to the project boards the user can access.

## Quick start (Docker)

```bash
cp .env.example .env
# edit .env: set DB_PASSWORD and JWT_SECRET (min 32 chars, e.g. `openssl rand -hex 64`)
docker compose up --build
```

Open **http://localhost:8081**, register, create a workspace and a project. Open the same board in two browsers to see live updates.

Compose refuses to start without `DB_PASSWORD` and `JWT_SECRET`, and the backend refuses to start with a short or placeholder secret.

Stop with `docker compose down`. Add `-v` to also delete the database.

## Local development (without Docker)

You need Java 21, Node 22 and a local PostgreSQL 16 database.

```bash
# backend (http://localhost:8080). See backend/.env.example for the variables to export first.
cd backend && mvn spring-boot:run

# frontend (http://localhost:5173), talks to the backend on :8080
cd frontend && npm ci && npm run dev
```

In the dev server the frontend calls `http://localhost:8080`. In production builds it calls `/api` and `/ws` on its own host, which nginx proxies to the backend, so no `VITE_*` variables are required. Set `VITE_API_URL` / `VITE_WS_URL` only if the API lives on a different host.

## Configuration

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DB_PASSWORD` | yes | | Postgres password |
| `JWT_SECRET` | yes | | min 32 bytes; startup fails otherwise |
| `DB_NAME` / `DB_USER` | no | `realtimecollab` | |
| `DB_URL` | no (set by compose) | `jdbc:postgresql://localhost:5432/realtimecollab` | |
| `JWT_ACCESS_TTL` | no | `15` | minutes |
| `JWT_REFRESH_TTL` | no | `7` | days |
| `CORS_ORIGINS` | no | `http://localhost:5173,http://localhost:8081` | comma-separated browser origins; add your domain in production |

## API

All endpoints are under `/api` and need `Authorization: Bearer <accessToken>` except `/api/auth/*`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` |
| Users | `GET /users/me`, `PATCH /users/me/password` |
| Workspaces | `GET /workspaces`, `POST /workspaces`, `GET /workspaces/{id}`, `DELETE /workspaces/{id}` (owner) |
| Members | `GET /workspaces/{id}/members`, `POST /workspaces/{id}/members` (owner), `DELETE /workspaces/{id}/members/{userId}` (owner), `POST /workspaces/{id}/leave` |
| Projects | `GET/POST /workspaces/{id}/projects`, `GET/PUT /projects/{id}`, `POST /projects/{id}/archive`, `POST /projects/{id}/restore` |
| Tasks | `GET/POST /projects/{id}/tasks` (body may include `status`), `PUT /tasks/{id}`, `PATCH /tasks/{id}/move`, `DELETE /tasks/{id}` |
| Comments | `GET/POST /tasks/{id}/comments`, `DELETE /comments/{id}` |
| Health | `GET /actuator/health` (public) |

**WebSocket:** connect to `/ws` (STOMP) with an `Authorization: Bearer <token>` header on CONNECT, then subscribe to `/topic/projects/{projectId}/board`. That is the only destination allowed. Wildcards and other topics are rejected.

## Testing and CI

```bash
cd backend && mvn test     # JWT, auth flow, workspace access control, WebSocket delivery, subscription rules (H2, no external services)
cd frontend && npm run lint && npm test && npm run build   # ESLint, 24 unit/component tests, TypeScript check + production build
```

GitHub Actions (`.github/workflows/ci.yml`) runs the backend tests, applies every Flyway migration to an empty Postgres 16 database, lints, tests and builds the frontend, and validates `docker-compose.yml` on each push and pull request.

## Deployment

**One server (simplest):** any VPS with Docker. Clone, `cp .env.example .env`, set secrets and `CORS_ORIGINS=https://your-domain`, run `docker compose up -d --build`. Remove the `127.0.0.1:5432` port mapping. nginx here listens on plain HTTP, so put TLS in front (Caddy, Cloudflare, or a cloud load balancer) and forward WebSocket upgrades on `/ws`.

**Managed split:** run the backend as a Docker service with a managed Postgres, and host the frontend on Vercel/Netlify with `VITE_API_URL=https://api.your-domain/api` and `VITE_WS_URL=wss://api.your-domain/ws`. Set `CORS_ORIGINS` to the frontend's origin. Health check path: `/actuator/health`.

## Known limitations

- Access and refresh tokens are kept in `localStorage` in the browser (exposed to any XSS bug). Moving the refresh token to an `HttpOnly` cookie would be safer.
- An open WebSocket stays connected after its access token expires, and after a member is removed, until the client disconnects.
- Task create/move conflicts are last-write-wins: two people dragging the same card at the same moment is resolved by the server in arrival order.
- No rate limiting on login/register, no email delivery (invites only work for users who already registered), no presence indicators.
- Expired and revoked refresh tokens are never deleted.
- `TaskMapper` runs a few extra queries per task (fine for small boards).
